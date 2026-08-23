import { createClient } from "@/lib/supabase/server";
import { normalizeExhibitCategory } from "../categories";
import type { ExhibitItem } from "../types";

type GetExhibitsOptions = {
  isFirstFloor?: boolean;
  userId?: string;
};

const FIRST_FLOOR_EXHIBIT_IDS = [
  "abccab1c-030a-46ca-a77e-403558a7b4e3",
  "96d0cc6b-ef33-4d69-b5f0-8e5371ab3c29",
  "01b2a5ce-d7f5-48a5-83be-c02acbe44673",
  "f5336f5e-34f3-4dad-b26a-516a70e92e1f",
  "5fbf3448-5776-4765-8676-8a7a7ca7531f",
  "052dd450-347a-4166-8b4c-da075e9a796d",
  "5a802a54-d1eb-490d-a167-53714978ffeb",
  "3bf75231-81b2-4701-a1f5-2a28ec4918b5",
] as const;

export async function getExhibits(options: GetExhibitsOptions = {}): Promise<ExhibitItem[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let itemsQuery = supabase
    .from("items")
    .select(`
      id,
      title,
      description,
      category,
      image_url,
      year,
      created_at,
      users (
        user_name
      )
    `);

  if (options.isFirstFloor) {
    itemsQuery = itemsQuery.in("id", FIRST_FLOOR_EXHIBIT_IDS);
  }

  if (options.userId) {
    itemsQuery = itemsQuery.eq("user_id", options.userId);
  }

  const { data: items, error: itemsError } = await itemsQuery.order("created_at", { ascending: true });

  if (itemsError) {
    console.error("Error fetching exhibits:", itemsError);
    throw new Error("展示データの取得に失敗しました。時間をおいて再試行してください。");
  }

  const { data: reactions, error: reactionsError } = await supabase
    .from("shinmiri_reactions")
    .select("item_id, user_id");

  if (reactionsError) {
    console.error("Error fetching reactions:", reactionsError);
  }

  const reactionCounts: Record<string, number> = {};
  const userReactionSet = new Set<string>();

  if (reactions) {
    for (const r of reactions) {
      reactionCounts[r.item_id] = (reactionCounts[r.item_id] || 0) + 1;
      if (user && r.user_id === user.id) {
        userReactionSet.add(r.item_id);
      }
    }
  }

  return items.map((item, index) => {
    const num = String(index + 1).padStart(2, "0");
    const shinmiriCount = reactionCounts[item.id] || 0;
    const isShinmiri = userReactionSet.has(item.id);
    const category = normalizeExhibitCategory(item.category);
    const user = Array.isArray(item.users) ? item.users[0] : item.users;
    const userName = user?.user_name ?? undefined;

    const yearStr = item.year ? String(item.year) : "";
    const subtitle = item.year ? `${item.year}年の出来事` : "あのころの出来事";

    return {
      id: item.id,
      number: num,
      title: item.title,
      subtitle,
      category,
      year: yearStr,
      description: item.description,
      imageUrl: item.image_url,
      shinmiriCount,
      isShinmiri,
      userName,
      createdAt: item.created_at,
    };
  });
}

export function getFirstFloorExhibits(): Promise<ExhibitItem[]> {
  return getExhibits({ isFirstFloor: true });
}
