import { ClassroomDetailContent } from "@/features/classroom/components/classroom-detail-content";

export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId: classCode } = await params;
  return <ClassroomDetailContent classCode={classCode} />;
}
