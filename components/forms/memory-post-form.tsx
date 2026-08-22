"use client";

import { useEffect, useRef, useState } from "react";

const categories = ["おかし", "ゲーム", "たべもの", "ほん", "できごと"];

export function MemoryPostForm() {
  const [selectedFileName, setSelectedFileName] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function selectImage(file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) return;

    setSelectedFileName(file.name);
    setPreviewUrl((currentUrl) => {
      if (currentUrl) URL.revokeObjectURL(currentUrl);
      return URL.createObjectURL(file);
    });
  }

  return (
    <form className="post-form" onSubmit={(event) => event.preventDefault()}>
      <div className="post-field post-field-wide">
        <label htmlFor="memory-title">展示タイトル</label>
        <input id="memory-title" name="title" type="text" placeholder="（例）妖怪ウォッチ" />
      </div>

      <div className="post-field">
        <label htmlFor="memory-category">ジャンル</label>
        <select id="memory-category" name="category" defaultValue="">
          <option value="" disabled>
            選択してください
          </option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div className="post-field">
        <label htmlFor="memory-year">流行った年</label>
        <input
          id="memory-year"
          name="year"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="（例）2007"
          onInput={(event) => {
            event.currentTarget.value = event.currentTarget.value.replace(/[^0-9]/g, "");
          }}
        />
      </div>

      <div className="post-field post-field-wide">
        <label htmlFor="memory-subtitle">説明</label>
        <textarea id="memory-subtitle" name="subtitle" rows={3} placeholder="その展示についての説明を書いてください。" />
      </div>

      <div className="post-image-field">
        <span className="post-image-label">画像を追加</span>
        <label
          className={`post-dropzone${isDragging ? " is-dragging" : ""}`}
          htmlFor="memory-image"
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            const file = event.dataTransfer.files[0];

            if (file) {
              const dataTransfer = new DataTransfer();
              dataTransfer.items.add(file);
              if (imageInputRef.current) imageInputRef.current.files = dataTransfer.files;
              selectImage(file);
            }
          }}
        >
          <strong>ドラッグ & ドロップまたはクリックで選択</strong>
          {previewUrl ? (
            <a className="post-image-link" href={previewUrl} target="_blank" rel="noreferrer">
              {selectedFileName}
            </a>
          ) : (
            <small>画像を選択すると、ここにファイル名が表示されます</small>
          )}
          <input
            id="memory-image"
            name="image"
            type="file"
            accept="image/*"
            ref={imageInputRef}
            onChange={(event) => selectImage(event.currentTarget.files?.[0])}
          />
        </label>
        {selectedFileName && (
          <button
            className="post-image-remove"
            type="button"
            onClick={() => {
              setSelectedFileName("");
              setPreviewUrl("");
              if (imageInputRef.current) imageInputRef.current.value = "";
            }}
          >
            画像を削除
          </button>
        )}
      </div>

      <div className="post-actions">
        <button className="post-primary" type="submit">
          展示する
        </button>
      </div>
    </form>
  );
}
