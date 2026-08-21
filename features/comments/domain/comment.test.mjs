import assert from "node:assert/strict";
import test from "node:test";

import { splitCommentContent, validateCommentContent } from "./comment.ts";

test("ASCII URLのリンク化と末尾記号の扱いを維持する", () => {
  assert.deepEqual(splitCommentContent("詳しくは https://example.com/path?a=1&b=2。"), [
    { type: "text", value: "詳しくは " },
    { type: "url", value: "https://example.com/path?a=1&b=2" },
    { type: "text", value: "。" },
  ]);
});

test("Unicodeホスト名・パス・クエリを1つのURLとして保持する", () => {
  assert.deepEqual(
    splitCommentContent("展示はこちら https://例え.テスト/展示/思い出?言語=日本語。"),
    [
      { type: "text", value: "展示はこちら " },
      { type: "url", value: "https://例え.テスト/展示/思い出?言語=日本語" },
      { type: "text", value: "。" },
    ],
  );
});

test("コメント長はUTF-16ではなくコードポイントで数える", () => {
  const withinLimit = "🙂".repeat(500);
  const overLimit = `${withinLimit}🙂`;

  assert.equal(validateCommentContent(withinLimit).ok, true);
  assert.equal(validateCommentContent(overLimit).ok, false);
});
