import { ConductEditContent } from "@/features/conduct/components/conduct-edit-content";

export default async function ConductEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ConductEditContent id={id} />;
}
