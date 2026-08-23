"use server";

import type { ActionResult } from "@/features/auth/types";
import { createClient } from "@/lib/supabase/server";

import type { NotificationType, NotificationView } from "../types";

export async function getNotificationsAction(): Promise<ActionResult<NotificationView[]>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      error: { code: "UNAUTHENTICATED", message: "通知を見るにはログインが必要です" },
    };
  }

  const { data, error } = await supabase
    .from("notifications")
    .select(`
      id,
      event_type,
      read_at,
      created_at,
      actor:users!notifications_actor_user_id_fkey(user_name),
      item:items!notifications_item_id_fkey(title)
    `)
    .eq("recipient_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Supabase notifications query error:", error);
    return {
      ok: false,
      error: { code: "INTERNAL_ERROR", message: "通知を読み込めませんでした" },
    };
  }

  return {
    ok: true,
    data: data.map((notification) => ({
      id: notification.id,
      type: notification.event_type as NotificationType,
      actorName: notification.actor?.user_name ?? "あのころの来場者",
      itemTitle: notification.item?.title ?? "展示品",
      createdAt: notification.created_at,
      isRead: notification.read_at !== null,
    })),
  };
}

export async function markNotificationsReadAction(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      error: { code: "UNAUTHENTICATED", message: "通知を更新するにはログインが必要です" },
    };
  }

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_user_id", user.id)
    .is("read_at", null);

  if (error) {
    console.error("Supabase notifications update error:", error);
    return {
      ok: false,
      error: { code: "INTERNAL_ERROR", message: "通知を既読にできませんでした" },
    };
  }

  return { ok: true, data: undefined };
}

