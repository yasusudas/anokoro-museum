import type { SupabaseClient } from "@supabase/supabase-js";

export async function checkDuplicateExhibitTitle(
  supabase: SupabaseClient,
  title: string
): Promise<{ isDuplicate: boolean }> {
  const trimmedTitle = title.trim();
  if (!trimmedTitle) {
    return { isDuplicate: false };
  }

  const { data, error } = await supabase
    .from("items")
    .select("id")
    .eq("title", trimmedTitle)
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return { isDuplicate: false };
  }

  return { isDuplicate: true };
}
