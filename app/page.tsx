"use client";

import { useEffect, useRef, useState } from "react";

type Item = { id: string; number: string; title: string; subtitle: string; category: string; year: string; memory: string; shinmiriCount: number; theme: string };

const items: Item[] = [
  { id: "himo-q", number: "01", title: "ひもQ", subtitle: "なが〜いグミ、覚えてる？", category: "おかし", year: "2004–2008", memory: "遠足の日、ちぎれないように端から大事に食べた、あの長いグミ。友だちと長さを比べるのも定番でした。", shinmiriCount: 248, theme: "gummy" },
  { id: "yokai", number: "02", title: "妖怪ウォッチ", subtitle: "ともだち、召喚！", category: "ゲーム", year: "2004–2008", memory: "放課後になると、みんなで妖怪メダルを見せ合った。あの召喚ソングは今でも口ずさめるかも。", shinmiriCount: 196, theme: "watch" },
  { id: "tapioca", number: "03", title: "タピオカ", subtitle: "平成最後の放課後ドリンク", category: "たべもの", year: "2002–2007", memory: "長い列に並んで、黒糖ミルクを片手に写真を撮った放課後。太いストローも含めて思い出。", shinmiriCount: 174, theme: "tapioca" },
  { id: "zoro", number: "04", title: "かいけつゾロリ", subtitle: "図書室の人気者", category: "ほん", year: "2000–2009", memory: "休み時間の図書室。貸出中なら次の巻を探して、最後のなぞなぞまでしっかり読んだ。", shinmiriCount: 139, theme: "book" },
  { id: "soran", number: "05", title: "ソーラン節", subtitle: "どっこいしょ、どっこいしょ！", category: "できごと", year: "1998–2009", memory: "運動会前、筋肉痛になるまで低い姿勢を練習した。クラス全員の掛け声が揃った瞬間は忘れられない。", shinmiriCount: 121, theme: "soran" },
];

const categories = ["すべて", "おかし", "ゲーム", "たべもの", "ほん", "できごと"];

function ArrowIcon({ direction = "right" }: { direction?: "left" | "right" }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className={direction === "left" ? "flip" : ""}><path d="M5 12h13M13 6l6 6-6 6" /></svg>;
}

function NostalgiaIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.4s-7-4.3-7-10A4.2 4.2 0 0 1 12 7.3a4.2 4.2 0 0 1 7 3.1c0 5.7-7 10-7 10Z" /><path d="M8.4 11.2c.4-1.1 1.1-1.7 2.1-1.9" /></svg>;
}

function ItemArt({ theme }: { theme: string }) {
  if (theme === "gummy") return <div className="art art-gummy"><span className="gummy-line one" /><span className="gummy-line two" /><strong>ひもQ</strong><small>超ひも級！</small></div>;
  if (theme === "watch") return <div className="art art-watch"><span className="watch-face"><i>✦</i></span><strong>妖怪<br />ウォッチ</strong></div>;
  if (theme === "tapioca") return <div className="art art-tapioca"><span className="straw" /><span className="cup"><i /><i /><i /><i /><i /><i /></span><strong>TAPIOCA</strong></div>;
  if (theme === "book") return <div className="art art-book"><span className="book-cover"><b>Z</b><i>かいけつ<br />ゾロリ</i></span><span className="book-shadow" /></div>;
  return <div className="art art-soran"><span className="sun" /><span className="dancer"><i /><b /></span><strong>ソーラン節</strong></div>;
}

