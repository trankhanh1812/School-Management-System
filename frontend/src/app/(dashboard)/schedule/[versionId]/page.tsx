import { TeachingCreateGridContent } from "@/features/teaching/components/teaching-create-grid-content";

type TimetableVersionSchedulePageProps = {
  params: Promise<{
    versionId: string;
  }>;
};

export default async function TimetableVersionSchedulePage({ params }: TimetableVersionSchedulePageProps) {
  const resolved = await params;
  return <TeachingCreateGridContent mode="view" initialVersionId={resolved.versionId} />;
}