"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Music, Pause, Play, Settings, Volume2 } from "lucide-react";

import { NotificationCenter } from "@/components/notifications/notification-center";
import { signOutAction } from "@/features/auth/actions/sign-out";
import type { AuthUser } from "@/features/auth/types";
import { useBgm } from "@/features/bgm/bgm-context";
import { BGM_TRACKS } from "@/features/bgm/tracks";

type SiteHeaderProps = {
  currentUser?: AuthUser | null;
  loginReturnPath?: string;
  mode?: "browse" | "create" | "brand-only";
  onBrandClick?: () => void;
};

export function SiteHeader({
  currentUser,
  loginReturnPath = "/floor/1",
  mode = "browse",
  onBrandClick,
}: SiteHeaderProps) {
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const authGateRef = useRef<HTMLElement>(null);
  const authGateCloseRef = useRef<HTMLButtonElement>(null);
  const authGateTriggerRef = useRef<HTMLButtonElement>(null);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isAuthGateOpen, setIsAuthGateOpen] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isAuthenticated = Boolean(currentUser?.id);
  const {
    currentTrackId,
    isPlaying,
    volume,
    stopMuseumBgm,
    selectTrack,
    togglePlay,
    setVolume,
  } = useBgm();

  useEffect(() => {
    if (!isAccountMenuOpen) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) setIsAccountMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsAccountMenuOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isAccountMenuOpen]);

  useEffect(() => {
    if (!isAuthGateOpen) return;

    const triggerElement = authGateTriggerRef.current;
    authGateCloseRef.current?.focus();
    const handleDialogKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsAuthGateOpen(false);
        return;
      }
      if (event.key !== "Tab") return;

      const focusableElements = authGateRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusableElements?.length) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    window.addEventListener("keydown", handleDialogKeyDown);
    return () => {
      window.removeEventListener("keydown", handleDialogKeyDown);
      triggerElement?.focus();
    };
  }, [isAuthGateOpen]);

  const brandContent = (
    <>
      <Image
        className="brand-mark"
        src="/site-logo-mark.svg"
        alt=""
        width={39}
        height={39}
        aria-hidden="true"
      />
      <span>
        <b>あのころ</b>
        <small>ミュージアム</small>
      </span>
    </>
  );

  const handleSignOut = () => {
    setSignOutError(null);
    stopMuseumBgm();
    startTransition(async () => {
      const result = await signOutAction();
      if (result && !result.ok) {
        setSignOutError(result.error.message || "ログアウトに失敗しました。もう一度お試しください。");
      }
    });
  };

  return (
    <header className={`museum-header${mode === "brand-only" ? " header-brand-only" : ""}`}>
      {onBrandClick ? (
        <button className="brand" type="button" onClick={onBrandClick} aria-label="入口へ戻る">
          {brandContent}
        </button>
      ) : (
        <Link className="brand" href="/" aria-label="博物館の入口へ戻る">
          {brandContent}
        </Link>
      )}

      {mode !== "brand-only" && (
        <nav aria-label="メインナビゲーション">
          <Link className={mode === "browse" ? "nav-active" : undefined} href="/floor/2">
            展示をめぐる
          </Link>
          {mode === "browse" && (
            isAuthenticated ? (
              <Link className="nav-cta" href="/exhibits/new">
                思い出を展示 <span>＋</span>
              </Link>
            ) : (
              <button
                ref={authGateTriggerRef}
                className="nav-cta"
                type="button"
                onClick={() => setIsAuthGateOpen(true)}
              >
                思い出を展示 <span>＋</span>
              </button>
            )
          )}
        </nav>
      )}

      {mode !== "brand-only" &&
        (isAuthenticated && currentUser ? (
          <div className="header-actions">
            <NotificationCenter />
            <div className="account-menu" ref={accountMenuRef}>
              <button
                className="account-menu-trigger"
                type="button"
                aria-label="館内設定メニューを開く"
                aria-expanded={isAccountMenuOpen}
                aria-controls="account-menu-panel"
                onClick={() => setIsAccountMenuOpen((isOpen) => !isOpen)}
              >
                <Settings aria-hidden="true" size={21} strokeWidth={1.7} />
              </button>
              {isAccountMenuOpen && (
                <div className="account-menu-panel" id="account-menu-panel">
                  <div className="account-menu-header">
                    <p className="account-menu-user">{currentUser.userName}</p>
                  </div>

                <div className="bgm-settings-section">
                  <div className="bgm-settings-title">
                    <div className="bgm-settings-label">
                      <Music size={15} aria-hidden="true" />
                      <span>館内BGM</span>
                    </div>
                    {currentTrackId !== "none" && (
                      <button
                        type="button"
                        className="bgm-playback-toggle"
                        onClick={togglePlay}
                        aria-label={isPlaying ? "BGMを一時停止" : "BGMを再生"}
                      >
                        {isPlaying ? <Pause size={13} /> : <Play size={13} />}
                        <span>{isPlaying ? "再生中" : "停止中"}</span>
                      </button>
                    )}
                  </div>

                  <div className="bgm-track-list">
                    {BGM_TRACKS.map((track) => {
                      const isSelected = track.id === currentTrackId;
                      return (
                        <button
                          key={track.id}
                          type="button"
                          className={`bgm-track-item ${isSelected ? "selected" : ""}`}
                          onClick={() => selectTrack(track.id)}
                        >
                          <span className="bgm-track-name">{track.name}</span>
                          {isSelected && <span className="bgm-track-check">✓</span>}
                        </button>
                      );
                    })}
                  </div>

                  {currentTrackId !== "none" && (
                    <div className="bgm-volume-control">
                      <Volume2 size={14} aria-hidden="true" />
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={volume}
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                        aria-label="BGMの音量"
                        className="bgm-volume-slider"
                      />
                    </div>
                  )}
                </div>

                  <div className="account-menu-footer">
                    <button className="account-menu-signout" type="button" onClick={handleSignOut} disabled={isPending}>
                      {isPending ? "ログアウト中..." : "ログアウト"}
                    </button>
                    {signOutError && (
                      <p className="account-menu-error" role="alert">
                        {signOutError}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <Link
            className="login-button"
            href={`/sign-in?next=${encodeURIComponent(loginReturnPath)}`}
          >
            ログイン
          </Link>
        ))}
      {isAuthGateOpen && (
        <div className="auth-gate-backdrop" onMouseDown={() => setIsAuthGateOpen(false)}>
          <section
            ref={authGateRef}
            className="auth-gate-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-gate-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              ref={authGateCloseRef}
              className="auth-gate-close"
              type="button"
              aria-label="閉じる"
              onClick={() => setIsAuthGateOpen(false)}
            >
              ×
            </button>
            <h2 id="auth-gate-title">ログインが必要です</h2>
            <Link href="/sign-in?next=/exhibits/new">ログインする <b aria-hidden="true">→</b></Link>
          </section>
        </div>
      )}
    </header>
  );
}
