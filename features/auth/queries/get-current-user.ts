import { createClient } from "@/lib/supabase/server";
import type { AuthUser } from "../types";

export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("users")
    .select("user_name")
    .eq("id", user.id)
    .single();

  const userName =
    profile?.user_name ||
    (user.user_metadata?.user_name as string) ||
    (user.user_metadata?.display_name as string) ||
    "あのころの来場者";

  return {
    id: user.id,
    email: user.email ?? "",
    userName,
  };
}
