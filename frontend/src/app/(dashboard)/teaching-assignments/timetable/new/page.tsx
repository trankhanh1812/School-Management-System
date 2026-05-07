import { redirect } from "next/navigation";

type NewTimetablePageProps = {
  searchParams?: {
    sourceVersionId?: string | string[];
    versionId?: string | string[];
    academicYear?: string | string[];
    semester?: string | string[];
  };
};

export default function NewTimetablePage({ searchParams }: NewTimetablePageProps) {
  const sourceVersionId = Array.isArray(searchParams?.sourceVersionId)
    ? searchParams?.sourceVersionId[0]
    : searchParams?.sourceVersionId ?? (Array.isArray(searchParams?.versionId) ? searchParams?.versionId[0] : searchParams?.versionId);
  const query = new URLSearchParams();

  if (sourceVersionId) {
    query.set("sourceVersionId", sourceVersionId);
  }

  const academicYear = Array.isArray(searchParams?.academicYear) ? searchParams?.academicYear[0] : searchParams?.academicYear;
  const semester = Array.isArray(searchParams?.semester) ? searchParams?.semester[0] : searchParams?.semester;

  if (academicYear) {
    query.set("academicYear", academicYear);
  }

  if (semester) {
    query.set("semester", semester);
  }

  redirect(`/schedule/new${query.toString() ? `?${query.toString()}` : ""}`);
}
