"use server";

import { createClient } from "@/lib/supabase/server";
import { checkDuplicateExhibitTitle } from "../queries/check-duplicate-title";

export async function checkExhibitTitleAction(
  title: string
): Promise<{ isDuplicate: boolean }> {
  const supabase = await createClient();
  return checkDuplicateExhibitTitle(supabase, title);
}
