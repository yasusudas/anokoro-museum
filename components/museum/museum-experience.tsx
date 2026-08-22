"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Settings } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CommentThread } from "@/components/comments/comment-thread";
import { EXHIBIT_CATEGORIES } from "@/features/exhibits/categories";
import type { ExhibitItem } from "@/features/exhibits/types";
import type { AuthUser } from "@/features/auth/types";
import { signOutAction } from "@/features/auth/actions/sign-out";
import { toggleShinmiriAction } from "@/features/exhibits/actions/toggle-shinmiri";

type MuseumExperienceProps = {
  initialExhibits: ExhibitItem[];
  currentUser?: AuthUser | null;
};

function ArrowIcon({ direction = "right" }: { direction?: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={direction === "left" ? "flip" : ""}>
      <path d="M5 12h13M13 6l6 6-6 6" />
    </svg>
  );
}

function NostalgiaIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21.2l7.8-7.7 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
    </svg>
  );
}

function ExhibitArt({ theme, title }: { theme: string; title: string }) {
  if (theme === "gummy") {
    return (
      <div className="art art-gummy">
        <span className="gummy-line one" />
        <span className="gummy-line two" />
        <strong>{title}</strong>
        <small>超ひも級！</small>
      </div>
    );
  }
  if (theme === "watch") {
    return (
      <div className="art art-watch">
        <span className="watch-face">
          <i>✦</i>
        </span>
        <strong>{title}</strong>
      </div>
    );
  }
  if (theme === "tapioca") {
    return (
      <div className="art art-tapioca">
        <span className="straw" />
        <span className="cup">
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
        </span>
        <strong>{title}</strong>
      </div>
    );
  }
  if (theme === "book") {
    return (
      <div className="art art-book">
        <span className="book-cover">
          <b>Z</b>
          <i>{title}</i>
        </span>
        <span className="book-shadow" />
      </div>
    );
  }
  return (
    <div className="art art-soran">
      <span className="sun" />
      <span className="dancer">
        <i />
        <b />
      </span>
      <strong>{title}</strong>
    </div>
  );
}

