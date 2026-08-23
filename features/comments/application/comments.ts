"use server";

import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/features/auth/types";
import { createClient } from "@/lib/supabase/server";

import { isUuid, validateCommentContent } from "../domain/comment";
import {
  deleteComment,
  deleteCommentLike,
  findCommentItemId,
  findCommentLikeId,
  findCommentOwner,
  findItemId,
  insertComment,
  insertCommentLike,
} from "../infrastructure/comment-commands";
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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      error: { code: "UNAUTHENTICATED", message: "コメントを見るにはログインが必要です" },
    };
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

  try {
    const item = await findItemId(itemId);

    if (!item) {
      return { ok: false, error: { code: "NOT_FOUND", message: "展示が見つかりません" } };
    }

    const commentId = await insertComment({
      itemId,
      userId: user.id,
      content: contentResult.content,
    });

    revalidateCommentViews(itemId);
    return { ok: true, data: { commentId } };
  } catch (error) {
    console.error("Supabase comment insert error:", error);
    return { ok: false, error: { code: "INTERNAL_ERROR", message: "コメントを投稿できませんでした" } };
  }
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

  try {
    const comment = await findCommentOwner(commentId);

    if (!comment) {
      return { ok: false, error: { code: "NOT_FOUND", message: "コメントが見つかりません" } };
    }

    if (comment.userId !== user.id) {
      return { ok: false, error: { code: "FORBIDDEN", message: "このコメントは削除できません" } };
    }

    await deleteComment(commentId);
    revalidateCommentViews(comment.itemId);
    return { ok: true, data: undefined };
  } catch (error) {
    console.error("Supabase comment delete error:", error);
    return { ok: false, error: { code: "INTERNAL_ERROR", message: "コメントを削除できませんでした" } };
  }
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

  try {
    const itemId = await findCommentItemId(commentId);

    if (!itemId) {
      return { ok: false, error: { code: "NOT_FOUND", message: "コメントが見つかりません" } };
    }

    const existingLikeId = await findCommentLikeId(commentId, user.id);

    if (existingLikeId) {
      await deleteCommentLike(existingLikeId);
      revalidateCommentViews(itemId);
      return { ok: true, data: { liked: false } };
    }

    await insertCommentLike(commentId, user.id);
    revalidateCommentViews(itemId);
    return { ok: true, data: { liked: true } };
  } catch (error) {
    console.error("Supabase comment like error:", error);
    return { ok: false, error: { code: "INTERNAL_ERROR", message: "いいねを更新できませんでした" } };
  }
}
