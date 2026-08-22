import { createClient } from "@/lib/supabase/server";

function isUniqueViolation(error: { code?: string } | null | undefined) {
  return error?.code === "23505";
}

export async function findItemId(itemId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("items").select("id").eq("id", itemId).maybeSingle();

  if (error) {
    throw new Error(`展示の確認に失敗しました: ${error.message}`);
  }

  return data?.id ?? null;
}

export async function insertComment(input: {
  itemId: string;
  userId: string;
  content: string;
}): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comments")
    .insert({ item_id: input.itemId, user_id: input.userId, content: input.content })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`コメント投稿に失敗しました: ${error?.message ?? "unknown"}`);
  }

  return data.id;
}

export async function findCommentOwner(
  commentId: string,
): Promise<{ itemId: string; userId: string } | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comments")
    .select("item_id, user_id")
    .eq("id", commentId)
    .maybeSingle();

  if (error) {
    throw new Error(`コメント取得に失敗しました: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return { itemId: data.item_id, userId: data.user_id };
}

export async function deleteComment(commentId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("comments").delete().eq("id", commentId);

  if (error) {
    throw new Error(`コメント削除に失敗しました: ${error.message}`);
  }
}

export async function findCommentItemId(commentId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comments")
    .select("id, item_id")
    .eq("id", commentId)
    .maybeSingle();

  if (error) {
    throw new Error(`コメント取得に失敗しました: ${error.message}`);
  }

  return data?.item_id ?? null;
}

export async function findCommentLikeId(
  commentId: string,
  userId: string,
): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comment_likes")
    .select("id")
    .eq("comment_id", commentId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`いいね情報の取得に失敗しました: ${error.message}`);
  }

  return data?.id ?? null;
}

export async function deleteCommentLike(likeId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("comment_likes").delete().eq("id", likeId);

  if (error) {
    throw new Error(`いいねの解除に失敗しました: ${error.message}`);
  }
}

export async function insertCommentLike(
  commentId: string,
  userId: string,
): Promise<"created" | "already_exists"> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("comment_likes")
    .insert({ comment_id: commentId, user_id: userId });

  if (!error) {
    return "created";
  }

  if (isUniqueViolation(error)) {
    return "already_exists";
  }

  throw new Error(`いいねの付与に失敗しました: ${error.message}`);
}
