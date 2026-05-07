"use client";

import { useState } from "react";
import { useAuthSession } from "@/hooks";
import { studentApi } from "@/features/student/api";
import { PageIntro } from "@/features/dashboard/components/page-intro";
import { Panel } from "@/shared/ui/panel";
import { ButtonLink } from "@/shared/ui/button";

export default function TestCreateStudentPage() {
  const { session } = useAuthSession();
  const [formData, setFormData] = useState({
    studentCode: "HS10231",
    fullName: "ngân",
    dateOfBirth: "",
    gender: "Nam",
    phone: "",
    email: "",
    address: "",
    academicYear: "2026-2027",
    className: "10A1",
    status: "ACTIVE",
    conduct: "Tốt",
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success?: string; error?: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await studentApi.create(formData);
      setResult({ success: `✅ Tạo học sinh thành công: ${response.data.fullName}` });
      setFormData({
        studentCode: "",
        fullName: "",
        dateOfBirth: "",
        gender: "Nam",
        phone: "",
        email: "",
        address: "",
        academicYear: "2026-2027",
        className: "",
        status: "ACTIVE",
        conduct: "Tốt",
      });
    } catch (error) {
      setResult({
        error:
          error instanceof Error
            ? error.message
            : "Không thể tạo học sinh. Kiểm tra console để xem chi tiết.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!session) return <div>Đang tải...</div>;
  if (session.user.role !== "ADMIN") {
    return (
      <Panel className="p-6">
        <p className="text-red-600 font-semibold">⛔ Chỉ ADMIN mới tạo được học sinh!</p>
        <p className="mt-2 text-sm text-slate-600">
          Hiện tại bạn login với role: <strong>{session.user.role}</strong>
        </p>
      </Panel>
    );
  }

  return (
    <div className="grid gap-4 max-w-2xl">
      <PageIntro
        eyebrow="Test"
        title="Tạo học sinh mới"
        description="Form test để tạo học sinh (chỉ dành cho ADMIN)"
      />

      <Panel className="p-6">
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Mã HS</label>
              <input
                type="text"
                name="studentCode"
                value={formData.studentCode}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Họ tên</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Giới tính</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option>Nam</option>
                <option>Nữ</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Ngày sinh</label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Điện thoại</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Lớp</label>
              <input
                type="text"
                name="className"
                value={formData.className}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Năm học</label>
              <input
                type="text"
                name="academicYear"
                value={formData.academicYear}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Địa chỉ</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Trạng thái</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option>ACTIVE</option>
                <option>INACTIVE</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Hạnh kiểm</label>
              <input
                type="text"
                name="conduct"
                value={formData.conduct}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
          </div>

          {result?.success && (
            <div className="rounded-lg bg-green-100 p-4 text-green-900">{result.success}</div>
          )}
          {result?.error && (
            <div className="rounded-lg bg-red-100 p-4 text-red-900">{result.error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Đang tạo..." : "Tạo học sinh"}
          </button>
        </form>
      </Panel>

      <Panel className="p-4 bg-blue-50 text-sm text-blue-900">
        <p className="font-semibold">📌 Lưu ý:</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>Mã HS phải unique (không được trùng)</li>
          <li>Bạn phải login với ADMIN account</li>
          <li>Lớp phải tồn tại trong hệ thống</li>
        </ul>
      </Panel>

      <ButtonLink href="/students">← Quay lại danh sách</ButtonLink>
    </div>
  );
}
