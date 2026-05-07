"use client";

import { useCallback, useEffect, useState } from "react";
import { teachingApi } from "@/features/teaching/api";
import {
  mapTeachingAssignmentList,
  mapTeachingAssignmentRecord,
  mapTeachingMetrics,
} from "@/features/teaching/teaching-adapter";
import type { TeachingAssignmentRecord, TeachingMetric } from "@/features/teaching/teaching-data";

type TeachingListState = {
  records: TeachingAssignmentRecord[];
  metrics: TeachingMetric[];
  isLoading: boolean;
  error: string;
  refresh: () => Promise<void>;
};

type TeachingListScope = "all" | "mine";

type TeachingDetailState = {
  assignment: TeachingAssignmentRecord | null;
  isLoading: boolean;
  error: string;
  refresh: () => Promise<void>;
};

export function useTeachingListData(scope: TeachingListScope = "all"): TeachingListState {
  const [records, setRecords] = useState<TeachingAssignmentRecord[]>([]);
  const [metrics, setMetrics] = useState<TeachingMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const [listResponse, metricResponse] = await Promise.all([
        scope === "mine" ? teachingApi.listMine() : teachingApi.list(),
        teachingApi.metrics(),
      ]);
      setRecords(mapTeachingAssignmentList(listResponse.data));
      setMetrics(mapTeachingMetrics(metricResponse.data));
    } catch (loadError) {
      setRecords([]);
      setMetrics([]);
      setError(loadError instanceof Error ? loadError.message : "Không thể tải dữ liệu phân công.");
    } finally {
      setIsLoading(false);
    }
  }, [scope]);

  useEffect(() => {
    void load();
  }, [load]);

  return { records, metrics, isLoading, error, refresh: load };
}

export function useTeachingDetailData(assignmentId: string): TeachingDetailState {
  const [assignment, setAssignment] = useState<TeachingAssignmentRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await teachingApi.detail(assignmentId);
      setAssignment(mapTeachingAssignmentRecord(response.data));
    } catch (loadError) {
      setAssignment(null);
      setError(loadError instanceof Error ? loadError.message : "Không thể tải chi tiết phân công.");
    } finally {
      setIsLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { assignment, isLoading, error, refresh: load };
}
