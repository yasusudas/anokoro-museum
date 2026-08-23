"use client";

import { useCallback, useEffect, useRef, useState, useTransition, type RefObject } from "react";
import { ChevronDown, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CommentThread } from "@/components/comments/comment-thread";
import { SiteHeader } from "@/components/layout/site-header";
import { useBgm } from "@/features/bgm/bgm-context";
import { EXHIBIT_CATEGORIES } from "@/features/exhibits/categories";
import {
  type FloorId,
  MUSEUM_FLOORS,
  filterExhibitsByFloor,
  getFloorDefinition,
  getFloorPath,
} from "@/features/exhibits/floors";
import type { ExhibitItem } from "@/features/exhibits/types";
import type { AuthUser } from "@/features/auth/types";
import { toggleShinmiriAction } from "@/features/exhibits/actions/toggle-shinmiri";

type MuseumExperienceProps = {
  initialExhibits: ExhibitItem[];
  initialFloorId: FloorId;
  currentUser?: AuthUser | null;
  isPreview?: boolean;
};

function useAutoFitFontSize<T extends HTMLElement>(
  ref: RefObject<T | null>,
  text: string,
  maxLines: number,
  baseFontSize: number,
  minFontSize: number
) {
  const [fontSize, setFontSize] = useState(baseFontSize);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let isMeasuring = false;
    let isActive = true;

    const measure = () => {
      if (!isActive || isMeasuring) return;
      isMeasuring = true;

      const originalStyles = {
        display: element.style.display,
        height: element.style.height,
        maxHeight: element.style.maxHeight,
        minHeight: element.style.minHeight,
        overflow: element.style.overflow,
        textOverflow: element.style.textOverflow,
        lineClamp: element.style.getPropertyValue("-webkit-line-clamp"),
        boxOrient: element.style.getPropertyValue("-webkit-box-orient"),
      };

      element.style.fontSize = `${baseFontSize}px`;
      element.style.display = "block";
      element.style.height = "auto";
      element.style.maxHeight = "none";
      element.style.minHeight = "0";
      element.style.overflow = "visible";
      element.style.textOverflow = "clip";
      element.style.setProperty("-webkit-line-clamp", "unset");
      element.style.setProperty("-webkit-box-orient", "initial");

      let nextFontSize = baseFontSize;
      const fits = () => {
        if (maxLines === 1) {
          return element.scrollWidth <= element.clientWidth + 1;
        }

        const lineHeight = Number.parseFloat(getComputedStyle(element).lineHeight);
        const lineElements = [...element.children].filter(
          (child): child is HTMLElement => child instanceof HTMLElement
        );
        if (lineElements.length > 0) {
          return lineElements.every(
            (lineElement) =>
              lineElement.scrollWidth <= lineElement.clientWidth + 1 &&
              lineElement.getBoundingClientRect().height <= lineHeight + 1
          );
        }

        return element.scrollHeight <= lineHeight * maxLines + 1;
      };

      while (nextFontSize > minFontSize && !fits()) {
        nextFontSize = Math.max(minFontSize, nextFontSize - 0.5);
        element.style.fontSize = `${nextFontSize}px`;
      }

      element.style.display = originalStyles.display;
      element.style.height = originalStyles.height;
      element.style.maxHeight = originalStyles.maxHeight;
      element.style.minHeight = originalStyles.minHeight;
      element.style.overflow = originalStyles.overflow;
      element.style.textOverflow = originalStyles.textOverflow;
      element.style.setProperty("-webkit-line-clamp", originalStyles.lineClamp);
      element.style.setProperty("-webkit-box-orient", originalStyles.boxOrient);
      element.style.fontSize = `${nextFontSize}px`;
      setFontSize(nextFontSize);
      isMeasuring = false;
    };

    const animationFrame = requestAnimationFrame(measure);
    const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    resizeObserver?.observe(element);
    document.fonts?.ready.then(measure);

    return () => {
      isActive = false;
      cancelAnimationFrame(animationFrame);
      resizeObserver?.disconnect();
    };
  }, [baseFontSize, maxLines, minFontSize, ref, text]);

  return fontSize;
}

