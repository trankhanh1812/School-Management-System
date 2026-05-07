"use client";

/**
 * Persists the selected child's studentCode in sessionStorage so the
 * parent doesn't have to re-select on every page navigation within the
 * same browser session.
 */

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "parent_selected_child";

export function useSelectedChild() {
  const [selectedCode, setSelectedCodeState] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return window.sessionStorage.getItem(STORAGE_KEY) ?? "";
  });

  const setSelectedCode = useCallback((code: string) => {
    setSelectedCodeState(code);
    if (typeof window !== "undefined") {
      if (code) {
        window.sessionStorage.setItem(STORAGE_KEY, code);
      } else {
        window.sessionStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  return { selectedCode, setSelectedCode };
}
