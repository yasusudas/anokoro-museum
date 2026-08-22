import assert from "node:assert/strict";
import test from "node:test";

import {
  EXHIBIT_CATEGORIES,
  isExhibitCategory,
  normalizeExhibitCategory,
} from "./categories.ts";

test("展示ジャンルを指定された8種類に限定する", () => {
  assert.deepEqual(EXHIBIT_CATEGORIES, [
    "食べ物",
    "テレビ",
    "アニメ",
    "ゲーム",
    "音楽",
    "本",
    "出来事",
    "その他",
  ]);
});

test("一覧に含まれる値だけを展示ジャンルとして扱う", () => {
  assert.equal(isExhibitCategory("ゲーム"), true);
  assert.equal(isExhibitCategory("おかし"), false);
});

test("DBの旧ジャンルを新ジャンルへ正規化する", () => {
  assert.equal(normalizeExhibitCategory("音楽"), "音楽");
  assert.equal(normalizeExhibitCategory("おかし"), "食べ物");
  assert.equal(normalizeExhibitCategory("ほん"), "本");
});

test("DBから取得した未知の値はその他に正規化する", () => {
  assert.equal(normalizeExhibitCategory("自由入力"), "その他");
});
