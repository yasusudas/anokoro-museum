export const MAX_COMMENT_LENGTH = 500;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const URL_CAPTURE_PATTERN = /(https?:\/\/[^\s<]+)/g;
const ASCII_URL_CODE_POINT_PATTERN = /[A-Za-z0-9\-._~:/?#\[\]@!$&'()*+,;=%]/;
const UNICODE_URL_CODE_POINT_PATTERN = /[^\x00-\x7F]/u;
const TRAILING_URL_MARKERS = new Set([
  ".",
  ",",
  ";",
  ":",
  "!",
  "?",
  ")",
  "]",
  "}",
  "\"",
  "'",
  "。",
  "、",
  "，",
  "．",
  "！",
  "？",
  "）",
  "】",
  "」",
  "』",
  "》",
  ">",
  "”",
  "’",
]);

export type CommentContentPart =
  | { type: "text"; value: string }
  | { type: "url"; value: string };

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

function countChar(value: string, character: string) {
  return [...value].filter((current) => current === character).length;
}

function isUrlCodePoint(character: string) {
  return (
    ASCII_URL_CODE_POINT_PATTERN.test(character) ||
    UNICODE_URL_CODE_POINT_PATTERN.test(character)
  );
}

function splitUrlMatch(rawUrl: string): { href: string; trailing: string } {
  const characters = [...rawUrl];
  let hrefLength = 0;

  for (const character of characters) {
    if (!isUrlCodePoint(character)) {
      break;
    }
    hrefLength += 1;
  }

  let href = characters.slice(0, hrefLength).join("");
  let trailing = characters.slice(hrefLength).join("");

  while (href.length > 0) {
    const last = [...href].at(-1);
    if (!last || !TRAILING_URL_MARKERS.has(last)) {
      break;
    }

    if (last === ")" && countChar(href, "(") >= countChar(href, ")")) {
      break;
    }

    trailing = last + trailing;
    href = href.slice(0, href.length - last.length);
  }

  return { href, trailing };
}

export function splitCommentContent(content: string): CommentContentPart[] {
  const parts: CommentContentPart[] = [];
  let lastIndex = 0;

  for (const match of content.matchAll(URL_CAPTURE_PATTERN)) {
    const rawUrl = match[0];
    const index = match.index ?? 0;

    if (index > lastIndex) {
      parts.push({ type: "text", value: content.slice(lastIndex, index) });
    }

    const { href, trailing } = splitUrlMatch(rawUrl);
    if (href) {
      parts.push({ type: "url", value: href });
    }
    if (trailing) {
      parts.push({ type: "text", value: trailing });
    }

    lastIndex = index + rawUrl.length;
  }

  if (lastIndex < content.length) {
    parts.push({ type: "text", value: content.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ type: "text", value: content }];
}
