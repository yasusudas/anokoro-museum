"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { ActionResult } from "../types";

export async function signOutAction(): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Supabase signOut error:", error);
    return {
      ok: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "ログアウトに失敗しました。時間をおいて再度お試しください",
      },
    };
  }

  redirect("/sign-in");
}
