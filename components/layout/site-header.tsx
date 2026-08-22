"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Settings } from "lucide-react";

import { signOutAction } from "@/features/auth/actions/sign-out";
import type { AuthUser } from "@/features/auth/types";

type SiteHeaderProps = {
  currentUser?: AuthUser | null;
  mode?: "browse" | "create" | "brand-only";
  onBrandClick?: () => void;
};

export function SiteHeader({ currentUser, mode = "browse", onBrandClick }: SiteHeaderProps) {
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const authGateCloseRef = useRef<HTMLButtonElement>(null);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isAuthGateOpen, setIsAuthGateOpen] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isAuthenticated = Boolean(currentUser?.id);

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

    authGateCloseRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsAuthGateOpen(false);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
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
        <Link className="brand" href="/" aria-label="展示一覧へ戻る">
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
                思い出を展示する <span>＋</span>
              </Link>
            ) : (
              <button className="nav-cta" type="button" onClick={() => setIsAuthGateOpen(true)}>
                思い出を展示する <span>＋</span>
              </button>
            )
          )}
        </nav>
      )}

      {mode !== "brand-only" &&
        (isAuthenticated && currentUser ? (
          <div className="account-menu" ref={accountMenuRef}>
            <button
              className="account-menu-trigger"
              type="button"
              aria-label="アカウントメニューを開く"
              aria-expanded={isAccountMenuOpen}
              aria-controls="account-menu-panel"
              onClick={() => setIsAccountMenuOpen((isOpen) => !isOpen)}
            >
              <Settings aria-hidden="true" size={21} strokeWidth={1.7} />
            </button>
            {isAccountMenuOpen && (
              <div className="account-menu-panel" id="account-menu-panel">
                <p className="account-menu-user">{currentUser.userName}</p>
                <button className="account-menu-signout" type="button" onClick={handleSignOut} disabled={isPending}>
                  {isPending ? "ログアウト中..." : "ログアウト"}
                </button>
                {signOutError && (
                  <p className="account-menu-error" role="alert">
                    {signOutError}
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          <Link className="login-button" href="/sign-in">
            ログイン
          </Link>
        ))}
      {isAuthGateOpen && (
        <div className="auth-gate-backdrop" onMouseDown={() => setIsAuthGateOpen(false)}>
          <section
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
