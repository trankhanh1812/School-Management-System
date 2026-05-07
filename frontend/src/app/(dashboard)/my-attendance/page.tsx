"use client";

import { ParentAttendanceContent } from "@/features/parent/components/parent-attendance-content";
import { MyAttendanceContent } from "@/features/student/components/my-attendance-content";
import { useAuthSession } from "@/hooks";

export default function MyAttendancePage() {
  const { session } = useAuthSession();
  if (session?.user.role === "PARENT") return <ParentAttendanceContent />;
  return <MyAttendanceContent />;
}
