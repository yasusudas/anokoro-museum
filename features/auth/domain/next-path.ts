export function getSafeNextPath(value: string | null | undefined, origin: string): string {
  if (!value) return "/";

  try {
    const baseOrigin = new URL(origin).origin;
    const nextUrl = new URL(value, baseOrigin);
    if (nextUrl.origin !== baseOrigin) return "/";

    return `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
  } catch {
    return "/";
  }
}
