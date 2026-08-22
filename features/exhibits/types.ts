import type { ExhibitCategory } from "./categories";

export type ExhibitItem = {
  id: string;
  number: string;
  title: string;
  subtitle?: string;
  category: ExhibitCategory;
  year: string;
  description: string;
  imageUrl?: string | null;
  theme: string;
  shinmiriCount: number;
  isShinmiri?: boolean;
  userName?: string;
  createdAt: string;
};

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: {
        code: "UNAUTHENTICATED" | "FORBIDDEN" | "NOT_FOUND" | "VALIDATION_ERROR" | "CONFLICT" | "INTERNAL_ERROR";
        message: string;
        fieldErrors?: Record<string, string[]>;
      };
    };

export type CreateExhibitInput = {
  title: string;
  description: string;
  category: ExhibitCategory;
  year: number;
  imageUrl?: string | null;
};

export type CreateExhibitData = {
  id: string;
  title: string;
  imageUrl: string | null;
};

export type ToggleShinmiriData = {
  itemId: string;
  isShinmiri: boolean;
  shinmiriCount?: number;
};
