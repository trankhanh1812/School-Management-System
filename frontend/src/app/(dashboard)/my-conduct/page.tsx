"use client";

import { ParentConductContent } from "@/features/parent/components/parent-conduct-content";
import { MyConductContent } from "@/features/student/components/my-conduct-content";
import { useAuthSession } from "@/hooks";

export default function MyConductPage() {
  const { session } = useAuthSession();
  if (session?.user.role === "PARENT") return <ParentConductContent />;
  return <MyConductContent />;
}
