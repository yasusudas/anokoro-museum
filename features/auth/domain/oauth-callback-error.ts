export const OAUTH_CALLBACK_ERROR_CODE = "oauth_callback";

export type OAuthProviderErrorKind = "none" | "cancelled" | "failed";

export function getOAuthProviderErrorKind(value: string | null | undefined): OAuthProviderErrorKind {
  if (!value) return "none";
  if (value === "access_denied") return "cancelled";

  return "failed";
}
