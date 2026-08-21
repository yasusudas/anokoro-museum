"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { createClient } from "@/lib/supabase/browser";

import {
  createCommentAction,
  deleteCommentAction,
  getCommentsAction,
  toggleCommentLikeAction,
} from "@/features/comments/application/comments";
import { MAX_COMMENT_LENGTH } from "@/features/comments/domain/comment";
import type { CommentView } from "@/features/comments/types";

type CommentThreadProps = {
  itemId: string;
};

const URL_PATTERN = /(https?:\/\/[^\s<]+)/g;

function renderCommentContent(content: string) {
  return content.split(URL_PATTERN).map((part, index) => {
    if (/^https?:\/\//.test(part)) {
      return (
        <a key={`${part}-${index}`} href={part} target="_blank" rel="noreferrer">
          {part}
        </a>
      );
    }

    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

function formatCommentDate(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function CommentThread({ itemId }: CommentThreadProps) {
  const [comments, setComments] = useState<CommentView[]>([]);
  const [content, setContent] = useState("");
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [isViewerLoading, setIsViewerLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyCommentId, setBusyCommentId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const draftKey = useMemo(
    () => `comment-draft:${viewerId ?? "anonymous"}:${itemId}`,
    [itemId, viewerId],
  );

  const loadComments = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    const result = await getCommentsAction(itemId);

    if (!result.ok) {
      setErrorMessage(result.error.message);
      setComments([]);
    } else {
      setComments(result.data);
    }

    setIsLoading(false);
  }, [itemId]);

  useEffect(() => {
    let isActive = true;

    async function loadViewer() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (isActive) {
          setViewerId(user?.id ?? null);
        }
      } catch {
        if (isActive) {
          setViewerId(null);
        }
      } finally {
        if (isActive) {
          setIsViewerLoading(false);
        }
      }
    }

    void loadViewer();
    const loadTimer = window.setTimeout(() => {
      void loadComments();
    }, 0);

    return () => {
      isActive = false;
      window.clearTimeout(loadTimer);
    };
  }, [itemId, loadComments]);

  useEffect(() => {
    const draftTimer = window.setTimeout(() => {
      try {
        const draft = window.localStorage.getItem(draftKey);
        setContent(draft ?? "");
      } catch {
        setContent("");
      }
    }, 0);

    return () => window.clearTimeout(draftTimer);
  }, [draftKey]);

  function handleContentChange(value: string) {
    setContent(value);

    try {
      if (value) {
        window.localStorage.setItem(draftKey, value);
      } else {
        window.localStorage.removeItem(draftKey);
      }
    } catch {
      // 下書き保存に失敗しても投稿自体は継続する
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);
    const result = await createCommentAction(formData);

    if (!result.ok) {
      setErrorMessage(result.error.message);
      setIsSubmitting(false);
      return;
    }

    handleContentChange("");
    await loadComments();
    setIsSubmitting(false);
  }

  async function handleDelete(comment: CommentView) {
    if (!window.confirm("このコメントを削除しますか？")) return;

    setBusyCommentId(comment.id);
    setErrorMessage("");

    const formData = new FormData();
    formData.set("commentId", comment.id);
    const result = await deleteCommentAction(formData);

    if (!result.ok) {
      setErrorMessage(result.error.message);
    } else {
      await loadComments();
    }

    setBusyCommentId(null);
  }

  async function handleLike(comment: CommentView) {
    setBusyCommentId(comment.id);
    setErrorMessage("");

    const formData = new FormData();
    formData.set("commentId", comment.id);
    const result = await toggleCommentLikeAction(formData);

    if (!result.ok) {
      setErrorMessage(result.error.message);
    } else {
      await loadComments();
    }

    setBusyCommentId(null);
  }

  return (
    <section className="comment-thread" aria-labelledby="comment-thread-title">
      <div className="comment-thread-heading">
        <span id="comment-thread-title">みんなの思い出</span>
        <small>{comments.length}件</small>
      </div>

      {isLoading ? (
        <p className="comment-status">コメントを読み込んでいます…</p>
      ) : comments.length === 0 ? (
        <p className="comment-status">まだコメントはありません。最初の思い出を書いてみませんか？</p>
      ) : (
        <div className="comment-list">
          {comments.map((comment) => (
            <article className="comment-card" key={comment.id}>
              <div className="comment-meta">
                <b>{comment.authorName}</b>
                <time dateTime={comment.createdAt}>{formatCommentDate(comment.createdAt)}</time>
              </div>
              <p className="comment-content">{renderCommentContent(comment.content)}</p>
              <div className="comment-actions">
                <button
                  type="button"
                  className={comment.isLikedByCurrentUser ? "comment-like liked" : "comment-like"}
                  onClick={() => void handleLike(comment)}
                  disabled={busyCommentId === comment.id}
                >
                  いいね {comment.likeCount}
                </button>
                {comment.canDelete && (
                  <button
                    type="button"
                    className="comment-delete"
                    onClick={() => void handleDelete(comment)}
                    disabled={busyCommentId === comment.id}
                  >
                    削除
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {isViewerLoading ? (
        <p className="comment-status">投稿状態を確認しています…</p>
      ) : viewerId ? (
        <form className="comment-form" onSubmit={handleSubmit}>
          <label htmlFor={`comment-content-${itemId}`}>思い出を残す</label>
          <textarea
            id={`comment-content-${itemId}`}
            name="content"
            value={content}
            onChange={(event) => handleContentChange(event.currentTarget.value)}
            maxLength={MAX_COMMENT_LENGTH}
            rows={4}
            placeholder="この展示にまつわる思い出を書いてみませんか？"
          />
          <input type="hidden" name="itemId" value={itemId} />
          <div className="comment-form-footer">
            <small>{content.length}/{MAX_COMMENT_LENGTH}</small>
            <button type="submit" disabled={isSubmitting || content.trim().length === 0}>
              {isSubmitting ? "投稿中…" : "コメントする"}
            </button>
          </div>
        </form>
      ) : (
        <p className="comment-login-prompt">
          コメントするには <Link href={`/sign-in?next=${encodeURIComponent(`/exhibits/${itemId}`)}`}>ログイン</Link> してください。
        </p>
      )}

      {errorMessage && <p className="comment-error" role="alert">{errorMessage}</p>}
    </section>
  );
}
