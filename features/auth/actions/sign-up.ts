"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "../types";

export async function signUpAction(formData: FormData): Promise<ActionResult> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  const fieldErrors: Record<string, string[]> = {};

  if (!name) {
    fieldErrors.name = ["表示名を入力してください"];
  }

  if (!email) {
    fieldErrors.email = ["メールアドレスを入力してください"];
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fieldErrors.email = ["メールアドレスの形式が正しくありません"];
  }

  if (!password) {
    fieldErrors.password = ["パスワードを入力してください"];
  } else if (password.length < 8) {
    fieldErrors.password = ["パスワードは8文字以上で入力してください"];
  } else if (!/^[A-Za-z0-9]+$/.test(password)) {
    fieldErrors.password = ["パスワードは半角英数字で入力してください"];
  }

  if (!confirmPassword) {
    fieldErrors.confirmPassword = ["パスワードをもう一度入力してください"];
  } else if (password !== confirmPassword) {
    fieldErrors.confirmPassword = ["パスワードが一致しません"];
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

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        user_name: name,
        display_name: name,
      },
    },
  });

  if (error) {
    console.error("Supabase signUp error:", error);

    const errorMessage = error.message.toLowerCase();

    if (errorMessage.includes("already registered") || error.code === "user_already_exists") {
      return {
        ok: false,
        error: {
          code: "CONFLICT",
          message: "このメールアドレスは既に登録されています",
          fieldErrors: {
            email: ["このメールアドレスは既に登録されています"],
          },
        },
      };
    }

    if (errorMessage.includes("invalid") && errorMessage.includes("email")) {
      return {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "有効なメールアドレスを入力してください（例: @gmail.com などの実在ドメイン）",
          fieldErrors: {
            email: ["有効なメールアドレスを入力してください"],
          },
        },
      };
    }

    if (errorMessage.includes("rate limit") || error.code === "over_email_send_rate_limit") {
      return {
        ok: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "メール送信の制限に達しました。少し時間をおいてから再度お試しください",
        },
      };
    }

    return {
      ok: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error.message || "登録に失敗しました。時間をおいて再度お試しください",
      },
    };
  }

  revalidatePath("/", "layout");

  return { ok: true, data: undefined };
}
