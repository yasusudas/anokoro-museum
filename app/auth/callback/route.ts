import { NextResponse } from "next/server";
import { getSafeNextPath } from "@/features/auth/domain/next-path";
import {
  OAUTH_CALLBACK_ERROR_CODE,
  getOAuthProviderErrorKind,
} from "@/features/auth/domain/oauth-callback-error";
import { createClient } from "@/lib/supabase/server";

function getSignInRedirect(url: URL, next: string, withError: boolean) {
  const signInUrl = new URL("/sign-in", url.origin);
  if (withError) {
    signInUrl.searchParams.set("error", OAUTH_CALLBACK_ERROR_CODE);
  }
  signInUrl.searchParams.set("next", next);

  return NextResponse.redirect(signInUrl);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = getSafeNextPath(url.searchParams.get("next"), url.origin);
  const providerError = url.searchParams.get("error");
  const providerErrorKind = getOAuthProviderErrorKind(providerError);

  if (providerErrorKind !== "none") {
    if (providerErrorKind === "failed") {
      console.error("Google OAuth provider error:", {
        error: providerError,
        errorDescription: url.searchParams.get("error_description"),
      });
    }

    return getSignInRedirect(url, next, providerErrorKind === "failed");
  }

  const code = url.searchParams.get("code");

  if (!code) {
    return getSignInRedirect(url, next, true);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("Supabase OAuth callback error:", error);
    return getSignInRedirect(url, next, true);
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
