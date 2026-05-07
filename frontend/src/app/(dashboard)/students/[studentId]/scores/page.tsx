import { StudentScoresContent } from "@/features/student/components/student-scores-content";

export default async function StudentScoresPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId: studentCode } = await params;
  return <StudentScoresContent studentCode={studentCode} />;
}
