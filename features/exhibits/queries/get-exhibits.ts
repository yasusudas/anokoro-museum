import { createClient } from "@/lib/supabase/server";
import { normalizeExhibitCategory } from "../categories";
import type { ExhibitItem } from "../types";

export async function getExhibits(): Promise<ExhibitItem[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: items, error: itemsError } = await supabase
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
    `)
    .order("created_at", { ascending: true });

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
