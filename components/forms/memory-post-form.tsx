"use client";

import { useState } from "react";

const categories = ["おかし", "ゲーム", "たべもの", "ほん", "できごと"];

export function MemoryPostForm() {
  const [hasImage, setHasImage] = useState(false);

  return (
    <form className="post-form" onSubmit={(event) => event.preventDefault()}>
      <div className="post-field post-field-wide">
        <label htmlFor="memory-title">展示タイトル</label>
        <input id="memory-title" name="title" type="text" placeholder="ひもQのあの長さ" />
      </div>

      <div className="post-field">
        <label htmlFor="memory-category">カテゴリ</label>
        <select id="memory-category" name="category" defaultValue="">
          <option value="" disabled>
            選んでください
          </option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div className="post-field">
        <label htmlFor="memory-year">生まれ年</label>
        <input id="memory-year" name="year" type="text" inputMode="numeric" placeholder="2006" />
      </div>

      <div className="post-field post-field-wide">
        <label htmlFor="memory-subtitle">ひとこと</label>
        <input id="memory-subtitle" name="subtitle" type="text" placeholder="なが〜いグミ、覚えてる？" />
      </div>

      <div className="post-field post-field-wide">
        <label htmlFor="memory-body">思い出の本文</label>
        <textarea id="memory-body" name="body" rows={6} placeholder="その頃の空気や、友だちとの会話をそのまま書く。" />
      </div>

      <label className="post-dropzone" htmlFor="memory-image">
        <span>画像を追加</span>
        <strong>ドラッグ & ドロップか、クリックで選択</strong>
        <small>著作権・商標・肖像権を確認した画像だけ追加できます。</small>
        <input
          id="memory-image"
          name="image"
          type="file"
          accept="image/*"
          onChange={(event) => setHasImage(Boolean(event.currentTarget.files?.length))}
        />
      </label>

      <label className="post-consent">
        <input name="imageRightsConfirmed" type="checkbox" required={hasImage} disabled={!hasImage} />
        <span>この画像の利用条件を確認し、公開する権利があることを確認しました。</span>
      </label>

      <div className="post-actions">
        <button className="post-secondary" type="button">
          下書き保存
        </button>
        <button className="post-primary" type="submit">
          展示を送る
        </button>
      </div>
    </form>
  );
}
