import type { BgmTrack, BgmTrackId } from "./types";

export const BGM_TRACKS: BgmTrack[] = [
  {
    id: "none",
    name: "OFF",
    description: "BGMなし（静寂）",
  },
  {
    id: "bgm-1",
    name: "BGM 1: ノスタルジア",
    description: "夕暮れのオルゴール風",
    src: "/bgm/bgm-1.mp3",
  },
  {
    id: "bgm-2",
    name: "BGM 2: 木漏れ日",
    description: "穏やかなアコースティック風",
    src: "/bgm/bgm-2.mp3",
  },
  {
    id: "bgm-3",
    name: "BGM 3: あの日の放課後",
    description: "レトロなピアノ風",
    src: "/bgm/bgm-3.mp3",
  },
];

export function getBgmTrack(id: BgmTrackId): BgmTrack {
  return BGM_TRACKS.find((track) => track.id === id) ?? BGM_TRACKS[0];
}
