"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Trash2 } from "lucide-react";
import { createExhibitAction } from "@/features/exhibits/actions/create-exhibit";

const categories = [
  "おかし",
  "ゲーム",
  "たべもの",
  "ほん",
  "できごと",
  "ガジェット",
  "インターネット",
];

type FieldName = "title" | "category" | "year" | "description" | "image";
type FieldErrors = Partial<Record<FieldName, string>>;

export function MemoryPostForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedFileName, setSelectedFileName] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function selectImage(file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) return;

    clearFieldError("image");
    setGeneralError(null);
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
    setGeneralError(null);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGeneralError(null);

    const formElement = event.currentTarget;
    const formData = new FormData(formElement);
    const nextErrors: FieldErrors = {};
    const textFields: Exclude<FieldName, "image">[] = ["title", "category", "year", "description"];

    textFields.forEach((fieldName) => {
      if (!String(formData.get(fieldName) ?? "").trim()) nextErrors[fieldName] = "未入力です。";
    });

    const year = String(formData.get("year") ?? "");
    if (year && !/^[0-9]{4}$/.test(year)) nextErrors.year = "4桁の数字で入力してください。";
    if (!selectedFileName) nextErrors.image = "未入力です。";

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    startTransition(async () => {
      try {
        const result = await createExhibitAction(formData);

        if (!result.ok) {
          if (result.error.fieldErrors) {
            const serverFieldErrors: FieldErrors = {};
            for (const [key, messages] of Object.entries(result.error.fieldErrors)) {
              if (
                key in nextErrors ||
                key === "description" ||
                key === "title" ||
                key === "category" ||
                key === "year" ||
                key === "image"
              ) {
                serverFieldErrors[key as FieldName] = messages[0];
              }
            }
            setFieldErrors(serverFieldErrors);
          }
          setGeneralError(result.error.message || "展示の投稿に失敗しました。");
          return;
        }

        router.push("/");
        router.refresh();
      } catch {
        setGeneralError("展示の投稿処理中にエラーが発生しました。時間をおいて再試行してください。");
      }
    });
  }

  return (
    <form className="post-form" noValidate onSubmit={handleSubmit}>
      {generalError && (
        <div className="post-field-error-banner" role="alert" style={{ color: "#ef4444", marginBottom: "1rem", fontSize: "0.875rem" }}>
          {generalError}
        </div>
      )}

      <div className="post-field post-field-wide">
        <label htmlFor="memory-title">展示タイトル</label>
        <input
          id="memory-title"
          name="title"
          type="text"
          required
          disabled={isPending}
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
              disabled={isPending}
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
            disabled={isPending}
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
        <label htmlFor="memory-description">説明</label>
        <textarea
          id="memory-description"
          name="description"
          rows={3}
          required
          disabled={isPending}
          aria-invalid={Boolean(fieldErrors.description)}
          aria-describedby={fieldErrors.description ? "memory-description-error" : undefined}
          placeholder="その展示についての説明を書いてください。"
          onInput={() => clearFieldError("description")}
        />
        {fieldErrors.description && (
          <p id="memory-description-error" className="post-field-error" role="alert">
            {fieldErrors.description}
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
              if (!isPending) setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setIsDragging(false);
              if (isPending) return;

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
              accept="image/jpeg,image/png,image/webp"
              required
              disabled={isPending}
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
              disabled={isPending}
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
        <button className="post-primary" type="submit" disabled={isPending}>
          {isPending ? "展示中..." : "展示する"}
        </button>
      </div>
    </form>
  );
}
