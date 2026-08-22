"use server";

import { createClient } from "@/lib/supabase/server";

export async function checkExhibitTitleAction(
  title: string
): Promise<{ isDuplicate: boolean }> {
  const trimmedTitle = title.trim();
  if (!trimmedTitle) {
    return { isDuplicate: false };
  }

  const supabase = await createClient();
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
