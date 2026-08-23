import assert from "node:assert/strict";
import test from "node:test";

import { getSafeNextPath } from "./next-path.ts";

const origin = "https://museum.example";

test("値がない場合はトップへ戻す", () => {
  assert.equal(getSafeNextPath(null, origin), "/");
  assert.equal(getSafeNextPath(undefined, origin), "/");
  assert.equal(getSafeNextPath("", origin), "/");
});

test("同一サイトの相対パスはそのまま採用する", () => {
  assert.equal(getSafeNextPath("/exhibits/new", origin), "/exhibits/new");
});

test("query stringとhashを保持する", () => {
  assert.equal(getSafeNextPath("/?exhibit=abc#comments", origin), "/?exhibit=abc#comments");
});

test("同一originの絶対URLはパス部分だけを採用する", () => {
  assert.equal(getSafeNextPath(`${origin}/exhibits/new?a=1#b`, origin), "/exhibits/new?a=1#b");
});

test("protocol-relative URLは外部扱いで弾く", () => {
  assert.equal(getSafeNextPath("//evil.com", origin), "/");
  assert.equal(getSafeNextPath("////evil.com", origin), "/");
});

test("バックスラッシュはURL解釈で/と同じになるため弾く", () => {
  assert.equal(getSafeNextPath("/\\evil.com", origin), "/");
  assert.equal(getSafeNextPath("\\\\evil.com", origin), "/");
});

test("外部originの絶対URLを弾く", () => {
  assert.equal(getSafeNextPath("https://evil.com/steal", origin), "/");
});

test("javascriptスキームを弾く", () => {
  assert.equal(getSafeNextPath("javascript:alert(1)", origin), "/");
});

test("解釈できない値を弾く", () => {
  assert.equal(getSafeNextPath("http://[", origin), "/");
});

test("基準originが不正な場合も安全側へ倒す", () => {
  assert.equal(getSafeNextPath("/exhibits/new", "not-an-origin"), "/");
});
