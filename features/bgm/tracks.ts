import type { BgmTrack, BgmTrackId } from "./types";

export const BGM_TRACKS: BgmTrack[] = [
  {
    id: "bgm-3",
    name: "Stone Garden",
    description: "静けさと和のアンビエント",
    src: "/bgm/Stone%20Garden.mp3",
  },
  {
    id: "bgm-2",
    name: "Felt and Wood",
    description: "温かみのあるアコースティック",
    src: "/bgm/Felt%20and%20Wood.mp3",
  },
  {
    id: "bgm-1",
    name: "陽炎",
    description: "ノスタルジックな調べ",
    src: "/bgm/年の陽炎.mp3",
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
