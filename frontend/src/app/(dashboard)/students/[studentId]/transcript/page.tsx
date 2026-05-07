import { StudentTranscriptContent } from "@/features/student/components/student-transcript-content";

export default async function StudentTranscriptPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId: studentCode } = await params;
  return <StudentTranscriptContent studentCode={studentCode} />;
}
