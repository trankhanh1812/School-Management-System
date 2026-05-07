"use client";

import { useState } from "react";

export function useScoreFilters() {
  const [semester, setSemester] = useState("all");

  return {
    semester,
    setSemester,
  };
}
