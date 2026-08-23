export type BgmTrackId = "none" | "bgm-1" | "bgm-2" | "bgm-3";

export type BgmTrack = {
  id: BgmTrackId;
  name: string;
  description: string;
  src?: string;
};

export type BgmContextValue = {
  currentTrackId: BgmTrackId;
  isPlaying: boolean;
  volume: number;
  startMuseumBgm: () => void;
  stopMuseumBgm: () => void;
  selectTrack: (trackId: BgmTrackId) => void;
  togglePlay: () => void;
  setVolume: (volume: number) => void;
};
