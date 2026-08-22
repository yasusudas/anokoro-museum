"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionResult, ToggleShinmiriData } from "../types";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function toggleShinmiriAction(
  itemId: string
): Promise<ActionResult<ToggleShinmiriData>> {
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
        message: "しんみりリアクションにはログインが必要です。",
      },
    };
  }

  if (!itemId || !UUID_REGEX.test(itemId)) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "不正な展示IDです。",
      },
    };
  }

  const { data: item, error: itemError } = await supabase
    .from("items")
    .select("id")
    .eq("id", itemId)
    .single();

  if (itemError || !item) {
    return {
      ok: false,
      error: {
        code: "NOT_FOUND",
        message: "指定された展示が見つかりません。",
      },
    };
  }

  const { data: existingReaction, error: reactionCheckError } = await supabase
    .from("shinmiri_reactions")
    .select("id")
    .eq("item_id", itemId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (reactionCheckError) {
    console.error("Error checking reaction:", reactionCheckError);
    return {
      ok: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "リアクション状態の確認に失敗しました。",
      },
    };
  }

  let isShinmiri: boolean;

  if (existingReaction) {
    const { error: deleteError } = await supabase
      .from("shinmiri_reactions")
      .delete()
      .eq("item_id", itemId)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Error removing reaction:", deleteError);
      return {
        ok: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "しんみりの解除に失敗しました。",
        },
      };
    }
    isShinmiri = false;
  } else {
    const { error: insertError } = await supabase
      .from("shinmiri_reactions")
      .insert({
        item_id: itemId,
        user_id: user.id,
      });

    if (insertError) {
      console.error("Error adding reaction:", insertError);
      return {
        ok: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "しんみりの追加に失敗しました。",
        },
      };
    }
    isShinmiri = true;
  }

  const { count, error: countError } = await supabase
    .from("shinmiri_reactions")
    .select("id", { count: "exact", head: true })
    .eq("item_id", itemId);

  if (countError || count === null) {
    console.error("Error fetching updated shinmiri count:", countError);
    revalidatePath("/", "layout");

    return {
      ok: true,
      data: {
        itemId,
        isShinmiri,
      },
    };
  }

  revalidatePath("/", "layout");

  return {
    ok: true,
    data: {
      itemId,
      isShinmiri,
      shinmiriCount: count,
    },
  };
}
