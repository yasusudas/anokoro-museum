export type CommentView = {
  id: string;
  itemId: string;
  authorName: string;
  content: string;
  createdAt: string;
  likeCount: number;
  isLikedByCurrentUser: boolean;
  canDelete: boolean;
};
