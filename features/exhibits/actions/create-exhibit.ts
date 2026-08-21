"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionResult, CreateExhibitData } from "../types";

const ALLOWED_CATEGORIES = [
  "おかし",
  "ゲーム",
  "たべもの",
  "ほん",
  "できごと",
  "ガジェット",
  "インターネット",
];

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function createExhibitAction(
  formData: FormData
): Promise<ActionResult<CreateExhibitData>> {
  const supabase = await createClient();

  // 1. ユーザー認証の確認（ログイン必須）
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      ok: false,
      error: {
        code: "UNAUTHENTICATED",
        message: "展示を投稿するにはログインが必要です。",
      },
    };
  }

  // 2. フォーム入力値の取得
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? formData.get("body") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const rawYear = String(formData.get("year") ?? "").trim();
  const rawImageUrl = String(formData.get("imageUrl") ?? "").trim();
  const imageFile = formData.get("image");

  const currentYear = new Date().getFullYear();
  const fieldErrors: Record<string, string[]> = {};

  // 3. バリデーション
  if (!title) {
    fieldErrors.title = ["展示タイトルを入力してください。"];
  } else if (title.length > 100) {
    fieldErrors.title = ["展示タイトルは100文字以内で入力してください。"];
  }

  if (!description) {
    fieldErrors.description = ["思い出の本文を入力してください。"];
  } else if (description.length > 1000) {
    fieldErrors.description = ["思い出の本文は1000文字以内で入力してください。"];
  }

  if (!category) {
    fieldErrors.category = ["カテゴリを選択してください。"];
  } else if (!ALLOWED_CATEGORIES.includes(category)) {
    fieldErrors.category = ["有効なカテゴリを選択してください。"];
  }

  let parsedYear = 2000;
  if (!rawYear) {
    fieldErrors.year = ["年代（西暦）を入力してください。"];
  } else {
    parsedYear = parseInt(rawYear, 10);
    if (isNaN(parsedYear) || parsedYear < 1900 || parsedYear > currentYear) {
      fieldErrors.year = [`1900年から${currentYear}年の範囲で西暦4桁を入力してください。`];
    }
  }

  // 画像ファイルの検証
  let isImageFileProvided = false;
  if (imageFile && imageFile instanceof File && imageFile.size > 0) {
    isImageFileProvided = true;
    if (!ALLOWED_IMAGE_TYPES.includes(imageFile.type)) {
      fieldErrors.image = ["JPEG、PNG、WebP形式の画像を選択してください。"];
    } else if (imageFile.size > MAX_IMAGE_SIZE_BYTES) {
      fieldErrors.image = ["画像サイズは5MB以下にしてください。"];
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "入力内容をご確認ください。",
        fieldErrors,
      },
    };
  }

  // 4. 画像の保存とURL発行
  let finalImageUrl: string | null = rawImageUrl || null;
  let uploadedStoragePath: string | null = null;

  if (isImageFileProvided && imageFile instanceof File) {
    try {
      const ext = imageFile.name.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `${user.id}/${Date.now()}_${crypto.randomUUID()}.${ext}`;

      // Supabase Storage (exhibits バケット) にアップロード
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("exhibits")
        .upload(fileName, imageFile, {
          contentType: imageFile.type,
          upsert: false,
        });

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        // バケット未作成等のフォールバック: エラーで弾くかURL無しにする
        return {
          ok: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "画像のアップロードに失敗しました。時間をおいて再試行してください。",
          },
        };
      }

      uploadedStoragePath = uploadData.path;

      // 公開URLを自動発行・取得
      const {
        data: { publicUrl },
      } = supabase.storage.from("exhibits").getPublicUrl(uploadedStoragePath);

      finalImageUrl = publicUrl;
    } catch (e) {
      console.error("Image processing error:", e);
      return {
        ok: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "画像処理中にエラーが発生しました。",
        },
      };
    }
  }

  // 5. データベース (public.items) に展示情報を INSERT
  const { data: newItem, error: insertError } = await supabase
    .from("items")
    .insert({
      user_id: user.id,
      title,
      description,
      category,
      year: parsedYear,
      image_url: finalImageUrl,
    })
    .select("id, title, image_url")
    .single();

  if (insertError || !newItem) {
    console.error("Database insert error:", insertError);

    // ロールバック: DB保存失敗時はアップロードした孤立画像を削除
    if (uploadedStoragePath) {
      await supabase.storage.from("exhibits").remove([uploadedStoragePath]).catch(() => {});
    }

    return {
      ok: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "展示の保存に失敗しました。もう一度お試しください。",
      },
    };
  }

  // 6. キャッシュ再検証（トップ回廊画面などを最新化）
  revalidatePath("/", "layout");
  revalidatePath("/exhibits");

  return {
    ok: true,
    data: {
      id: newItem.id,
      title: newItem.title,
      imageUrl: newItem.image_url,
    },
  };
}
