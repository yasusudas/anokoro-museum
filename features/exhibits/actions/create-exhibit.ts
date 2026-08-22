"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { isExhibitCategory } from "../categories";
import type { ActionResult, CreateExhibitData } from "../types";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function createExhibitAction(
  formData: FormData
): Promise<ActionResult<CreateExhibitData>> {
  const supabase = await createClient();

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

  const title = String(formData.get("title") ?? "").trim();
  const description = String(
    formData.get("description") ?? formData.get("body") ?? formData.get("subtitle") ?? ""
  ).trim();
  const category = String(formData.get("category") ?? "").trim();
  const rawYear = String(formData.get("year") ?? "").trim();
  const imageFile = formData.get("image");

  const currentYear = Number(
    new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Tokyo", year: "numeric" }).format(new Date())
  );
  const fieldErrors: Record<string, string[]> = {};

  if (!title) {
    fieldErrors.title = ["展示タイトルを入力してください。"];
  } else if (title.length > 100) {
    fieldErrors.title = ["展示タイトルは100文字以内で入力してください。"];
  }

  if (!description) {
    fieldErrors.description = ["思い出の本文を入力してください。"];
  } else if (description.length > 500) {
    fieldErrors.description = ["思い出の本文は500文字以内で入力してください。"];
  }

  if (!category) {
    fieldErrors.category = ["カテゴリを選択してください。"];
  } else if (!isExhibitCategory(category)) {
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

  if (!imageFile || !(imageFile instanceof File) || imageFile.size === 0) {
    fieldErrors.image = ["画像ファイルを選択してください。"];
  } else if (!ALLOWED_IMAGE_TYPES.includes(imageFile.type)) {
    fieldErrors.image = ["JPEG、PNG、WebP形式の画像を選択してください。"];
  } else if (imageFile.size > MAX_IMAGE_SIZE_BYTES) {
    fieldErrors.image = ["画像サイズは5MB以下にしてください。"];
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

  const { data: existingItem, error: checkError } = await supabase
    .from("items")
    .select("id")
    .eq("title", title)
    .limit(1)
    .maybeSingle();

  if (checkError) {
    console.error("Database duplicate check error:", checkError);
  }

  if (existingItem) {
    return {
      ok: false,
      error: {
        code: "CONFLICT",
        message: "その展示品は寄贈されています",
        fieldErrors: {
          title: ["その展示品は寄贈されています"],
        },
      },
    };
  }

  const validImageFile = imageFile as File;
  let finalImageUrl: string;
  let uploadedStoragePath: string | null = null;

  try {
    const ext = validImageFile.name.split(".").pop()?.toLowerCase() || "jpg";
    const fileName = `${user.id}/${Date.now()}_${crypto.randomUUID()}.${ext}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("exhibits")
      .upload(fileName, validImageFile, {
        contentType: validImageFile.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return {
        ok: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "画像のアップロードに失敗しました。時間をおいて再試行してください。",
        },
      };
    }

    uploadedStoragePath = uploadData.path;

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

    if (uploadedStoragePath) {
      await supabase.storage.from("exhibits").remove([uploadedStoragePath]).catch(() => {});
    }

    if (insertError?.code === "23505") {
      return {
        ok: false,
        error: {
          code: "CONFLICT",
          message: "その展示品は寄贈されています",
          fieldErrors: {
            title: ["その展示品は寄贈されています"],
          },
        },
      };
    }

    return {
      ok: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "展示の保存に失敗しました。もう一度お試しください。",
      },
    };
  }

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
