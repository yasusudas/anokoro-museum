import assert from "node:assert/strict";
import test from "node:test";

import { sortExhibitsByYear } from "./sort.ts";

const createExhibit = (id, year) => ({
  id,
  number: id,
  title: id,
  category: "その他",
  year,
  description: id,
  shinmiriCount: 0,
  createdAt: "2026-08-22T00:00:00Z",
});

test("展示をyearのYYYY部分が小さい順に並べ、年代未設定は末尾に置く", () => {
  const exhibits = [
    createExhibit("newer", "2011"),
    createExhibit("older", "1994"),
    createExhibit("without-year", ""),
    createExhibit("middle", "2004"),
  ];

  assert.deepEqual(
    sortExhibitsByYear(exhibits).map((exhibit) => exhibit.id),
    ["older", "middle", "newer", "without-year"]
  );
});

test("ソート元の展示配列を変更しない", () => {
  const exhibits = [createExhibit("newer", "2011"), createExhibit("older", "1994")];

  sortExhibitsByYear(exhibits);

  assert.deepEqual(exhibits.map((exhibit) => exhibit.id), ["newer", "older"]);
});
