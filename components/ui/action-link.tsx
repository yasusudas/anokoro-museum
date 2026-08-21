import Link, { type LinkProps } from "next/link";
import type { ReactNode } from "react";

type ActionLinkProps = LinkProps & {
  children: ReactNode;
  className?: string;
};

export function ActionLink({ children, className, ...props }: ActionLinkProps) {
  const mergedClassName = className ? `action-link ${className}` : "action-link";

  return (
    <Link className={mergedClassName} {...props}>
      {children}
    </Link>
  );
}
