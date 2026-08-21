"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import type { ExhibitItem } from "@/features/exhibits/types";
import type { AuthUser } from "@/features/auth/types";
import { signOutAction } from "@/features/auth/actions/sign-out";

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
      <path d="M12 20.4s-7-4.3-7-10A4.2 4.2 0 0 1 12 7.3a4.2 4.2 0 0 1 7 3.1c0 5.7-7 10-7 10Z" />
      <path d="M8.4 11.2c.4-1.1 1.1-1.7 2.1-1.9" />
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
  const corridorRef = useRef<HTMLDivElement>(null);
  const [activeCategory, setActiveCategory] = useState("すべて");
  const [selected, setSelected] = useState<ExhibitItem | null>(null);
  const [shinmiriItems, setShinmiriItems] = useState<string[]>([]);
  const [showGuide, setShowGuide] = useState(true);
  const [isPending, startTransition] = useTransition();

  const [signOutError, setSignOutError] = useState<string | null>(null);

  const exhibits = initialExhibits;

  // カテゴリ一覧を動的に生成
  const categories = useMemo(() => {
    const defaultCategories = ["すべて", "おかし", "ゲーム", "たべもの", "ほん", "できごと"];
    const itemCategories = exhibits.map((e) => e.category).filter(Boolean);
    const set = new Set([...defaultCategories, ...itemCategories]);
    return Array.from(set);
  }, [exhibits]);

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

  useEffect(() => {
    const corridor = corridorRef.current;
    if (!corridor) return;

    const horizontalWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
        event.preventDefault();
        corridor.scrollLeft += event.deltaY;
      }
    };

    const arrows = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") move(1);
      if (event.key === "ArrowLeft") move(-1);
    };

    corridor.addEventListener("wheel", horizontalWheel, { passive: false });
    window.addEventListener("keydown", arrows);

    return () => {
      corridor.removeEventListener("wheel", horizontalWheel);
      window.removeEventListener("keydown", arrows);
    };
  }, [move]);

  const toggleShinmiri = (id: string) =>
    setShinmiriItems((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
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
          <button onClick={() => setShowGuide(true)}>はじめての方へ</button>
          <Link className="nav-cta" href="/exhibits/new">
            思い出を展示する <span>＋</span>
          </Link>
        </nav>

        {currentUser ? (
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", position: "relative" }}>
            <span style={{ fontSize: "0.875rem", color: "var(--fg-muted, #888)" }}>
              {currentUser.userName}
            </span>
            <button
              className="login-button"
              onClick={handleSignOut}
              disabled={isPending}
              style={{ background: "transparent", border: "1px solid currentColor" }}
            >
              {isPending ? "..." : "ログアウト"}
            </button>
            {signOutError && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: "0.5rem",
                  padding: "0.5rem 0.75rem",
                  background: "rgba(220, 50, 50, 0.9)",
                  color: "#fff",
                  fontSize: "0.8rem",
                  borderRadius: "4px",
                  whiteSpace: "nowrap",
                  zIndex: 10,
                }}
                role="alert"
              >
                {signOutError}
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
        <button className="scroll-arrow left" onClick={() => move(-1)} aria-label="前の展示へ">
          <ArrowIcon direction="left" />
        </button>
        <div className="corridor" ref={corridorRef}>
          <section className="gallery" aria-live="polite">
            {visible.map((item) => (
              <article className="exhibit" key={item.id}>
                <button
                  className="frame"
                  onClick={() => setSelected(item)}
                  aria-label={`${item.title}の詳細を見る`}
                >
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
                    <small>{item.year ? `${item.year} 年の記憶` : "あのころの記憶"}</small>
                  </div>
                  <button
                    className={shinmiriItems.includes(item.id) ? "nostalgia liked" : "nostalgia"}
                    onClick={() => toggleShinmiri(item.id)}
                    aria-label="しんみりする"
                  >
                    <NostalgiaIcon />
                    <b>{item.shinmiriCount + (shinmiriItems.includes(item.id) ? 1 : 0)}</b>
                    <small>しんみり</small>
                  </button>
                </div>
              </article>
            ))}
            <article className="end-panel">
              <span>YOUR MEMORY</span>
              <h2>
                あなたの「あのころ」も
                <br />
                展示しませんか？
              </h2>
              <p>誰かにとっては、忘れられない思い出かもしれません。</p>
              <Link className="end-panel-link" href="/exhibits/new">
                思い出を展示する ＋
              </Link>
            </article>
          </section>
        </div>
        <button className="scroll-arrow right" onClick={() => move(1)} aria-label="次の展示へ">
          <ArrowIcon />
        </button>
        <div className="floor">
          <span className="floor-line" />
        </div>
        <div className="scroll-hint">
          <span>SCROLL TO EXPLORE</span>
          <i>
            <b />
          </i>
        </div>
      </div>

      {selected && (
        <div className="modal-backdrop" onMouseDown={() => setSelected(null)}>
          <section
            className="detail-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`${selected.title}の展示詳細`}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button className="modal-close" onClick={() => setSelected(null)} aria-label="閉じる">
              ×
            </button>
            <div className="modal-art">
              <div className="frame modal-frame">
                <span className="frame-inner">
                  {selected.imageUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={selected.imageUrl}
                      alt={selected.title}
                      className="frame-photo"
                    />
                  ) : (
                    <ExhibitArt theme={selected.theme} title={selected.title} />
                  )}
                </span>
              </div>
            </div>
            <div className="modal-content">
              <p className="eyebrow">
                EXHIBIT {selected.number} · {selected.category}
              </p>
              <h2>{selected.title}</h2>
              <p className="modal-subtitle">{selected.subtitle}</p>
              <p className="modal-memory">{selected.description}</p>
              <div className="memory-tag">
                {selected.year ? (
                  <>
                    主に <b>{selected.year}年</b> の記憶
                  </>
                ) : (
                  <>
                    <b>あのころ</b> の記憶
                  </>
                )}
              </div>
              <button
                className={shinmiriItems.includes(selected.id) ? "modal-like liked" : "modal-like"}
                onClick={() => toggleShinmiri(selected.id)}
              >
                <NostalgiaIcon />
                しんみりした{" "}
                <b>{selected.shinmiriCount + (shinmiriItems.includes(selected.id) ? 1 : 0)}</b>
              </button>
              <div className="thread-preview">
                <span>みんなの思い出</span>
                <p>「これ、学校帰りによく友達と話してたなあ…」</p>
                <button>思い出を読む →</button>
              </div>
            </div>
          </section>
        </div>
      )}

      {showGuide && (
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
