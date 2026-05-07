import { redirect } from "next/navigation";

type TimetableVersionDetailPageProps = {
  params: Promise<{
    versionId: string;
  }>;
};

export default async function TimetableVersionDetailPage({ params }: TimetableVersionDetailPageProps) {
  const resolved = await params;
  redirect(`/schedule/${encodeURIComponent(resolved.versionId)}`);
}