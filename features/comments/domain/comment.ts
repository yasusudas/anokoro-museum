export const MAX_COMMENT_LENGTH = 500;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type CommentValidation =
  | { ok: true; content: string }
  | { ok: false; message: string };

export function validateCommentContent(value: unknown): CommentValidation {
  if (typeof value !== "string") {
    return { ok: false, message: "コメントを入力してください" };
  }

  const content = value.trim();

  if (content.length === 0) {
    return { ok: false, message: "コメントを入力してください" };
  }

  if (content.length > MAX_COMMENT_LENGTH) {
    return { ok: false, message: `コメントは${MAX_COMMENT_LENGTH}文字以内で入力してください` };
  }

  return { ok: true, content };
}

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}