export default function Home() {
  const corridorRef = useRef<HTMLDivElement>(null);
  const [activeCategory, setActiveCategory] = useState("すべて");
  const [selected, setSelected] = useState<Item | null>(null);
  const [shinmiriItems, setShinmiriItems] = useState<string[]>([]);
  const [showGuide, setShowGuide] = useState(true);
  const visible = activeCategory === "すべて" ? items : items.filter((item) => item.category === activeCategory);
  const move = (direction: number) => corridorRef.current?.scrollBy({ left: direction * Math.min(window.innerWidth * 0.72, 760), behavior: "smooth" });

  useEffect(() => {
    const corridor = corridorRef.current;
    if (!corridor) return;
    const horizontalWheel = (event: WheelEvent) => { if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) { event.preventDefault(); corridor.scrollLeft += event.deltaY; } };
    const arrows = (event: KeyboardEvent) => { if (event.key === "ArrowRight") move(1); if (event.key === "ArrowLeft") move(-1); };
    corridor.addEventListener("wheel", horizontalWheel, { passive: false });
    window.addEventListener("keydown", arrows);
    return () => { corridor.removeEventListener("wheel", horizontalWheel); window.removeEventListener("keydown", arrows); };
  }, []);

  const toggleShinmiri = (id: string) => setShinmiriItems((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);

  return (
    <main className="museum-shell">
      <header className="museum-header">
        <button className="brand" onClick={() => corridorRef.current?.scrollTo({ left: 0, behavior: "smooth" })} aria-label="入口へ戻る"><span className="brand-mark">あ</span><span><b>あのころ</b><small>MUSEUM</small></span></button>
        <nav aria-label="メインナビゲーション"><button className="nav-active">展示をめぐる</button><button onClick={() => setShowGuide(true)}>はじめての方へ</button><button onClick={() => alert("展示品の投稿画面は次の実装で追加予定です。")}>思い出を展示する <span>＋</span></button></nav>
        <button className="login-button" onClick={() => alert("ログイン機能は Supabase 接続時に有効になります。")}>ログイン</button>
      </header>

      <section className="controls" aria-label="展示の絞り込み">
        <div className="era-select"><small>あなたの生まれ年</small><button>2006年 <span>⌄</span></button></div>
        <div className="category-tabs">{categories.map((category) => <button key={category} className={activeCategory === category ? "active" : ""} onClick={() => { setActiveCategory(category); corridorRef.current?.scrollTo({ left: 0 }); }}>{category}</button>)}</div>
        <div className="floor-label"><span>2F</span><div><small>平成・令和</small><b>あのころ回廊</b></div></div>
      </section>

      <div className="corridor-wrap">
        <div className="ceiling-light light-one" /><div className="ceiling-light light-two" /><div className="ceiling-light light-three" />
        <button className="scroll-arrow left" onClick={() => move(-1)} aria-label="前の展示へ"><ArrowIcon direction="left" /></button>
        <div className="corridor" ref={corridorRef}>
          <section className="intro-panel"><p className="eyebrow">WELCOME TO YOUR MEMORIES</p><h1>あのころ、<br /><em>なにしてた？</em></h1><p className="intro-copy">忘れていた景色も、音も、匂いも。<br />ここには、あなたの「あのころ」が並んでいます。</p><button className="start-button" onClick={() => move(1)}>展示をめぐる <ArrowIcon /></button><div className="wall-caption"><span>常設展</span><b>2000 — 2020</b><small>平成から令和へ</small></div></section>
          <section className="gallery" aria-live="polite">
            {visible.map((item) => <article className="exhibit" key={item.id}><div className="spotlight" /><button className="frame" onClick={() => setSelected(item)} aria-label={`${item.title}の詳細を見る`}><span className="frame-inner"><ItemArt theme={item.theme} /></span></button><div className="exhibit-label"><span className="item-number">{item.number}</span><div><h2>{item.title}</h2><p>{item.subtitle}</p><small>{item.year} 生まれの記憶</small></div><button className={shinmiriItems.includes(item.id) ? "nostalgia liked" : "nostalgia"} onClick={() => toggleShinmiri(item.id)} aria-label="しんみりする"><NostalgiaIcon /><b>{item.shinmiriCount + (shinmiriItems.includes(item.id) ? 1 : 0)}</b><small>しんみり</small></button></div></article>)}
            <article className="end-panel"><span>YOUR MEMORY</span><h2>あなたの「あのころ」も<br />展示しませんか？</h2><p>誰かにとっては、忘れられない思い出かもしれません。</p><button onClick={() => alert("投稿画面は次の実装で追加予定です。")}>思い出を展示する ＋</button></article>
          </section>
        </div>
        <button className="scroll-arrow right" onClick={() => move(1)} aria-label="次の展示へ"><ArrowIcon /></button>
        <div className="floor"><span className="floor-line" /></div><div className="scroll-hint"><span>SCROLL TO EXPLORE</span><i><b /></i></div>
      </div>

      {selected && <div className="modal-backdrop" onMouseDown={() => setSelected(null)}><section className="detail-modal" role="dialog" aria-modal="true" aria-label={`${selected.title}の展示詳細`} onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setSelected(null)} aria-label="閉じる">×</button><div className="modal-art"><div className="frame modal-frame"><span className="frame-inner"><ItemArt theme={selected.theme} /></span></div></div><div className="modal-content"><p className="eyebrow">EXHIBIT {selected.number} · {selected.category}</p><h2>{selected.title}</h2><p className="modal-subtitle">{selected.subtitle}</p><p className="modal-memory">{selected.memory}</p><div className="memory-tag">主に <b>{selected.year}年生まれ</b> の記憶</div><button className={shinmiriItems.includes(selected.id) ? "modal-like liked" : "modal-like"} onClick={() => toggleShinmiri(selected.id)}><NostalgiaIcon />しんみりした <b>{selected.shinmiriCount + (shinmiriItems.includes(selected.id) ? 1 : 0)}</b></button><div className="thread-preview"><span>みんなの思い出</span><p>「これ、学校帰りによく友達と話してたなあ…」</p><button>思い出を読む →</button></div></div></section></div>}
      {showGuide && <div className="guide-toast"><span>← →</span><div><b>横に歩いて、記憶をめぐる</b><small>マウスホイールや矢印キーで移動できます</small></div><button onClick={() => setShowGuide(false)} aria-label="案内を閉じる">×</button></div>}
    </main>
  );
}
