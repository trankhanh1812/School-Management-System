import Link from "next/link";
import { appModules, authLinks } from "@/shared/config/navigation";
import { ButtonLink } from "@/shared/ui/button";
import { Panel } from "@/shared/ui/panel";

const architectureLayers = [
  "Frontend Next.js theo App Router và feature-based structure",
  "Hệ thống nghiệp vụ tách module auth, user, student, class, score, report",
  "Database quản lý năm học, lớp học, transcript, teaching assignment và audit log",
];

const priorityFeatures = [
  "RBAC và lifecycle tài khoản cho Admin, Giáo viên, Học sinh, Phụ huynh",
  "Quản lý năm học, học kỳ, lên lớp, lưu ban và chuyển lớp giữa năm",
  "Học bạ điện tử, điểm chính thức, điểm khảo sát và báo cáo tổng hợp",
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-[min(98vw,2400px)] flex-col gap-8 px-4 py-6 sm:px-5 lg:px-6 2xl:w-[min(98.5vw,2700px)]">
      <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <Panel className="overflow-hidden bg-slate-950 text-white">
          <div className="grid gap-10 px-6 py-8 sm:px-8 sm:py-10">
            <div className="flex flex-wrap items-center gap-3 text-sm text-white/70">
              <span className="rounded-full border border-white/15 px-3 py-1.5">
                Source base SMS
              </span>
              {authLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-full px-3 py-1.5 transition hover:bg-white/8"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="space-y-5">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-300">
                Student Management System
              </p>
              <h1 className="max-w-5xl text-5xl font-semibold tracking-tight sm:text-6xl 2xl:text-7xl">
                Hệ thống quản lý học sinh đã sẵn sàng để vận hành và mở rộng.
              </h1>
              <p className="max-w-4xl text-lg leading-8 text-slate-300 2xl:text-xl">
                Kiến trúc được tổ chức theo domain-driven UI: tách route, feature,
                shared UI và cấu hình để tối ưu vận hành, bảo trì và phát triển
                liên tục với JWT và RBAC.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <ButtonLink href="/login">Bắt đầu với auth</ButtonLink>
              <ButtonLink href="/register" tone="secondary">
                Xem luồng tạo tài khoản
              </ButtonLink>
            </div>
          </div>
        </Panel>

        <Panel className="p-6 sm:p-8">
          <div className="grid gap-6">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700">
                Kiến trúc ưu tiên
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                Những điểm khó của bài toán đã được xử lý trong kiến trúc hiện tại
              </h2>
            </div>

            <div className="grid gap-4">
              {architectureLayers.map((item) => (
                <div
                  key={item}
                  className="rounded-[1.4rem] border border-slate-200 bg-slate-50/90 p-4 text-sm leading-6 text-slate-700"
                >
                  {item}
                </div>
              ))}
            </div>

            <div className="rounded-[1.5rem] border border-cyan-100 bg-cyan-50/80 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-700">
                Làm trước
              </p>
              <div className="mt-4 grid gap-3">
                {priorityFeatures.map((item) => (
                  <div key={item} className="flex items-start gap-3 text-sm text-slate-700">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-cyan-500" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Panel>
      </section>

      <section className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-4">
        {appModules.map((module) => (
          <Panel key={module.title} className="p-6 sm:p-7">
            <div className="grid gap-5">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Module
                </p>
                <h3 className="text-2xl font-semibold tracking-tight text-slate-950">
                  {module.title}
                </h3>
                <p className="text-sm leading-7 text-slate-600">
                  {module.description}
                </p>
              </div>
              <div>
                <ButtonLink href={module.href} tone="secondary">
                  Mở màn hình liên quan
                </ButtonLink>
              </div>
            </div>
          </Panel>
        ))}
      </section>
    </main>
  );
}