export function MuseumExperience({ initialExhibits, currentUser }: MuseumExperienceProps) {
  const router = useRouter();
  const corridorRef = useRef<HTMLDivElement>(null);
  const modalCloseRef = useRef<HTMLButtonElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const requestedExhibitId = searchParams.get("exhibit");
  const requestedExhibit = requestedExhibitId
    ? initialExhibits.find((item) => item.id === requestedExhibitId) ?? null
    : null;
  const isRequestedExhibitMissing = Boolean(requestedExhibitId) && !requestedExhibit;
  const [activeCategory, setActiveCategory] = useState("すべて");
  const [selected, setSelected] = useState<ExhibitItem | null>(() => requestedExhibit);
  const [shinmiriItems, setShinmiriItems] = useState<string[]>(() =>
    initialExhibits.filter((item) => item.isShinmiri).map((item) => item.id)
  );
  const [shinmiriCounts, setShinmiriCounts] = useState<Record<string, number>>(() => {
    const counts: Record<string, number> = {};
    for (const item of initialExhibits) {
      counts[item.id] = item.shinmiriCount;
    }
    return counts;
  });
  const [showGuide, setShowGuide] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [canScroll, setCanScroll] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [signOutError, setSignOutError] = useState<string | null>(null);

  const exhibits = initialExhibits;

  const categories = ["すべて", ...EXHIBIT_CATEGORIES] as const;

  const visible =
    activeCategory === "すべて"
      ? exhibits
      : exhibits.filter((item) => item.category === activeCategory);

  const move = useCallback((direction: number) => {
    corridorRef.current?.scrollBy({
      left: direction * Math.min(window.innerWidth * 0.72, 760),
      behavior: "smooth",
    });
  }, []);

  const closeModal = useCallback(() => {
    setSelected(null);
  }, []);

  const handleOpenExhibit = (item: ExhibitItem) => {
    setSelected(item);
  };

  useEffect(() => {
    const corridor = corridorRef.current;
    if (!corridor) return;

    const horizontalWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
        event.preventDefault();
        corridor.scrollLeft += event.deltaY;
      }
    };

    const updateScrollState = () => {
      const maxScrollLeft = corridor.scrollWidth - corridor.clientWidth;
      setCanScroll(maxScrollLeft > 1);
      setScrollProgress(maxScrollLeft > 0 ? (corridor.scrollLeft / maxScrollLeft) * 100 : 0);
      if (corridor.scrollLeft > 4) setShowGuide(false);
    };

    const arrows = (event: KeyboardEvent) => {
      if (event.key === "Escape" && selected) {
        event.preventDefault();
        closeModal();
        return;
      }

      if (selected) return;
      if (event.key === "ArrowRight") move(1);
      if (event.key === "ArrowLeft") move(-1);
    };

    corridor.addEventListener("wheel", horizontalWheel, { passive: false });
    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(corridor);
    if (corridor.firstElementChild) resizeObserver.observe(corridor.firstElementChild);

    updateScrollState();
    corridor.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("keydown", arrows);

    return () => {
      corridor.removeEventListener("wheel", horizontalWheel);
      corridor.removeEventListener("scroll", updateScrollState);
      resizeObserver.disconnect();
      window.removeEventListener("keydown", arrows);
    };
  }, [closeModal, move, selected, visible.length]);

  useEffect(() => {
    if (selected) modalCloseRef.current?.focus();
  }, [selected]);

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

  const pendingShinmiriIdsRef = useRef<Set<string>>(new Set());

  const toggleShinmiri = (id: string) => {
    if (!currentUser) {
      router.push(`/sign-in?next=${encodeURIComponent(selected ? `/?exhibit=${selected.id}` : "/")}`);
      return;
    }

    if (pendingShinmiriIdsRef.current.has(id)) {
      return;
    }

    pendingShinmiriIdsRef.current.add(id);

    const isCurrentlyLiked = shinmiriItems.includes(id);
    const nextIsLiked = !isCurrentlyLiked;
    const currentCount = shinmiriCounts[id] ?? 0;
    const nextCount = Math.max(0, currentCount + (nextIsLiked ? 1 : -1));

    setShinmiriItems((current) =>
      nextIsLiked ? [...current, id] : current.filter((item) => item !== id)
    );
    setShinmiriCounts((current) => ({ ...current, [id]: nextCount }));

    startTransition(async () => {
      try {
        const result = await toggleShinmiriAction(id);
        if (!result.ok) {
          setShinmiriItems((current) =>
            isCurrentlyLiked ? [...current, id] : current.filter((item) => item !== id)
          );
          setShinmiriCounts((current) => ({ ...current, [id]: currentCount }));
          return;
        }
        setShinmiriCounts((current) => ({ ...current, [id]: result.data.shinmiriCount }));
      } catch {
        setShinmiriItems((current) =>
          isCurrentlyLiked ? [...current, id] : current.filter((item) => item !== id)
        );
        setShinmiriCounts((current) => ({ ...current, [id]: currentCount }));
      } finally {
        pendingShinmiriIdsRef.current.delete(id);
      }
    });
  };

  const handleSignOut = () => {
    setSignOutError(null);
    startTransition(async () => {
      const result = await signOutAction();
      if (result && !result.ok) {
        setSignOutError(result.error.message || "ログアウトに失敗しました。もう一度お試しください。");
      }
    });
  };

  const handleScrollbarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const corridor = corridorRef.current;
    if (!corridor) return;

    const maxScrollLeft = corridor.scrollWidth - corridor.clientWidth;
    corridor.scrollLeft = (Number(event.currentTarget.value) / 100) * maxScrollLeft;
  };

  if (isRequestedExhibitMissing) {
    return (
      <main className="museum-shell">
        <section className="end-panel" role="alert" aria-labelledby="exhibit-not-found-title">
          <span>EXHIBIT NOT FOUND</span>
          <h2 id="exhibit-not-found-title">展示が見つかりません</h2>
          <p>指定された展示は削除されたか、存在しません。</p>
          <Link className="end-panel-link" href="/">
            展示を見に戻る
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="museum-shell">
      <header className="museum-header">
        <button
          className="brand"
          onClick={() => corridorRef.current?.scrollTo({ left: 0, behavior: "smooth" })}
          aria-label="入口へ戻る"
        >
          <span className="brand-mark">あ</span>
          <span>
            <b>あのころ</b>
            <small>MUSEUM</small>
          </span>
        </button>

        <nav aria-label="メインナビゲーション">
          <button className="nav-active">展示をめぐる</button>
          <Link className="nav-cta" href="/exhibits/new">
            思い出を追加する <span>＋</span>
          </Link>
        </nav>

        {currentUser ? (
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
        )}
      </header>

      <section className="controls" aria-label="展示の絞り込み">
        <div className="category-tabs">
          {categories.map((category) => (
            <button
              key={category}
              className={activeCategory === category ? "active" : ""}
              onClick={() => {
                setActiveCategory(category);
                corridorRef.current?.scrollTo({ left: 0 });
              }}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="floor-label">
          <span>2F</span>
          <div>
            <small>平成・令和</small>
            <b>あのころ回廊</b>
          </div>
        </div>
      </section>

      <div className="corridor-wrap">
        {canScroll && scrollProgress > 0.5 && (
          <button className="scroll-arrow left" onClick={() => move(-1)} aria-label="前の展示へ">
            <ArrowIcon direction="left" />
          </button>
        )}
        <div className="corridor" ref={corridorRef}>
          <section className="gallery" aria-live="polite">
            {visible.map((item) => (
              <article className="exhibit" key={item.id}>
                <button className="frame" onClick={() => handleOpenExhibit(item)} aria-label={`${item.title}の詳細を見る`}>
                  <span className="frame-inner">
                    {item.imageUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="frame-photo"
                        loading="lazy"
                      />
                    ) : (
                      <ExhibitArt theme={item.theme} title={item.title} />
                    )}
                  </span>
                </button>
                <div className="exhibit-label">
                  <span className="item-number">{item.number}</span>
                  <div>
                    <h2>{item.title}</h2>
                    <p>{item.subtitle}</p>
                  </div>
                  <button
                    className={shinmiriItems.includes(item.id) ? "nostalgia liked" : "nostalgia"}
                    onClick={() => toggleShinmiri(item.id)}
                    aria-label="しんみりする"
                  >
                    <NostalgiaIcon />
                    <b>{shinmiriCounts[item.id] ?? item.shinmiriCount}</b>
                    <small>しんみり</small>
                  </button>
                </div>
              </article>
            ))}
          </section>
        </div>
        {canScroll && scrollProgress < 99.5 && (
          <button className="scroll-arrow right" onClick={() => move(1)} aria-label="次の展示へ">
            <ArrowIcon />
          </button>
        )}
        <div className="floor">
          <span className="floor-line" />
        </div>
        {canScroll && (
          <input
            className="corridor-scrollbar"
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={scrollProgress}
            aria-label="展示回廊のスクロール位置"
            onChange={handleScrollbarChange}
          />
        )}
      </div>

      {selected && (
        <div className="modal-backdrop" onMouseDown={closeModal}>
          <section
            className="detail-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`${selected.title}の展示詳細`}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button ref={modalCloseRef} className="modal-close" onClick={closeModal} aria-label="閉じる">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
            <div className="modal-main">
              <div className="modal-art">
                <div className="frame modal-frame">
                  <span className="frame-inner">
                    {selected.imageUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={selected.imageUrl} alt={selected.title} className="frame-photo" />
                    ) : (
                      <ExhibitArt theme={selected.theme} title={selected.title} />
                    )}
                  </span>
                </div>
              </div>
              <div className="modal-content">
                <p className="eyebrow">
                  {selected.year ? `${selected.year}年　${selected.category}` : selected.category}
                </p>
                <div className="modal-title-row">
                  <div>
                    <h2>{selected.title}</h2>
                  </div>
                  <button
                    className={shinmiriItems.includes(selected.id) ? "modal-like liked" : "modal-like"}
                    onClick={() => toggleShinmiri(selected.id)}
                  >
                    <NostalgiaIcon />
                    <span>しんみり</span>
                    <b>{shinmiriCounts[selected.id] ?? selected.shinmiriCount}</b>
                  </button>
                </div>
                <p className="modal-memory">{selected.description}</p>
              </div>
            </div>
            <aside className="modal-comments" aria-label="コメント欄">
              <CommentThread key={selected.id} itemId={selected.id} />
            </aside>
          </section>
        </div>
      )}

      {showGuide && !selected && (
        <div className="guide-toast">
          <span>← →</span>
          <div>
            <b>横に歩いて、記憶をめぐる</b>
            <small>マウスホイールや矢印キーで移動できます</small>
          </div>
          <button onClick={() => setShowGuide(false)} aria-label="案内を閉じる">
            ×
          </button>
        </div>
      )}
    </main>
  );
}
