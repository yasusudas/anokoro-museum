import { createClient } from "@/lib/supabase/server";
import type { ExhibitItem } from "../types";

/**
 * 展示タイトルやカテゴリに応じたフォールバックテーマを決定する
 */
function resolveTheme(title: string, category: string): string {
  if (title.includes("ひもQ") || title.includes("グミ")) return "gummy";
  if (title.includes("妖怪") || title.includes("ウォッチ")) return "watch";
  if (title.includes("タピオカ")) return "tapioca";
  if (title.includes("ゾロリ") || category === "ほん") return "book";
  if (title.includes("ソーラン") || category === "できごと") return "soran";
  if (category === "ゲーム") return "watch";
  if (category === "おかし" || category === "たべもの") return "gummy";
  return "book";
}

/**
 * データベースから展示一覧としんみりリアクション数を取得する
 */
export async function getExhibits(): Promise<ExhibitItem[]> {
  const supabase = await createClient();

  // 1. 展示アイテム一覧を取得
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

  // 2. 各アイテムのしんみりリアクション数を取得
  const { data: reactions, error: reactionsError } = await supabase
    .from("shinmiri_reactions")
    .select("item_id");

  if (reactionsError) {
    console.error("Error fetching reactions:", reactionsError);
  }

  // item_idごとのリアクション件数を集計
  const reactionCounts: Record<string, number> = {};
  if (reactions) {
    for (const r of reactions) {
      reactionCounts[r.item_id] = (reactionCounts[r.item_id] || 0) + 1;
    }
  }

  // 3. ドメインモデル (ExhibitItem) に整形
  return items.map((item, index) => {
    const num = String(index + 1).padStart(2, "0");
    const shinmiriCount = reactionCounts[item.id] || 0;
    const theme = resolveTheme(item.title, item.category);
    // users テーブルの型
    const user = Array.isArray(item.users) ? item.users[0] : item.users;
    const userName = user?.user_name ?? undefined;

    return {
      id: item.id,
      number: num,
      title: item.title,
      subtitle: `${item.year}年の思い出`,
      category: item.category,
      year: String(item.year),
      description: item.description,
      imageUrl: item.image_url,
      theme,
      shinmiriCount,
      userName,
      createdAt: item.created_at,
    };
  });
}
