import type { ReactNode } from "react";
import { authHighlights } from "@/features/auth/auth-data";
import { Panel } from "@/shared/ui/panel";

type AuthShellProps = {
  title: string;
  description: string;
  eyebrow: string;
  children: ReactNode;
};

export function AuthShell({
  title,
  description,
  children,
}: AuthShellProps) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid w-full max-w-6xl gap-5 lg:grid-cols-[minmax(320px,0.9fr)_minmax(420px,1fr)] xl:gap-6">
        <section className="flex min-h-0 flex-col justify-center rounded-[2rem] border border-sky-200/80 bg-[linear-gradient(180deg,#fbfeff_0%,#edf8ff_100%)] px-6 py-6 text-slate-900 shadow-[0_26px_90px_rgba(14,165,233,0.10)] sm:px-8">
          <div className="space-y-6">
            <div className="space-y-3">
              <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-[3.2rem] sm:leading-[1.02]">
                {title}
              </h1>
              <p className="max-w-xl text-base leading-7 text-slate-600">
                {description}
              </p>
            </div>

            <div className="rounded-[1.6rem] border border-sky-100 bg-white/88 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
                Giới thiệu hệ thống
              </p>
              <div className="mt-4 grid gap-4">
                {authHighlights.map((item) => (
                  <div key={item.title}>
                    <p className="text-base font-semibold text-slate-950">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <Panel className="flex items-center rounded-[2rem] border border-white/80 bg-white/92 p-3 shadow-[0_20px_70px_rgba(14,165,233,0.10)] sm:p-5 xl:p-6">
          <div className="w-full rounded-[1.6rem] bg-white p-6 sm:p-8">{children}</div>
        </Panel>
      </div>
    </div>
  );
}
