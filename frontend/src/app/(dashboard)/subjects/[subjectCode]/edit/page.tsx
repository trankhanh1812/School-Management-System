import { SubjectEditContent } from "@/features/subject/components/subject-edit-content";

export default async function EditSubjectPage({
  params,
}: {
  params: Promise<{ subjectCode: string }>;
}) {
  const { subjectCode } = await params;
  return <SubjectEditContent subjectCode={subjectCode} />;
}
