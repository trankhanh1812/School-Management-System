import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";

type ButtonTone = "primary" | "secondary" | "ghost";

const toneClasses: Record<ButtonTone, string> = {
  primary:
    "bg-[linear-gradient(135deg,#0284c7_0%,#0ea5e9_100%)] text-white shadow-[0_12px_30px_rgba(14,165,233,0.32)] hover:brightness-105 hover:text-white",
  secondary:
    "border border-sky-200/80 bg-white/90 text-slate-800 shadow-[0_4px_14px_rgba(15,23,42,0.08)] hover:border-sky-300 hover:bg-sky-50 hover:text-sky-900",
  ghost: "text-slate-700 hover:bg-sky-100/70 hover:text-sky-900",
};

type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  tone?: ButtonTone;
  className?: string;
} & AnchorHTMLAttributes<HTMLAnchorElement>;

type ButtonProps = {
  children: ReactNode;
  tone?: ButtonTone;
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

function getClassName(tone: ButtonTone, className?: string) {
  return `inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold tracking-[0.01em] transition duration-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none ${toneClasses[tone]} ${className ?? ""}`.trim();
}

export function ButtonLink({
  href,
  children,
  tone = "primary",
  className,
  ...props
}: ButtonLinkProps) {
  return (
    <Link href={href} className={getClassName(tone, className)} {...props}>
      {children}
    </Link>
  );
}

export function Button({
  children,
  tone = "primary",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button type={type} className={getClassName(tone, className)} {...props}>
      {children}
    </button>
  );
}
