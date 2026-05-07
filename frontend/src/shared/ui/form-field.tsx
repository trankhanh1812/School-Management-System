import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

type BaseFieldProps = {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  id?: string;
};

function FieldWrapper({
  label,
  hint,
  error,
  id,
  className,
  children,
}: BaseFieldProps & { children: ReactNode }) {
  return (
    <label className={`grid gap-2 text-sm text-slate-700 ${className ?? ""}`.trim()} htmlFor={id}>
      <span className="font-medium">{label}</span>
      {children}
      {error ? <span className="text-xs text-rose-600">{error}</span> : null}
      {!error && hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
    </label>
  );
}

function getControlClassName(hasError?: boolean) {
  return `h-11 rounded-xl border bg-white/90 px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
    hasError
      ? "border-rose-300 focus:border-rose-500 focus:ring-rose-100"
      : "border-slate-300 focus:border-sky-500 focus:ring-sky-100"
  }`;
}

type FormInputProps = BaseFieldProps & InputHTMLAttributes<HTMLInputElement>;
export function FormInput({ label, hint, error, className, id, ...props }: FormInputProps) {
  return (
    <FieldWrapper label={label} hint={hint} error={error} id={id} className={className}>
      <input id={id} aria-invalid={error ? "true" : "false"} className={getControlClassName(Boolean(error))} {...props} />
    </FieldWrapper>
  );
}

type FormSelectProps = BaseFieldProps & SelectHTMLAttributes<HTMLSelectElement>;
export function FormSelect({ label, hint, error, className, id, children, ...props }: FormSelectProps) {
  return (
    <FieldWrapper label={label} hint={hint} error={error} id={id} className={className}>
      <select id={id} aria-invalid={error ? "true" : "false"} className={getControlClassName(Boolean(error))} {...props}>
        {children}
      </select>
    </FieldWrapper>
  );
}

type FormTextareaProps = BaseFieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>;
export function FormTextarea({ label, hint, error, className, id, ...props }: FormTextareaProps) {
  return (
    <FieldWrapper label={label} hint={hint} error={error} id={id} className={className}>
      <textarea
        id={id}
        aria-invalid={error ? "true" : "false"}
        className={`min-h-24 rounded-xl border bg-white/90 px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
          error
            ? "border-rose-300 focus:border-rose-500 focus:ring-rose-100"
            : "border-slate-300 focus:border-sky-500 focus:ring-sky-100"
        }`}
        {...props}
      />
    </FieldWrapper>
  );
}

type FormCheckboxProps = {
  label: string;
  hint?: string;
  className?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
};

export function FormCheckbox({ label, hint, className, checked, onChange, disabled }: FormCheckboxProps) {
  return (
    <label className={`flex items-center gap-3 rounded-xl border border-slate-300 bg-white/85 px-3 py-3 text-sm text-slate-700 ${className ?? ""}`.trim()}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>
        <span className="font-medium">{label}</span>
        {hint ? <span className="ml-2 text-xs text-slate-500">{hint}</span> : null}
      </span>
    </label>
  );
}
