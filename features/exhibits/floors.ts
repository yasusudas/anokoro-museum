import type { ExhibitItem } from "./types";

export type FloorId = "B1F" | "1F" | "2F" | "3F" | "4F" | "5F" | "6F";

export type FloorDefinition = {
  id: FloorId;
  label: string;
  era: string;
  name: string;
  description: string;
  minYear?: number;
  maxYear?: number;
};

export const MUSEUM_FLOORS: FloorDefinition[] = [
  {
    id: "6F",
    label: "6F",
    era: "2025年〜",
    name: "現代とこれから",
    description: "2025年以降の新しい記憶",
    minYear: 2025,
  },
  {
    id: "5F",
    label: "5F",
    era: "2020〜2024年",
    name: "おうち時間と新しい日常",
    description: "2020〜2024年のあのころ",
    minYear: 2020,
    maxYear: 2024,
  },
  {
    id: "4F",
    label: "4F",
    era: "2015〜2019年",
    name: "SNS時代の幕開け",
    description: "2015〜2019年のあのころ",
    minYear: 2015,
    maxYear: 2019,
  },
  {
    id: "3F",
    label: "3F",
    era: "2010〜2014年",
    name: "スマホの台頭",
    description: "2010〜2014年のあのころ",
    minYear: 2010,
    maxYear: 2014,
  },
  {
    id: "2F",
    label: "2F",
    era: "〜2009年",
    name: "はじまり",
    description: "2009年以前のあのころ",
    maxYear: 2009,
  },
  {
    id: "1F",
    label: "1F",
    era: "常設展",
    name: "はじめての展示室",
    description: "どなたでも見られる、あのころの入口",
  },
  {
    id: "B1F",
    label: "B1F",
    era: "企画展",
    name: "自分だけの展示室",
    description: "あなたが「しんみり」した展示品",
  },
];

export function getFloorDefinition(floorId: FloorId): FloorDefinition {
  return (
    MUSEUM_FLOORS.find((f) => f.id === floorId) ??
    MUSEUM_FLOORS.find((f) => f.id === "2F")!
  );
}

export function filterExhibitsByFloor(
  exhibits: ExhibitItem[],
  floorId: FloorId,
  shinmiriItemIds: string[]
): ExhibitItem[] {
  if (floorId === "B1F") {
    const shinmiriSet = new Set(shinmiriItemIds);
    return exhibits.filter((item) => shinmiriSet.has(item.id));
  }

  if (floorId === "1F") {
    return exhibits;
  }

  const floor = getFloorDefinition(floorId);

  return exhibits.filter((item) => {
    if (item.year.trim() === "") return false;
    const yearNum = Number(item.year);
    if (!Number.isFinite(yearNum)) return false;

    if (floor.minYear !== undefined && yearNum < floor.minYear) {
      return false;
    }
    if (floor.maxYear !== undefined && yearNum > floor.maxYear) {
      return false;
    }
    return true;
  });
}