function splitTitleIntoLines(title: string) {
  const characters = [...title];
  if (characters.length <= 20) return [title];

  const midpoint = Math.ceil(characters.length / 2);
  return [characters.slice(0, midpoint).join(""), characters.slice(midpoint).join("")];
}

function AutoFitTitle({ title }: { title: string }) {
  const ref = useRef<HTMLHeadingElement>(null);
  const titleLines = splitTitleIntoLines(title);
  const baseFontSize = titleLines.length > 1 ? 14 : 18;
  const fontSize = useAutoFitFontSize(ref, title, 2, baseFontSize, 10);

  return (
    <h2 ref={ref} style={{ fontSize, lineHeight: 1.2 }}>
      {titleLines.map((line, index) => (
        <span key={`${line}-${index}`} style={{ display: "block" }}>
          {renderCardTitle(line)}
        </span>
      ))}
    </h2>
  );
}

function AutoFitModalTitle({ title }: { title: string }) {
  const ref = useRef<HTMLHeadingElement>(null);
  const titleLines = splitTitleIntoLines(title);
  const fontSize = useAutoFitFontSize(ref, title, 2, 44, 14);

  return (
    <div className="modal-title-frame">
      <h2 ref={ref} style={{ fontSize, lineHeight: 1.2 }}>
        {titleLines.map((line, index) => (
          <span key={`${line}-${index}`} style={{ display: "block" }}>
            {line}
          </span>
        ))}
      </h2>
    </div>
  );
}

