import { TeachingEditContent } from "@/features/teaching/components/teaching-edit-content";

export default async function EditTeachingAssignmentPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const { assignmentId } = await params;
  return <TeachingEditContent assignmentId={assignmentId} />;
}
