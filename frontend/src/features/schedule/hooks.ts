"use client";

import { useState } from "react";
import type { ScheduleFilters } from "@/features/schedule/types";

export function useScheduleFilters(initialFilters: ScheduleFilters = {}) {
  const [filters, setFilters] = useState<ScheduleFilters>(initialFilters);

  return {
    filters,
    setFilters,
  };
}
