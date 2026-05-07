"use client";

import { ParentScoresContent } from "@/features/parent/components/parent-scores-content";
import { MyScoresContent } from "@/features/student/components/my-scores-content";
import { useAuthSession } from "@/hooks";

export default function MyScoresPage() {
  const { session } = useAuthSession();
  if (session?.user.role === "PARENT") return <ParentScoresContent />;
  return <MyScoresContent />;
}
