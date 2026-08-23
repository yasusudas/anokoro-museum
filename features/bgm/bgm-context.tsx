"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getBgmTrack } from "./tracks";
import type { BgmContextValue, BgmTrackId } from "./types";

const STORAGE_KEY_TRACK = "anokoro_bgm_track";
const STORAGE_KEY_VOLUME = "anokoro_bgm_volume";

const defaultContextValue: BgmContextValue = {
  currentTrackId: "none",
  isPlaying: false,
  volume: 0.4,
  selectTrack: () => {},
  togglePlay: () => {},
  setVolume: () => {},
};

const BgmContext = createContext<BgmContextValue>(defaultContextValue);

export function BgmProvider({ children }: { children: ReactNode }) {
  const [currentTrackId, setCurrentTrackId] = useState<BgmTrackId>(() => {
    if (typeof window === "undefined") return "none";
    try {
      const savedTrack = localStorage.getItem(STORAGE_KEY_TRACK) as BgmTrackId | null;
      if (
        savedTrack &&
        (savedTrack === "none" ||
          savedTrack === "bgm-1" ||
          savedTrack === "bgm-2" ||
          savedTrack === "bgm-3")
      ) {
        return savedTrack;
      }
    } catch {}
    return "none";
  });

  const [isPlaying, setIsPlaying] = useState(false);

  const [volume, setVolumeState] = useState<number>(() => {
    if (typeof window === "undefined") return 0.4;
    try {
      const savedVolume = localStorage.getItem(STORAGE_KEY_VOLUME);
      if (savedVolume !== null) {
        const parsedVolume = parseFloat(savedVolume);
        if (!isNaN(parsedVolume) && parsedVolume >= 0 && parsedVolume <= 1) {
          return parsedVolume;
        }
      }
    } catch {}
    return 0.4;
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playbackRequestIdRef = useRef(0);
  const volumeRef = useRef(volume);

  const selectTrack = useCallback((trackId: BgmTrackId) => {
    const requestId = ++playbackRequestIdRef.current;
    setCurrentTrackId(trackId);
    try {
      localStorage.setItem(STORAGE_KEY_TRACK, trackId);
    } catch {}

    if (trackId === "none") {
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
      }
      return;
    }

    const track = getBgmTrack(trackId);
    if (!track.src) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(track.src);
      audioRef.current.loop = true;
      audioRef.current.volume = volumeRef.current;
    } else {
      audioRef.current.src = track.src;
    }

    audioRef.current
      .play()
      .then(() => {
        if (playbackRequestIdRef.current === requestId) {
          setIsPlaying(true);
        }
      })
      .catch((error) => {
        if (playbackRequestIdRef.current === requestId) {
          console.warn("BGM playback blocked by autoplay policy or file missing:", error);
          setIsPlaying(false);
        }
      });
  }, []);

  const togglePlay = useCallback(() => {
    const requestId = ++playbackRequestIdRef.current;

    if (currentTrackId === "none") {
      selectTrack("bgm-1");
      return;
    }

    if (!audioRef.current) {
      const track = getBgmTrack(currentTrackId);
      if (track.src) {
        audioRef.current = new Audio(track.src);
        audioRef.current.loop = true;
        audioRef.current.volume = volume;
      }
    }

    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => {
          if (playbackRequestIdRef.current === requestId) {
            setIsPlaying(true);
          }
        })
        .catch((error) => {
          if (playbackRequestIdRef.current === requestId) {
            console.warn("BGM playback error:", error);
            setIsPlaying(false);
          }
        });
    }
  }, [currentTrackId, isPlaying, selectTrack, volume]);

  const setVolume = useCallback((newVolume: number) => {
    const clamped = Math.max(0, Math.min(1, newVolume));
    volumeRef.current = clamped;
    setVolumeState(clamped);
    if (audioRef.current) {
      audioRef.current.volume = clamped;
    }
    try {
      localStorage.setItem(STORAGE_KEY_VOLUME, String(clamped));
    } catch {}
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return (
    <BgmContext.Provider
      value={{
        currentTrackId,
        isPlaying,
        volume,
        selectTrack,
        togglePlay,
        setVolume,
      }}
    >
      {children}
    </BgmContext.Provider>
  );
}

export function useBgm() {
  return useContext(BgmContext);
}
