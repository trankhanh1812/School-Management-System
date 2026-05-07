import { TeacherEditContent } from "@/features/teacher/components/teacher-edit-content";

export default async function EditTeacherPage({
  params,
}: {
  params: Promise<{ teacherId: string }>;
}) {
  const { teacherId: teacherCode } = await params;
  return <TeacherEditContent teacherCode={teacherCode} />;
}
