"use client";

import { useState } from "react";

export function useNotificationFilters() {
  const [audience, setAudience] = useState("all");

  return {
    audience,
    setAudience,
  };
}
