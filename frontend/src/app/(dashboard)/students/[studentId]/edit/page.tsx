import { StudentEditContent } from "@/features/student/components/student-edit-content";

export default async function EditStudentPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId: studentCode } = await params;
  return <StudentEditContent studentCode={studentCode} />;
}
