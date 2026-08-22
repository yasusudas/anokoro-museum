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
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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
          <Link className={mode === "browse" ? "nav-active" : undefined} href="/">
            展示をめぐる
          </Link>
          {mode === "browse" && (
            <Link className="nav-cta" href="/exhibits/new">
              思い出を追加する <span>＋</span>
            </Link>
          )}
        </nav>
      )}

      {mode !== "brand-only" &&
        (currentUser ? (
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
    </header>
  );
}
