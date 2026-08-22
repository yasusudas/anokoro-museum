export const EXHIBIT_CATEGORIES = [
  "食べ物",
  "テレビ",
  "アニメ",
  "ゲーム",
  "音楽",
  "本",
  "出来事",
  "その他",
] as const;

export type ExhibitCategory = (typeof EXHIBIT_CATEGORIES)[number];

const LEGACY_CATEGORY_MAP: Readonly<Record<string, ExhibitCategory>> = {
  おかし: "食べ物",
  たべもの: "食べ物",
  ほん: "本",
  できごと: "出来事",
  ガジェット: "その他",
  インターネット: "その他",
};

export function isExhibitCategory(value: string): value is ExhibitCategory {
  return EXHIBIT_CATEGORIES.some((category) => category === value);
}

export function normalizeExhibitCategory(value: string): ExhibitCategory {
  if (isExhibitCategory(value)) return value;
  return LEGACY_CATEGORY_MAP[value] ?? "その他";
}
