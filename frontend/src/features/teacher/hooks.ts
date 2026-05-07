"use client";

import { useState } from "react";
import type { TeacherFilters } from "@/features/teacher/types";

export function useTeacherFilters(initialFilters: TeacherFilters = {}) {
  const [filters, setFilters] = useState<TeacherFilters>(initialFilters);

  return {
    filters,
    setFilters,
  };
}
