"use client";

import { useState } from "react";

export function useAttendanceFilters() {
  const [selectedDate, setSelectedDate] = useState("");

  return {
    selectedDate,
    setSelectedDate,
  };
}
