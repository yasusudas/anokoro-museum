import type { BgmTrack, BgmTrackId } from "./types";

export const MUSEUM_DEFAULT_TRACK_ID: BgmTrackId = "bgm-2";

export const BGM_TRACKS: BgmTrack[] = [
  {
    id: "bgm-3",
    name: "Stone Garden",
    description: "静けさと和のアンビエント",
    src: "/bgm/stone-garden.mp3",
  },
  {
    id: "bgm-2",
    name: "Felt and Wood",
    description: "温かみのあるアコースティック",
    src: "/bgm/felt-and-wood.mp3",
  },
  {
    id: "bgm-1",
    name: "陽炎",
    description: "ノスタルジックな調べ",
    src: "/bgm/kagerou.mp3",
  },
  {
    id: "none",
    name: "OFF",
    description: "BGMなし（静寂）",
  },
];

export function getBgmTrack(id: BgmTrackId): BgmTrack {
  return BGM_TRACKS.find((track) => track.id === id) ?? BGM_TRACKS.find((track) => track.id === "none") ?? BGM_TRACKS[0];
}
