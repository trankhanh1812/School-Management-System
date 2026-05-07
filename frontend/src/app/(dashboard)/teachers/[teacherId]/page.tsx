import { TeacherDetailContent } from "@/features/teacher/components/teacher-detail-content";

export default async function TeacherDetailPage({
  params,
}: {
  params: Promise<{ teacherId: string }>;
}) {
  const { teacherId: teacherCode } = await params;
  return <TeacherDetailContent teacherCode={teacherCode} />;
}
