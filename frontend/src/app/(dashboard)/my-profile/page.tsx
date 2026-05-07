"use client";

import { ParentProfileContent } from "@/features/parent/components/parent-profile-content";
import { MyProfileContent } from "@/features/student/components/my-profile-content";
import { useAuthSession } from "@/hooks";

export default function MyProfilePage() {
  const { session } = useAuthSession();
  if (session?.user.role === "PARENT") return <ParentProfileContent />;
  return <MyProfileContent />;
}
