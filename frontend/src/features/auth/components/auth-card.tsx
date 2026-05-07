import type { ReactNode } from "react";

type AuthCardProps = {
  title: string;
  description: string;
  footer?: ReactNode;
  children: ReactNode;
};

export function AuthCard({
  title,
  description,
  footer,
  children,
}: AuthCardProps) {
  return (
    <div className="grid gap-6">
      <div className="space-y-3">
        <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
          {title}
        </h2>
        <p className="text-sm leading-6 text-slate-600">{description}</p>
      </div>

      {children}

      {footer ? (
        <div className="border-t border-slate-200 pt-5 text-sm text-slate-600">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
