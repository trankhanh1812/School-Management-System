import { TeachingNewContent } from "@/features/teaching/components/teaching-new-content";

type NewScheduleTimetablePageProps = {
  searchParams?: {
    sourceVersionId?: string | string[];
    versionId?: string | string[];
  };
};

export default function NewScheduleTimetablePage({ searchParams }: NewScheduleTimetablePageProps) {
  const sourceVersionId = Array.isArray(searchParams?.sourceVersionId)
    ? searchParams?.sourceVersionId[0]
    : searchParams?.sourceVersionId ?? (Array.isArray(searchParams?.versionId) ? searchParams?.versionId[0] : searchParams?.versionId);

  return <TeachingNewContent sourceVersionId={sourceVersionId} />;
}