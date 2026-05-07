"use client";

import { ParentExamsContent } from "@/features/parent/components/parent-exams-content";
import { MyExamsContent } from "@/features/student/components/my-exams-content";
import { useAuthSession } from "@/hooks";

export default function MyExamsPage() {
  const { session } = useAuthSession();
  if (session?.user.role === "PARENT") return <ParentExamsContent />;
  return <MyExamsContent />;
}
