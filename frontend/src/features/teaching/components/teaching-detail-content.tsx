"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { TeachingAssignmentGrid } from "@/features/teaching/components/teaching-assignment-grid";
import { teachingApi } from "@/features/teaching/api";
import { useToast } from "@/shared/components/toast-provider";
import { PageIntro } from "@/features/dashboard/components/page-intro";
import { Panel } from "@/shared/ui/panel";
import { Button } from "@/shared/ui/button";

export function TeachingDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  
  const assignmentId = params?.id as string;
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!assignmentId) return;
      try {
        setLoading(true);
        const response = await teachingApi.detail(assignmentId);
        if (response.data) {
          setData(response.data);
        } else {
          setError("Không tìm thấy phân công");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Lỗi khi tải dữ liệu");
        showToast("Không thể tải phân công", "error");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [assignmentId, showToast]);

  if (loading) {
    return (
      <Panel className="p-4 text-sm text-slate-500">
        Đang tải chi tiết phân công...
      </Panel>
    );
  }

  if (error || !data) {
    return (
      <Panel className="border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
        {error || "Không tìm thấy dữ liệu"}
      </Panel>
    );
  }

  return (
    <div className="grid gap-4">
      <PageIntro
        eyebrow="Chi tiết phân công"
        title={`Phân công: ${data.teacherName} - ${data.subjectName}`}
        description={`Lớp ${data.className}, Học kỳ ${data.semesterCode}, Năm học ${data.academicYearCode}`}
        actions={
          <Button
            className="h-11 px-5"
            tone="secondary"
            onClick={() => router.back()}
          >
            Quay lại
          </Button>
        }
      />

      <TeachingAssignmentGrid
        assignmentId={assignmentId}
        teacherCode={data.teacherCode || ""}
        teacherName={data.teacherName || ""}
        classCode={data.classCode || ""}
        className={data.className || ""}
        subjectCode={data.subjectCode || ""}
        subjectName={data.subjectName || ""}
        semesterCode={data.semesterCode || ""}
        academicYearCode={data.academicYearCode || ""}
        scheduleData={data.scheduleData}
        onSaveSuccess={() => router.back()}
      />
    </div>
  );
}
