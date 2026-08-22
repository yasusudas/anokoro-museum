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

function getOAuthCallbackErrorRedirect(url: URL, next: string) {
  const errorUrl = new URL("/sign-in", url.origin);
  errorUrl.searchParams.set("error", "oauth_callback");
  errorUrl.searchParams.set("next", next);

  return NextResponse.redirect(errorUrl);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = getSafeNextPath(url.searchParams.get("next"));

  if (!code) {
    return getOAuthCallbackErrorRedirect(url, next);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("Supabase OAuth callback error:", error);
    return getOAuthCallbackErrorRedirect(url, next);
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
