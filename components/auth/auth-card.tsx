import type { ReactNode } from "react";

import { ActionLink } from "@/components/ui/action-link";

type AuthCardProps = {
  eyebrow: string;
  title: string;
  lead: string;
  asideTitle: string;
  asideCopy: string;
  chips: string[];
  footerLabel: string;
  footerHref: string;
  footerLinkLabel: string;
  children: ReactNode;
};

export function AuthCard({
  eyebrow,
  title,
  lead,
  asideTitle,
  asideCopy,
  chips,
  footerLabel,
  footerHref,
  footerLinkLabel,
  children,
}: AuthCardProps) {
  return (
    <div className="auth-shell">
      <aside className="auth-intro">
        <p className="eyebrow">{eyebrow}</p>
        <h2>{asideTitle}</h2>
        <p>{asideCopy}</p>
        <div className="auth-chips" aria-hidden="true">
          {chips.map((chip) => (
            <span className="auth-chip" key={chip}>
              {chip}
            </span>
          ))}
        </div>
      </aside>

      <section className="auth-panel" aria-label={title}>
        <div className="auth-card">
          <span className="auth-badge">{eyebrow}</span>
          <h1>{title}</h1>
          <p className="auth-lead">{lead}</p>
          {children}
          <p className="auth-note">
            {footerLabel} <ActionLink href={footerHref}>{footerLinkLabel}</ActionLink>
          </p>
        </div>
      </section>
    </div>
  );
}
