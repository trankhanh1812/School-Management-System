import { StudentDetailContent } from "@/features/student/components/student-detail-content";

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId: studentCode } = await params;
  return <StudentDetailContent studentCode={studentCode} />;
}
