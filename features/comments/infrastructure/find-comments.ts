import { createClient } from "@/lib/supabase/server";

import { isUuid } from "../domain/comment";
import type { CommentView } from "../types";

export async function findComments(itemId: string): Promise<CommentView[]> {
  if (!isUuid(itemId)) {
    return [];
  }

  const supabase = await createClient();
  const { data: comments, error } = await supabase
    .from("comments")
    .select("id, item_id, user_id, content, created_at, users(user_name)")
    .eq("item_id", itemId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`コメント取得に失敗しました: ${error.message}`);
  }

  const commentIds = comments.map((comment) => comment.id);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [likeCountsResult, likedCommentsResult] = await Promise.all([
    commentIds.length > 0
      ? supabase.rpc("get_comment_like_counts", { comment_ids: commentIds })
      : Promise.resolve({ data: [], error: null }),
    user && commentIds.length > 0
      ? supabase
          .from("comment_likes")
          .select("comment_id")
          .eq("user_id", user.id)
          .in("comment_id", commentIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (likeCountsResult.error) {
    console.error("Supabase comment like counts query error:", likeCountsResult.error);
  }

  if (likedCommentsResult.error) {
    console.error("Supabase liked comments query error:", likedCommentsResult.error);
  }

  const likeCounts = new Map(
    (likeCountsResult.error ? [] : likeCountsResult.data ?? []).map((row) => [
      row.comment_id,
      row.like_count,
    ]),
  );
  const likedCommentIds = new Set(
    (likedCommentsResult.error ? [] : likedCommentsResult.data ?? []).map(
      (row) => row.comment_id,
    ),
  );

  return comments.map((comment) => ({
    id: comment.id,
    itemId: comment.item_id,
    authorName: comment.users?.user_name ?? "あのころの来場者",
    content: comment.content,
    createdAt: comment.created_at,
    likeCount: likeCounts.get(comment.id) ?? 0,
    isLikedByCurrentUser: likedCommentIds.has(comment.id),
    canDelete: user?.id === comment.user_id,
  }));
}
