"use client";

import { useCallback, useEffect, useState } from "react";
import { conductApi, type ConductRecord } from "@/features/conduct/api";

type ConductListState = {
  records: ConductRecord[];
  isLoading: boolean;
  error: string;
  refresh: () => Promise<void>;
};

type ConductDetailState = {
  conduct: ConductRecord | null;
  isLoading: boolean;
  error: string;
  refresh: () => Promise<void>;
};

export function useConductListData(): ConductListState {
  const [records, setRecords] = useState<ConductRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await conductApi.list();
      setRecords(Array.isArray(response.data) ? response.data : []);
    } catch (loadError) {
      setRecords([]);
      setError(loadError instanceof Error ? loadError.message : "Không thể tải dữ liệu hạnh kiểm.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { records, isLoading, error, refresh: load };
}

export function useConductDetailData(id: string): ConductDetailState {
  const [conduct, setConduct] = useState<ConductRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await conductApi.detail(id);
      setConduct(response.data);
    } catch (loadError) {
      setConduct(null);
      setError(loadError instanceof Error ? loadError.message : "Không thể tải chi tiết hạnh kiểm.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  return { conduct, isLoading, error, refresh: load };
}
