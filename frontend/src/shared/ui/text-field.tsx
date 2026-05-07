import type { InputHTMLAttributes } from "react";

type TextFieldProps = {
  label: string;
  hint?: string;
  error?: string;
} & InputHTMLAttributes<HTMLInputElement>;

export function TextField({ label, hint, error, id, ...props }: TextFieldProps) {
  return (
    <label className="grid gap-2 text-sm text-slate-700" htmlFor={id}>
      <span className="font-medium">{label}</span>
      <input
        id={id}
        aria-invalid={error ? "true" : "false"}
        className={`h-12 rounded-2xl border bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
          error
            ? "border-rose-300 focus:border-rose-500 focus:ring-rose-100"
            : "border-slate-200 focus:border-cyan-500 focus:ring-cyan-100"
        }`}
        {...props}
      />
      {error ? <span className="text-xs text-rose-600">{error}</span> : null}
      {!error && hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
    </label>
  );
}
