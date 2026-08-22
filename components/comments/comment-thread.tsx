"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { createClient } from "@/lib/supabase/browser";

import {
  createCommentAction,
  deleteCommentAction,
  getCommentsAction,
  toggleCommentLikeAction,
} from "@/features/comments/application/comments";
import { MAX_COMMENT_LENGTH, splitCommentContent } from "@/features/comments/domain/comment";
import type { CommentView } from "@/features/comments/types";

type CommentThreadProps = {
  itemId: string;
};

const COMMENT_REQUEST_ERROR = "通信に失敗しました。もう一度お試しください";
const OFFLINE_COMMENT_ERROR = "オフラインのため送信できません。接続を確認してからもう一度お試しください";

function renderCommentContent(content: string) {
  return splitCommentContent(content).map((part, index) => {
    if (part.type === "url") {
      return (
        <a key={`${part.value}-${index}`} href={part.value} target="_blank" rel="noreferrer">
          {part.value}
        </a>
      );
    }

    return <span key={`${part.value}-${index}`}>{part.value}</span>;
  });
}

function formatCommentDate(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function CommentHeartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21.2l7.8-7.7 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
    </svg>
  );
}

export function CommentThread({ itemId }: CommentThreadProps) {
  const [comments, setComments] = useState<CommentView[]>([]);
  const [content, setContent] = useState("");
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [isViewerLoading, setIsViewerLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyCommentId, setBusyCommentId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const loadComments = useCallback(async ({ showLoading = true }: { showLoading?: boolean } = {}) => {
    if (showLoading) {
      setIsLoading(true);
    }
    setErrorMessage("");

    try {
      const result = await getCommentsAction(itemId);

      if (!result.ok) {
        setErrorMessage(result.error.message);
        return false;
      }

      setComments(result.data);
      return true;
    } catch (error) {
      console.error("Failed to load comments:", error);
      setErrorMessage("コメントを読み込めませんでした。もう一度お試しください");
      return false;
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
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

  function handleContentChange(value: string) {
    setContent(value);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      if (!window.navigator.onLine) {
        setErrorMessage(OFFLINE_COMMENT_ERROR);
        return;
      }

      const formData = new FormData(event.currentTarget);
      const result = await createCommentAction(formData);

      if (!result.ok) {
        setErrorMessage(result.error.message);
        return;
      }

      handleContentChange("");
      await loadComments({ showLoading: false });
    } catch (error) {
      console.error("Failed to create comment:", error);
      setErrorMessage(COMMENT_REQUEST_ERROR);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(comment: CommentView) {
    setOpenMenuId(null);
    if (!window.confirm("このコメントを削除しますか？")) return;

    setBusyCommentId(comment.id);
    setErrorMessage("");

    try {
      const formData = new FormData();
      formData.set("commentId", comment.id);
      const result = await deleteCommentAction(formData);

      if (!result.ok) {
        setErrorMessage(result.error.message);
      } else {
        await loadComments({ showLoading: false });
      }
    } catch (error) {
      console.error("Failed to delete comment:", error);
      setErrorMessage(COMMENT_REQUEST_ERROR);
    } finally {
      setBusyCommentId(null);
    }
  }

  async function handleLike(comment: CommentView) {
    setBusyCommentId(comment.id);
    setErrorMessage("");

    const previousLiked = comment.isLikedByCurrentUser;
    const previousLikeCount = comment.likeCount;
    const optimisticLiked = !previousLiked;

    setComments((current) =>
      current.map((currentComment) =>
        currentComment.id === comment.id
          ? {
              ...currentComment,
              isLikedByCurrentUser: optimisticLiked,
              likeCount: Math.max(0, previousLikeCount + (optimisticLiked ? 1 : -1)),
            }
          : currentComment,
      ),
    );

    try {
      const formData = new FormData();
      formData.set("commentId", comment.id);
      const result = await toggleCommentLikeAction(formData);

      if (!result.ok) {
        setComments((current) =>
          current.map((currentComment) =>
            currentComment.id === comment.id
              ? { ...currentComment, isLikedByCurrentUser: previousLiked, likeCount: previousLikeCount }
              : currentComment,
          ),
        );
        setErrorMessage(result.error.message);
        return;
      }

      await loadComments({ showLoading: false });
    } catch (error) {
      console.error("Failed to toggle comment like:", error);
      setComments((current) =>
        current.map((currentComment) =>
          currentComment.id === comment.id
            ? { ...currentComment, isLikedByCurrentUser: previousLiked, likeCount: previousLikeCount }
            : currentComment,
        ),
      );
      setErrorMessage(COMMENT_REQUEST_ERROR);
    } finally {
      setBusyCommentId(null);
    }
  }

  return (
    <section className="comment-thread" aria-labelledby="comment-thread-title">
      <div className="comment-thread-heading">
        <h3 id="comment-thread-title">{comments.length}件のコメント</h3>
      </div>

      <div className="comment-feed">
        {isLoading ? (
          <p className="comment-status">コメントを読み込んでいます…</p>
        ) : comments.length === 0 ? (
          <p className="comment-status">まだコメントはありません。最初の思い出を書いてみませんか？</p>
        ) : (
          <div className="comment-list">
            {comments.map((comment) => (
              <article
                className="comment-card"
                key={comment.id}
                onMouseLeave={() => setOpenMenuId(null)}
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget)) setOpenMenuId(null);
                }}
              >
                <div className="comment-meta">
                  <b>{comment.authorName}</b>
                  <div className="comment-meta-actions">
                    <time dateTime={comment.createdAt}>{formatCommentDate(comment.createdAt)}</time>
                    {comment.canDelete && (
                      <div className="comment-menu">
                        <button
                          type="button"
                          className="comment-menu-trigger"
                          onClick={() => setOpenMenuId((current) => current === comment.id ? null : comment.id)}
                          aria-label="コメントの操作を開く"
                          aria-expanded={openMenuId === comment.id}
                        >
                          …
                        </button>
                        {openMenuId === comment.id && (
                          <div className="comment-menu-popup">
                            <button
                              type="button"
                              className="comment-delete"
                              onClick={() => void handleDelete(comment)}
                              disabled={busyCommentId === comment.id}
                            >
                              削除
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <p className="comment-content">{renderCommentContent(comment.content)}</p>
                <button
                  type="button"
                  className={comment.isLikedByCurrentUser ? "comment-like liked" : "comment-like"}
                  onClick={() => void handleLike(comment)}
                  disabled={busyCommentId === comment.id}
                  aria-pressed={comment.isLikedByCurrentUser}
                  aria-label={`このコメントにいいね ${comment.likeCount}件`}
                >
                  <CommentHeartIcon />
                  <span>{comment.likeCount}</span>
                </button>
              </article>
            ))}
          </div>
        )}
      </div>

      {isViewerLoading ? (
        <p className="comment-status">投稿状態を確認しています…</p>
      ) : viewerId ? (
        <form className="comment-form" onSubmit={handleSubmit}>
          <label htmlFor={`comment-content-${itemId}`}>コメントを書く</label>
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
          コメントするには <Link href={`/sign-in?next=${encodeURIComponent(`/floor/2?exhibit=${itemId}`)}`}>ログイン</Link> してください。
        </p>
      )}

      {errorMessage && <p className="comment-error" role="alert">{errorMessage}</p>}
    </section>
  );
}
