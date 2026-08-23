import type { ReactNode } from "react";

import { SiteHeader } from "@/components/layout/site-header";

type AuthLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="auth-page">
      <SiteHeader mode="brand-only" />
      <main className="auth-viewport">{children}</main>
    </div>
  );
}
