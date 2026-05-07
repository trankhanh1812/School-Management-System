import { ClassroomEditContent } from "@/features/classroom/components/classroom-edit-content";

export default async function EditClassroomPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId: classCode } = await params;
  return <ClassroomEditContent classCode={classCode} />;
}
