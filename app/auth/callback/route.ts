import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function getSafeNextPath(value: string | null) {
  if (!value) return "/";

  try {
    const nextUrl = new URL(value, "http://localhost");
    if (nextUrl.origin !== "http://localhost") return "/";

    return `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
  } catch {
    return "/";
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/sign-in?error=oauth_callback", url.origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("Supabase OAuth callback error:", error);
    return NextResponse.redirect(new URL("/sign-in?error=oauth_callback", url.origin));
  }

  const next = getSafeNextPath(url.searchParams.get("next"));
  return NextResponse.redirect(new URL(next, url.origin));
}
