"use client";

import { useState } from "react";

export function useSubjectFilters() {
  const [departmentId, setDepartmentId] = useState("all");

  return {
    departmentId,
    setDepartmentId,
  };
}
