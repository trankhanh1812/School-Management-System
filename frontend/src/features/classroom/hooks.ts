"use client";

import { useState } from "react";
import type { ClassroomFilters } from "@/features/classroom/types";

export function useClassroomFilters(initialFilters: ClassroomFilters = {}) {
  const [filters, setFilters] = useState<ClassroomFilters>(initialFilters);

  return {
    filters,
    setFilters,
  };
}
