"use client";

import { ParentScheduleContent } from "@/features/parent/components/parent-schedule-content";
import { MyScheduleContent } from "@/features/student/components/my-schedule-content";
import { useAuthSession } from "@/hooks";

export default function MySchedulePage() {
  const { session } = useAuthSession();
  if (session?.user.role === "PARENT") return <ParentScheduleContent />;
  return <MyScheduleContent />;
}
