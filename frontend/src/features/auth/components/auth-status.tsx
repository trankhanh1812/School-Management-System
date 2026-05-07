type AuthStatusProps = {
  tone: "error" | "success" | "info";
  message: string;
};

const toneClasses: Record<AuthStatusProps["tone"], string> = {
  error: "border-rose-200 bg-rose-50 text-rose-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  info: "border-cyan-200 bg-cyan-50 text-cyan-700",
};

export function AuthStatus({ tone, message }: AuthStatusProps) {
  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${toneClasses[tone]}`}>
      {message}
    </div>
  );
}
