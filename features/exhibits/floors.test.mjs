import assert from "node:assert/strict";
import { filterExhibitsByFloor } from "./floors.ts";

const testExhibits = [
  {
    id: "item-1",
    number: "No.01",
    title: "初代PlayStation",
    category: "ゲーム",
    year: "1994",
    description: "懐かしいゲーム機",
    shinmiriCount: 10,
    isShinmiri: true,
    createdAt: "2026-08-22T00:00:00Z",
  },
  {
    id: "item-2",
    number: "No.02",
    title: "ニンテンドーDS",
    category: "ゲーム",
    year: "2004",
    description: "ダブルスクリーン",
    shinmiriCount: 5,
    isShinmiri: false,
    createdAt: "2026-08-22T00:00:00Z",
  },
  {
    id: "item-3",
    number: "No.03",
    title: "ニンテンドー3DS",
    category: "ゲーム",
    year: "2011",
    description: "飛び出す画面",
    shinmiriCount: 8,
    isShinmiri: true,
    createdAt: "2026-08-22T00:00:00Z",
  },
  {
    id: "item-4",
    number: "No.04",
    title: "Nintendo Switch",
    category: "ゲーム",
    year: "2017",
    description: "持ち運べる据置機",
    shinmiriCount: 2,
    isShinmiri: false,
    createdAt: "2026-08-22T00:00:00Z",
  },
  {
    id: "item-5",
    number: "No.05",
    title: "PlayStation 5",
    category: "ゲーム",
    year: "2020",
    description: "次世代機",
    shinmiriCount: 1,
    isShinmiri: false,
    createdAt: "2026-08-22T00:00:00Z",
  },
  {
    id: "item-6",
    number: "No.06",
    title: "未来のガジェット",
    category: "ガジェット",
    year: "2025",
    description: "最新の記憶",
    shinmiriCount: 0,
    isShinmiri: false,
    createdAt: "2026-08-22T00:00:00Z",
  },
];

console.log("🧪 Testing Museum Floor Filtering Logic...\n");

// 1. B1F（自分だけの企画展: shinmiriItems）
const b1fItems = filterExhibitsByFloor(testExhibits, "B1F", ["item-1", "item-3"]);
assert.equal(b1fItems.length, 2);
assert.deepEqual(b1fItems.map((i) => i.id), ["item-1", "item-3"]);
console.log("✅ B1F filter passed (returns only liked items)");

// 2. 2F（〜2009年）
const f2Items = filterExhibitsByFloor(testExhibits, "2F", []);
assert.equal(f2Items.length, 2);
assert.deepEqual(f2Items.map((i) => i.id), ["item-1", "item-2"]);
console.log("✅ 2F filter passed (<= 2009)");

// 3. 3F（2010〜2014年）
const f3Items = filterExhibitsByFloor(testExhibits, "3F", []);
assert.equal(f3Items.length, 1);
assert.deepEqual(f3Items.map((i) => i.id), ["item-3"]);
console.log("✅ 3F filter passed (2010..2014)");

// 4. 4F（2015〜2019年）
const f4Items = filterExhibitsByFloor(testExhibits, "4F", []);
assert.equal(f4Items.length, 1);
assert.deepEqual(f4Items.map((i) => i.id), ["item-4"]);
console.log("✅ 4F filter passed (2015..2019)");

// 5. 5F（2020〜2024年）
const f5Items = filterExhibitsByFloor(testExhibits, "5F", []);
assert.equal(f5Items.length, 1);
assert.deepEqual(f5Items.map((i) => i.id), ["item-5"]);
console.log("✅ 5F filter passed (2020..2024)");

// 6. 6F（2025年〜）
const f6Items = filterExhibitsByFloor(testExhibits, "6F", []);
assert.equal(f6Items.length, 1);
assert.deepEqual(f6Items.map((i) => i.id), ["item-6"]);
console.log("✅ 6F filter passed (>= 2025)");

console.log("\n🎉 All Floor Filtering Tests Passed!");
