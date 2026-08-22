"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Trash2 } from "lucide-react";

const categories = ["おかし", "ゲーム", "たべもの", "ほん", "できごと"];
type FieldName = "title" | "category" | "year" | "subtitle" | "image";
type FieldErrors = Partial<Record<FieldName, string>>;

export function MemoryPostForm() {
  const [selectedFileName, setSelectedFileName] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function selectImage(file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) return;

    clearFieldError("image");
    setSelectedFileName(file.name);
    setPreviewUrl((currentUrl) => {
      if (currentUrl) URL.revokeObjectURL(currentUrl);
      return URL.createObjectURL(file);
    });
  }

  function clearFieldError(fieldName: FieldName) {
    setFieldErrors((currentErrors) => {
      if (!currentErrors[fieldName]) return currentErrors;

      const nextErrors = { ...currentErrors };
      delete nextErrors[fieldName];
      return nextErrors;
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const nextErrors: FieldErrors = {};
    const textFields: Exclude<FieldName, "image">[] = ["title", "category", "year", "subtitle"];

    textFields.forEach((fieldName) => {
      if (!String(formData.get(fieldName) ?? "").trim()) nextErrors[fieldName] = "未入力です。";
    });

    const year = String(formData.get("year") ?? "");
    if (year && !/^[0-9]{4}$/.test(year)) nextErrors.year = "4桁の数字で入力してください。";
    if (!selectedFileName) nextErrors.image = "未入力です。";

    setFieldErrors(nextErrors);
  }

  return (
    <form className="post-form" noValidate onSubmit={handleSubmit}>
      <div className="post-field post-field-wide">
        <label htmlFor="memory-title">展示タイトル</label>
        <input
          id="memory-title"
          name="title"
          type="text"
          required
          aria-invalid={Boolean(fieldErrors.title)}
          aria-describedby={fieldErrors.title ? "memory-title-error" : undefined}
          placeholder="（例）妖怪ウォッチ"
          onInput={() => clearFieldError("title")}
        />
        {fieldErrors.title && (
          <p id="memory-title-error" className="post-field-error" role="alert">
            {fieldErrors.title}
          </p>
        )}
      </div>

      <div className="post-field-row">
        <div className="post-field">
          <label htmlFor="memory-category">ジャンル</label>
          <div className="post-select-control">
            <select
              id="memory-category"
              name="category"
              defaultValue=""
              required
              aria-invalid={Boolean(fieldErrors.category)}
              aria-describedby={fieldErrors.category ? "memory-category-error" : undefined}
              onChange={() => clearFieldError("category")}
            >
              <option value="" disabled>
                選択してください
              </option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <ChevronDown aria-hidden="true" size={18} strokeWidth={1.8} />
          </div>
          {fieldErrors.category && (
            <p id="memory-category-error" className="post-field-error" role="alert">
              {fieldErrors.category}
            </p>
          )}
        </div>

        <div className="post-field">
          <label htmlFor="memory-year">流行った年</label>
          <input
            id="memory-year"
            name="year"
            type="text"
            inputMode="numeric"
            pattern="[0-9]{4}"
            minLength={4}
            maxLength={4}
            required
            aria-invalid={Boolean(fieldErrors.year)}
            aria-describedby={fieldErrors.year ? "memory-year-error" : undefined}
            placeholder="（例）2007"
            onInput={(event) => {
              event.currentTarget.value = event.currentTarget.value.replace(/[^0-9]/g, "").slice(0, 4);
              clearFieldError("year");
            }}
          />
          {fieldErrors.year && (
            <p id="memory-year-error" className="post-field-error" role="alert">
              {fieldErrors.year}
            </p>
          )}
        </div>
      </div>

      <div className="post-field post-field-wide">
        <label htmlFor="memory-subtitle">説明</label>
        <textarea
          id="memory-subtitle"
          name="subtitle"
          rows={3}
          required
          aria-invalid={Boolean(fieldErrors.subtitle)}
          aria-describedby={fieldErrors.subtitle ? "memory-subtitle-error" : undefined}
          placeholder="その展示についての説明を書いてください。"
          onInput={() => clearFieldError("subtitle")}
        />
        {fieldErrors.subtitle && (
          <p id="memory-subtitle-error" className="post-field-error" role="alert">
            {fieldErrors.subtitle}
          </p>
        )}
      </div>

      <div className="post-image-field">
        <span className="post-image-label">画像を追加</span>
        <div className="post-image-control">
          <label
            className={`post-dropzone${isDragging ? " is-dragging" : ""}`}
            htmlFor="memory-image"
            onDragOver={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              event.stopPropagation();
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
            {previewUrl ? (
              <a className="post-image-link" href={previewUrl} target="_blank" rel="noreferrer">
                {selectedFileName}
              </a>
            ) : (
              <>
                <strong>ドラッグ & ドロップまたはクリックで選択</strong>
                <small>画像を選択すると、ここにファイル名が表示されます</small>
              </>
            )}
            <input
              id="memory-image"
              name="image"
              type="file"
              accept="image/*"
              required
              aria-invalid={Boolean(fieldErrors.image)}
              aria-describedby={fieldErrors.image ? "memory-image-error" : undefined}
              ref={imageInputRef}
              onChange={(event) => selectImage(event.currentTarget.files?.[0])}
            />
          </label>
          {selectedFileName && (
            <button
              className="post-image-remove"
              type="button"
              aria-label="画像を削除"
              title="画像を削除"
              onClick={() => {
                setSelectedFileName("");
                setPreviewUrl("");
                if (imageInputRef.current) imageInputRef.current.value = "";
              }}
            >
              <Trash2 aria-hidden="true" size={18} strokeWidth={1.8} />
            </button>
          )}
        </div>
        {fieldErrors.image && (
          <p id="memory-image-error" className="post-field-error" role="alert">
            {fieldErrors.image}
          </p>
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
