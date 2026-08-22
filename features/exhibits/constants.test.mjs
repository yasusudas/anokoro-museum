import assert from "node:assert/strict";
import test from "node:test";

import {
  countExhibitTitleCharacters,
  MAX_EXHIBIT_TITLE_LENGTH,
} from "./constants.ts";

test("展示タイトルは絵文字を1文字として数える", () => {
  assert.equal(countExhibitTitleCharacters("🙂".repeat(21)), 21);
});

test("展示タイトルの上限は40文字である", () => {
  assert.equal(countExhibitTitleCharacters("あ".repeat(MAX_EXHIBIT_TITLE_LENGTH)), 40);
  assert.equal(countExhibitTitleCharacters("あ".repeat(MAX_EXHIBIT_TITLE_LENGTH + 1)), 41);
});
