"use server";

import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/features/auth/types";
import { createClient } from "@/lib/supabase/server";

import { isUuid, validateCommentContent } from "../domain/comment";
import { findComments } from "../infrastructure/find-comments";
import type { CommentView } from "../types";

function validationError(message: string, field = "content"): ActionResult<never> {
  return {
    ok: false,
    error: {
      code: "VALIDATION_ERROR",
      message,
      fieldErrors: { [field]: [message] },
    },
  };
}

function revalidateCommentViews(itemId: string) {
  revalidatePath("/");

  if (isUuid(itemId)) {
    revalidatePath(`/exhibits/${itemId}`);
  }
}

export async function getCommentsAction(itemId: string): Promise<ActionResult<CommentView[]>> {
  if (!isUuid(itemId)) {
    return { ok: true, data: [] };
  }

  try {
    return { ok: true, data: await findComments(itemId) };
  } catch (error) {
    console.error("Supabase comments query error:", error);
    return {
      ok: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "コメントを読み込めませんでした。もう一度お試しください",
      },
    };
  }
}

export async function createCommentAction(
  formData: FormData,
): Promise<ActionResult<{ commentId: string }>> {
  const itemId = String(formData.get("itemId") ?? "").trim();
  const contentResult = validateCommentContent(formData.get("content"));

  if (!isUuid(itemId)) {
    return validationError("展示を正しく指定してください", "itemId");
  }

  if (!contentResult.ok) {
    return validationError(contentResult.message);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      error: { code: "UNAUTHENTICATED", message: "コメントするにはログインが必要です" },
    };
  }

  const { data: item, error: itemError } = await supabase
    .from("items")
    .select("id")
    .eq("id", itemId)
    .maybeSingle();

  if (itemError) {
    console.error("Supabase item lookup error:", itemError);
    return { ok: false, error: { code: "INTERNAL_ERROR", message: "コメントを投稿できませんでした" } };
  }

  if (!item) {
    return { ok: false, error: { code: "NOT_FOUND", message: "展示が見つかりません" } };
  }

  const { data: comment, error } = await supabase
    .from("comments")
    .insert({ item_id: itemId, user_id: user.id, content: contentResult.content })
    .select("id")
    .single();

  if (error || !comment) {
    console.error("Supabase comment insert error:", error);
    return { ok: false, error: { code: "INTERNAL_ERROR", message: "コメントを投稿できませんでした" } };
  }

  revalidateCommentViews(itemId);
  return { ok: true, data: { commentId: comment.id } };
}

export async function deleteCommentAction(formData: FormData): Promise<ActionResult> {
  const commentId = String(formData.get("commentId") ?? "").trim();

  if (!isUuid(commentId)) {
    return validationError("コメントを正しく指定してください", "commentId");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      error: { code: "UNAUTHENTICATED", message: "削除するにはログインが必要です" },
    };
  }

  const { data: comment, error: findError } = await supabase
    .from("comments")
    .select("item_id, user_id")
    .eq("id", commentId)
    .maybeSingle();

  if (findError) {
    console.error("Supabase comment lookup error:", findError);
    return { ok: false, error: { code: "INTERNAL_ERROR", message: "コメントを削除できませんでした" } };
  }

  if (!comment) {
    return { ok: false, error: { code: "NOT_FOUND", message: "コメントが見つかりません" } };
  }

  if (comment.user_id !== user.id) {
    return { ok: false, error: { code: "FORBIDDEN", message: "このコメントは削除できません" } };
  }

  const { error } = await supabase.from("comments").delete().eq("id", commentId);

  if (error) {
    console.error("Supabase comment delete error:", error);
    return { ok: false, error: { code: "INTERNAL_ERROR", message: "コメントを削除できませんでした" } };
  }

  revalidateCommentViews(comment.item_id);
  return { ok: true, data: undefined };
}

export async function toggleCommentLikeAction(
  formData: FormData,
): Promise<ActionResult<{ liked: boolean }>> {
  const commentId = String(formData.get("commentId") ?? "").trim();

  if (!isUuid(commentId)) {
    return validationError("コメントを正しく指定してください", "commentId");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      error: { code: "UNAUTHENTICATED", message: "いいねするにはログインが必要です" },
    };
  }

  const { data: comment, error: commentError } = await supabase
    .from("comments")
    .select("id, item_id")
    .eq("id", commentId)
    .maybeSingle();

  if (commentError) {
    console.error("Supabase comment lookup error:", commentError);
    return { ok: false, error: { code: "INTERNAL_ERROR", message: "いいねを更新できませんでした" } };
  }

  if (!comment) {
    return { ok: false, error: { code: "NOT_FOUND", message: "コメントが見つかりません" } };
  }

  const { data: existingLike, error: likeLookupError } = await supabase
    .from("comment_likes")
    .select("id")
    .eq("comment_id", commentId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (likeLookupError) {
    console.error("Supabase comment like lookup error:", likeLookupError);
    return { ok: false, error: { code: "INTERNAL_ERROR", message: "いいねを更新できませんでした" } };
  }

  if (existingLike) {
    const { error } = await supabase.from("comment_likes").delete().eq("id", existingLike.id);
    if (error) {
      console.error("Supabase comment unlike error:", error);
      return { ok: false, error: { code: "INTERNAL_ERROR", message: "いいねを解除できませんでした" } };
    }

    revalidateCommentViews(comment.item_id);
    return { ok: true, data: { liked: false } };
  }

  const { error } = await supabase
    .from("comment_likes")
    .insert({ comment_id: commentId, user_id: user.id });

  if (error) {
    console.error("Supabase comment like error:", error);
    return { ok: false, error: { code: "CONFLICT", message: "いいねを更新できませんでした" } };
  }

  revalidateCommentViews(comment.item_id);
  return { ok: true, data: { liked: true } };
}