function AutoFitDonor({ userName }: { userName: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const fontSize = useAutoFitFontSize(ref, userName, 1, 10, 7);

  return (
    <span ref={ref} className="exhibit-donor" style={{ fontSize }}>
      {userName}
    </span>
  );
}

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

function renderCardTitle(title: string) {
  return title.split(/(Q)/g).map((part, index) =>
    part === "Q" ? (
      <span className="title-q" key={`${part}-${index}`}>
        {part}
      </span>
    ) : (
      part
    ),
  );
}

export function MuseumExperience({
  initialExhibits,
  initialFloorId,
  currentUser,
  isPreview = false,
}: MuseumExperienceProps) {
  const router = useRouter();
  const { startMuseumBgm } = useBgm();
  const corridorRef = useRef<HTMLDivElement>(null);
  const modalCloseRef = useRef<HTMLButtonElement>(null);
  const floorMenuRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const requestedExhibitId = searchParams.get("exhibit");
  const requestedExhibit = requestedExhibitId
    ? initialExhibits.find((item) => item.id === requestedExhibitId) ?? null
    : null;
  const isRequestedExhibitMissing = Boolean(requestedExhibitId) && !requestedExhibit;
  const [activeCategory, setActiveCategory] = useState("すべて");
  const activeFloorId = initialFloorId;
  const [isFloorMenuOpen, setIsFloorMenuOpen] = useState(false);
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
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!currentUser) return;
    startMuseumBgm();
  }, [currentUser, startMuseumBgm]);

  const exhibits = initialExhibits;

  const categories = ["すべて", ...EXHIBIT_CATEGORIES] as const;

  const activeFloor = getFloorDefinition(activeFloorId);

  const floorFilteredExhibits = filterExhibitsByFloor(
    exhibits,
    activeFloorId,
    shinmiriItems
  );

  const visible =
    activeCategory === "すべて"
      ? floorFilteredExhibits
      : floorFilteredExhibits.filter((item) => item.category === activeCategory);

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
    if (!isFloorMenuOpen) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!floorMenuRef.current?.contains(event.target as Node)) {
        setIsFloorMenuOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsFloorMenuOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isFloorMenuOpen]);
  const pendingShinmiriIdsRef = useRef<Set<string>>(new Set());

  const toggleShinmiri = (id: string) => {
    if (isPreview) return;
    if (!currentUser) {
      router.push(`/sign-in?next=${encodeURIComponent(selected ? `/floor/2?exhibit=${selected.id}` : "/floor/2")}`);
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
        setShinmiriItems((current) => {
          if (result.data.isShinmiri) {
            return current.includes(id) ? current : [...current, id];
          }
          return current.filter((item) => item !== id);
        });
        const updatedCount = result.data.shinmiriCount;
        if (updatedCount !== undefined) {
          setShinmiriCounts((current) => ({ ...current, [id]: updatedCount }));
        }
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
      <SiteHeader
        currentUser={currentUser}
        currentFloorId={activeFloorId}
        onBrandClick={() => corridorRef.current?.scrollTo({ left: 0, behavior: "smooth" })}
      />

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

        <div className="floor-selector-container" ref={floorMenuRef}>
          <button
            type="button"
            className={`floor-selector-button ${isFloorMenuOpen ? "active" : ""}`}
            onClick={() => setIsFloorMenuOpen((prev) => !prev)}
            aria-expanded={isFloorMenuOpen}
            aria-haspopup="menu"
            aria-controls="floor-dropdown-menu"
            aria-label={`フロア移動: 現在 ${activeFloor.label} ${activeFloor.name}`}
          >
            <span className="floor-badge">{activeFloor.label}</span>
            <div className="floor-info">
              <small>{activeFloor.era}</small>
              <b>{activeFloor.name}</b>
            </div>
            <ChevronDown size={14} className={`floor-chevron ${isFloorMenuOpen ? "open" : ""}`} aria-hidden="true" />
          </button>

          {isFloorMenuOpen && (
            <div id="floor-dropdown-menu" className="floor-dropdown-menu" role="menu" aria-label="フロア一覧">
              <div className="floor-dropdown-header">
                <span>フロア移動</span>
                <small>階を選択</small>
              </div>
              <ul className="floor-dropdown-list" role="none">
                {MUSEUM_FLOORS.map((floor) => {
                  const isSelected = floor.id === activeFloorId;
                  return (
                    <li key={floor.id} role="none">
                      <button
                        type="button"
                        className={`floor-item-button ${isSelected ? "selected" : ""}`}
                        role="menuitemradio"
                        aria-checked={isSelected}
                        onClick={() => {
                          setIsFloorMenuOpen(false);
                          const destination = getFloorPath(floor.id);
                          if (isPreview && floor.id !== "1F") {
                            router.push(
                              currentUser
                                ? destination
                                : `/sign-in?next=${encodeURIComponent(destination)}`
                            );
                            return;
                          }
                          router.push(destination);
                        }}
                      >
                        <span className="floor-item-badge">{floor.label}</span>
                        <div className="floor-item-info">
                          <span className="floor-item-era">{floor.era}</span>
                          <span className="floor-item-name">{floor.name}</span>
                        </div>
                        {isSelected && <span className="floor-item-check" aria-hidden="true">✓</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
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
            {visible.length === 0 ? (
              <div className="gallery-empty-state">
                {activeFloorId === "B1F" && floorFilteredExhibits.length === 0 ? (
                  currentUser ? (
                    <div className="gallery-empty-content">
                      <p className="gallery-empty-title">まだ「しんみり」した展示がありません</p>
                      <p className="gallery-empty-desc">
                        各展示の詳細画面で「しんみり」ボタンを押すと、この企画展にあなただけのコレクションが並びます。
                      </p>
                    </div>
                  ) : (
                    <div className="gallery-empty-content">
                      <p className="gallery-empty-title">ログインして自分だけの企画展をつくろう</p>
                      <p className="gallery-empty-desc">
                        ログインすると、「しんみり」した思い出の品だけを集めた特別な展示室をお楽しみいただけます。
                      </p>
                      <Link href="/sign-in?next=/floor/2" className="gallery-empty-action">
                        ログインする
                      </Link>
                    </div>
                  )
                ) : (
                  <div className="gallery-empty-content">
                    <p className="gallery-empty-title">該当する展示品がありません</p>
                    <p className="gallery-empty-desc">
                      他の年代のフロアやカテゴリを選択してみてください。
                    </p>
                  </div>
                )}
              </div>
            ) : (
              visible.map((item) => (
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
                      <span className="frame-image-missing">画像が登録されていません</span>
                    )}
                  </span>
                </button>
                <div className="exhibit-label">
                  <div className="exhibit-caption">
                    <AutoFitTitle title={item.title} />
                    <p>
                      <span className="exhibit-subtitle-prefix">
                        {item.subtitle}
                        {item.userName ? "　寄贈：" : null}
                      </span>
                      {item.userName ? <AutoFitDonor userName={item.userName} /> : null}
                    </p>
                  </div>
                  <button
                    className={`${shinmiriItems.includes(item.id) ? "nostalgia liked" : "nostalgia"}${isPreview ? " is-display-only" : ""}`}
                    onClick={() => toggleShinmiri(item.id)}
                    aria-label="しんみりする"
                    disabled={isPreview}
                    aria-pressed={shinmiriItems.includes(item.id)}
                  >
                    <NostalgiaIcon />
                    <b>{shinmiriCounts[item.id] ?? item.shinmiriCount}</b>
                  </button>
                </div>
              </article>
            )))}
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
                      <span className="frame-image-missing">画像が登録されていません</span>
                    )}
                  </span>
                </div>
              </div>
              <div className="modal-content">
                <p className="eyebrow">
                  {selected.year ? `${selected.year}年　${selected.category}` : selected.category}
                </p>
                <div className="modal-title-row">
                  <div className="modal-title">
                    <AutoFitModalTitle title={selected.title} />
                  </div>
                  <div className="modal-actions">
                    <button
                      className={`${shinmiriItems.includes(selected.id) ? "modal-like liked" : "modal-like"}${isPreview ? " is-display-only" : ""}`}
                      onClick={() => toggleShinmiri(selected.id)}
                      disabled={isPreview}
                      aria-pressed={shinmiriItems.includes(selected.id)}
                    >
                      <NostalgiaIcon />
                      <span>しんみり</span>
                      <b>{shinmiriCounts[selected.id] ?? selected.shinmiriCount}</b>
                    </button>
                    <a
                      href={`https://www.google.com/search?q=${encodeURIComponent(selected.title)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="modal-search-link"
                      aria-label={`${selected.title}をGoogleで検索して詳しく知る（新しいタブで開きます）`}
                    >
                      <span>もっと詳しく知る</span>
                      <ExternalLink size={13} strokeWidth={1.8} aria-hidden="true" />
                    </a>
                  </div>
                </div>
                <p className="modal-memory">{selected.description}</p>
              </div>
            </div>
            {isPreview ? (
              <aside className="preview-invitation" aria-label="上階のご案内">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="5" y="10" width="14" height="10" rx="1" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                </svg>
                <p>{currentUser ? "2Fで、みんなの展示を見られます" : "ログインすると2Fの展示を見られます"}</p>
                <Link
                  href={
                    currentUser
                      ? "/floor/2"
                      : `/sign-in?next=${encodeURIComponent(getFloorPath(activeFloorId))}`
                  }
                >
                  {currentUser ? "2Fを見る" : "ログイン"} <b aria-hidden="true">→</b>
                </Link>
              </aside>
            ) : (
              <aside className="modal-comments" aria-label="コメント欄">
                <CommentThread key={selected.id} itemId={selected.id} />
              </aside>
            )}
          </section>
        </div>
      )}

      {showGuide && !selected && (
        <div className="guide-toast" aria-label="展示の移動方法">
          <span aria-hidden="true">← →</span>
          <small>マウスホイールや矢印キーで移動</small>
        </div>
      )}

      {activeFloorId === "1F" && !selected && (
        <Link className="floor-up-cta" href={currentUser ? "/floor/2" : "/sign-in?next=/floor/2"}>
          <span><small>NEXT FLOOR</small><b>みんなの思い出を見る</b></span>
          <i>{currentUser ? "2Fへ" : "ログイン"} →</i>
        </Link>
      )}
    </main>
  );
}
