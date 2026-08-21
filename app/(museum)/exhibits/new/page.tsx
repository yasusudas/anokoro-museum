import Link from "next/link";

import { MemoryPostForm } from "@/components/forms/memory-post-form";

export default function NewExhibitPage() {
  return (
    <main className="post-shell">
      <section className="post-hero">
        <p className="post-eyebrow">NEW EXHIBIT</p>
        <h1>
          あのころを、
          <br />
          展示にする
        </h1>
        <p className="post-lead">
          写真、ひとこと、思い出の背景をまとめて投稿できます。下書きのままでも、あとで続きを足せる前提で作っています。
        </p>

        <div className="post-rail">
          <article>
            <span>1</span>
            <h2>記憶を集める</h2>
            <p>タイトルと背景を先に書いて、思い出の輪郭を決める。</p>
          </article>
          <article>
            <span>2</span>
            <h2>見せ方を整える</h2>
            <p>カテゴリ、年代、画像を添えて展示の雰囲気を作る。</p>
          </article>
          <article>
            <span>3</span>
            <h2>下書きで残す</h2>
            <p>まだ公開しないなら、途中保存の導線を優先する。</p>
          </article>
        </div>

        <Link className="post-back-link" href="/">
          回廊に戻る
        </Link>
      </section>

      <section className="post-panel" aria-label="思い出の投稿フォーム">
        <MemoryPostForm />
      </section>
    </main>
  );
}