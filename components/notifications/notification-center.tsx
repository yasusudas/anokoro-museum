"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Bell, Heart, MessageCircle, X } from "lucide-react";

import {
  getNotificationsAction,
  markNotificationsReadAction,
} from "@/features/notifications/actions/notifications";
import type { NotificationView } from "@/features/notifications/types";

function formatNotificationDate(createdAt: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(createdAt));
}

export function NotificationCenter() {
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const isOpenRef = useRef(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [notifications, setNotifications] = useState<NotificationView[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  const markUnreadNotificationsRead = useCallback((notificationItems: NotificationView[]) => {
    const unreadIds = new Set(
      notificationItems
        .filter((notification) => !notification.isRead)
        .map((notification) => notification.id),
    );

    setNotifications(notificationItems.map((notification) => (
      unreadIds.has(notification.id) ? { ...notification, isRead: true } : notification
    )));

    if (unreadIds.size === 0) return;

    startTransition(async () => {
      const result = await markNotificationsReadAction();
      if (!result.ok) {
        setNotifications((current) => current.map((notification) => (
          unreadIds.has(notification.id) ? { ...notification, isRead: false } : notification
        )));
        setErrorMessage(result.error.message);
      }
    });
  }, []);

  useEffect(() => {
    startTransition(async () => {
      const result = await getNotificationsAction();
      if (result.ok) {
        if (isOpenRef.current) {
          markUnreadNotificationsRead(result.data);
        } else {
          setNotifications(result.data);
        }
      } else {
        setErrorMessage(result.error.message);
      }
    });
  }, [markUnreadNotificationsRead]);

  useEffect(() => {
    if (!isOpen) return;

    const triggerElement = triggerRef.current;
    closeRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        isOpenRef.current = false;
        setIsOpen(false);
        return;
      }
      if (event.key !== "Tab") return;

      const focusableElements = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      );
      if (!focusableElements?.length) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      triggerElement?.focus();
    };
  }, [isOpen]);

  const handleOpen = () => {
    isOpenRef.current = true;
    setIsOpen(true);
    markUnreadNotificationsRead(notifications);
  };

  const handleClose = () => {
    isOpenRef.current = false;
    setIsOpen(false);
  };

  return (
    <>
      <button
        ref={triggerRef}
        className="notification-trigger"
        type="button"
        aria-label={unreadCount > 0 ? `通知を開く、未読${unreadCount}件` : "通知を開く"}
        aria-expanded={isOpen}
        aria-controls="notification-dialog"
        onClick={handleOpen}
      >
        <Bell aria-hidden="true" size={22} strokeWidth={1.7} />
        {unreadCount > 0 && <span className="notification-badge" aria-hidden="true" />}
      </button>

      {isOpen && (
        <div className="notification-backdrop" onMouseDown={handleClose}>
          <section
            ref={dialogRef}
            className="notification-dialog"
            id="notification-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="notification-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="notification-dialog-header">
              <div>
                <span>お知らせ</span>
                <h2 id="notification-title">あなたの展示への反応</h2>
              </div>
              <button ref={closeRef} type="button" aria-label="通知を閉じる" onClick={handleClose}>
                <X aria-hidden="true" size={20} />
              </button>
            </header>

            <div className="notification-list" aria-busy={isPending}>
              {errorMessage ? (
                <p className="notification-status" role="alert">{errorMessage}</p>
              ) : isPending && notifications.length === 0 ? (
                <p className="notification-status">通知を読み込んでいます…</p>
              ) : notifications.length === 0 ? (
                <p className="notification-status">まだ通知はありません。</p>
              ) : (
                notifications.map((notification) => (
                  <article className="notification-item" key={notification.id}>
                    <span className={`notification-icon notification-icon-${notification.type}`}>
                      {notification.type === "comment" ? (
                        <MessageCircle aria-hidden="true" size={18} />
                      ) : (
                        <Heart aria-hidden="true" size={18} />
                      )}
                    </span>
                    <div>
                      <p>
                        「{notification.itemTitle}」に{notification.actorName}さんから
                        {notification.type === "comment" ? "コメントがあります。" : "しんみりが届きました。"}
                      </p>
                      <time dateTime={notification.createdAt}>{formatNotificationDate(notification.createdAt)}</time>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
