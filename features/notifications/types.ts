export type NotificationType = "comment" | "shinmiri";

export type NotificationView = {
  id: string;
  type: NotificationType;
  actorName: string;
  itemTitle: string;
  createdAt: string;
  isRead: boolean;
};

