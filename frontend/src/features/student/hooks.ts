"use client";

import { useState } from "react";
import type { StudentFilters } from "@/features/student/types";
export { useStudentDetailData, useStudentListData } from "@/features/student/student-client-data";

export function useStudentFilters(initialFilters: StudentFilters = {}) {
  const [filters, setFilters] = useState<StudentFilters>(initialFilters);

  return {
    filters,
    setFilters,
  };
}
