"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "../types";

export async function signInAction(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const fieldErrors: Record<string, string[]> = {};

  if (!email) {
    fieldErrors.email = ["メールアドレスを入力してください"];
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fieldErrors.email = ["メールアドレスの形式が正しくありません"];
  }

  if (!password) {
    fieldErrors.password = ["パスワードを入力してください"];
  } else if (password.length < 8) {
    fieldErrors.password = ["パスワードは8文字以上で入力してください"];
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "入力内容をご確認ください",
        fieldErrors,
      },
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Supabase signIn error:", error);

    const errorMessage = error.message.toLowerCase();

    if (errorMessage.includes("email not confirmed")) {
      return {
        ok: false,
        error: {
          code: "UNAUTHENTICATED",
          message: "メールアドレスの確認が完了していません。設定変更前に登録されたアカウントの場合は、新しく新規登録をお試しください",
        },
      };
    }

    return {
      ok: false,
      error: {
        code: "UNAUTHENTICATED",
        message: "メールアドレスまたはパスワードが正しくありません",
      },
    };
  }

  revalidatePath("/", "layout");

  return { ok: true, data: undefined };
}
