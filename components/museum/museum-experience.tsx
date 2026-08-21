"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";

import Link from "next/link";

type Exhibit = {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  category: string;
  year: string;
  description: string;
  shinmiriCount: number;
  theme: string;
};

type ExhibitComment = {
  id: string;
  content: string;
};

const exhibits: Exhibit[] = [
  { id: "himo-q", number: "01", title: "ひもQ", subtitle: "なが〜いグミ、覚えてる？", category: "おかし", year: "2004–2008", description: "遠足の日、ちぎれないように端から大事に食べた、あの長いグミ。友だちと長さを比べるのも定番でした。", shinmiriCount: 248, theme: "gummy" },
  { id: "yokai", number: "02", title: "妖怪ウォッチ", subtitle: "ともだち、召喚！", category: "ゲーム", year: "2004–2008", description: "放課後になると、みんなで妖怪メダルを見せ合った。あの召喚ソングは今でも口ずさめるかも。", shinmiriCount: 196, theme: "watch" },
  { id: "tapioca", number: "03", title: "タピオカ", subtitle: "平成最後の放課後ドリンク", category: "たべもの", year: "2002–2007", description: "長い列に並んで、黒糖ミルクを片手に写真を撮った放課後。太いストローも含めて思い出。", shinmiriCount: 174, theme: "tapioca" },
  { id: "zoro", number: "04", title: "かいけつゾロリ", subtitle: "図書室の人気者", category: "ほん", year: "2000–2009", description: "休み時間の図書室。貸出中なら次の巻を探して、最後のなぞなぞまでしっかり読んだ。", shinmiriCount: 139, theme: "book" },
  { id: "soran", number: "05", title: "ソーラン節", subtitle: "どっこいしょ、どっこいしょ！", category: "できごと", year: "1998–2009", description: "運動会前、筋肉痛になるまで低い姿勢を練習した。クラス全員の掛け声が揃った瞬間は忘れられない。", shinmiriCount: 121, theme: "soran" },
];

const categories = ["すべて", "おかし", "ゲーム", "たべもの", "ほん", "できごと"];

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

function ExhibitArt({ theme }: { theme: string }) {
  if (theme === "gummy") return <div className="art art-gummy"><span className="gummy-line one" /><span className="gummy-line two" /><strong>ひもQ</strong><small>超ひも級！</small></div>;
  if (theme === "watch") return <div className="art art-watch"><span className="watch-face"><i>✦</i></span><strong>妖怪<br />ウォッチ</strong></div>;
  if (theme === "tapioca") return <div className="art art-tapioca"><span className="straw" /><span className="cup"><i /><i /><i /><i /><i /><i /></span><strong>TAPIOCA</strong></div>;
  if (theme === "book") return <div className="art art-book"><span className="book-cover"><b>Z</b><i>かいけつ<br />ゾロリ</i></span><span className="book-shadow" /></div>;
  return <div className="art art-soran"><span className="sun" /><span className="dancer"><i /><b /></span><strong>ソーラン節</strong></div>;
}

export function MuseumExperience() {
  const corridorRef = useRef<HTMLDivElement>(null);
  const [activeCategory, setActiveCategory] = useState("すべて");
  const [selected, setSelected] = useState<Exhibit | null>(null);
  const [shinmiriItems, setShinmiriItems] = useState<string[]>([]);
  const [commentsByExhibit, setCommentsByExhibit] = useState<Record<string, ExhibitComment[]>>({});
  const [commentDraft, setCommentDraft] = useState("");
  const [showGuide, setShowGuide] = useState(true);
  const visible = activeCategory === "すべて" ? exhibits : exhibits.filter((item) => item.category === activeCategory);
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
    setShinmiriItems((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));

  const handleCommentSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = commentDraft.trim();

    if (!selected || !content) return;

    const comment = { id: crypto.randomUUID(), content };
    setCommentsByExhibit((current) => ({
      ...current,
      [selected.id]: [...(current[selected.id] ?? []), comment],
    }));
    setCommentDraft("");
  };

  return (
    <main className="museum-shell">
      <header className="museum-header">
        <button className="brand" onClick={() => corridorRef.current?.scrollTo({ left: 0, behavior: "smooth" })} aria-label="入口へ戻る">
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

        <Link className="login-button" href="/sign-in">
          ログイン
        </Link>
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
                <button className="frame" onClick={() => setSelected(item)} aria-label={`${item.title}の詳細を見る`}>
                  <span className="frame-inner">
                    <ExhibitArt theme={item.theme} />
                  </span>
                </button>
                <div className="exhibit-label">
                  <span className="item-number">{item.number}</span>
                  <div>
                    <h2>{item.title}</h2>
                    <p>{item.subtitle}</p>
                    <small>{item.year} 生まれの記憶</small>
                  </div>
                  <button className={shinmiriItems.includes(item.id) ? "nostalgia liked" : "nostalgia"} onClick={() => toggleShinmiri(item.id)} aria-label="しんみりする">
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
                あなたの「あのころ」も<br />
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
          <section className="detail-modal" role="dialog" aria-modal="true" aria-label={`${selected.title}の展示詳細`} onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelected(null)} aria-label="閉じる">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
            <div className="modal-main">
              <div className="modal-art">
                <div className="frame modal-frame">
                  <span className="frame-inner">
                    <ExhibitArt theme={selected.theme} />
                  </span>
                </div>
              </div>
              <div className="modal-content">
                <p className="eyebrow">
                  EXHIBIT {selected.number} · {selected.category}
                </p>
                <div className="modal-title-row">
                  <div>
                    <h2>{selected.title}</h2>
                    <p className="modal-subtitle">{selected.subtitle}</p>
                  </div>
                  <button className={shinmiriItems.includes(selected.id) ? "modal-like liked" : "modal-like"} onClick={() => toggleShinmiri(selected.id)}>
                    <NostalgiaIcon />
                    <span>しんみり</span>
                    <b>{selected.shinmiriCount + (shinmiriItems.includes(selected.id) ? 1 : 0)}</b>
                  </button>
                </div>
                <p className="modal-memory">{selected.description}</p>
                <div className="memory-tag">
                  主に <b>{selected.year}年生まれ</b> の記憶
                </div>
              </div>
            </div>
            <aside className="modal-comments" aria-label="コメント欄">
              <div className="modal-comments-heading">
                <h3>{1 + (commentsByExhibit[selected.id]?.length ?? 0)}件のコメント</h3>
              </div>
              <div className="modal-comment-list">
                <article className="modal-comment">
                  <span>あのころの来場者</span>
                  <p>「これ、学校帰りによく友達と話してたなあ…」</p>
                </article>
                {(commentsByExhibit[selected.id] ?? []).map((comment) => (
                  <article className="modal-comment" key={comment.id}>
                    <span>あなた</span>
                    <p>{comment.content}</p>
                  </article>
                ))}
              </div>
              <form className="modal-comment-form" onSubmit={handleCommentSubmit}>
                <label htmlFor={`comment-${selected.id}`}>コメントを入力</label>
                <textarea
                  id={`comment-${selected.id}`}
                  value={commentDraft}
                  onChange={(event) => setCommentDraft(event.target.value)}
                  placeholder="あなたの思い出を書いてください"
                  maxLength={500}
                  rows={3}
                />
                <div className="modal-comment-actions">
                  <small>{commentDraft.length} / 500</small>
                  <button className="modal-comment-button" type="submit" disabled={!commentDraft.trim()}>
                    コメントする
                  </button>
                </div>
              </form>
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
