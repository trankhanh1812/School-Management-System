"use client";

import { ParentTranscriptContent } from "@/features/parent/components/parent-transcript-content";
import { MyTranscriptContent } from "@/features/student/components/my-transcript-content";
import { useAuthSession } from "@/hooks";

export default function MyTranscriptPage() {
  const { session } = useAuthSession();
  if (session?.user.role === "PARENT") return <ParentTranscriptContent />;
  return <MyTranscriptContent />;
}
