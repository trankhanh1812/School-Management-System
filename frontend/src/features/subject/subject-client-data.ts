"use client";

import { useCallback, useEffect, useState } from "react";
import { subjectApi } from "@/features/subject/api";
import { mapSubjectList, mapSubjectMetrics, mapSubjectRecord } from "@/features/subject/subject-adapter";
import type { SubjectMetric, SubjectRecord } from "@/features/subject/subject-data";

type SubjectListState = {
  records: SubjectRecord[];
  metrics: SubjectMetric[];
  isLoading: boolean;
  error: string;
  refresh: () => Promise<void>;
};

type SubjectDetailState = {
  subject: SubjectRecord | null;
  isLoading: boolean;
  error: string;
  refresh: () => Promise<void>;
};

export function useSubjectListData(): SubjectListState {
  const [records, setRecords] = useState<SubjectRecord[]>([]);
  const [metrics, setMetrics] = useState<SubjectMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const [listResponse, metricResponse] = await Promise.all([subjectApi.list(), subjectApi.metrics()]);
      setRecords(mapSubjectList(listResponse.data));
      setMetrics(mapSubjectMetrics(metricResponse.data));
    } catch (loadError) {
      setRecords([]);
      setMetrics([]);
      setError(loadError instanceof Error ? loadError.message : "Không thể tải dữ liệu môn học.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { records, metrics, isLoading, error, refresh: load };
}

export function useSubjectDetailData(subjectCode: string): SubjectDetailState {
  const [subject, setSubject] = useState<SubjectRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await subjectApi.detail(subjectCode);
      setSubject(mapSubjectRecord(response.data));
    } catch (loadError) {
      setSubject(null);
      setError(loadError instanceof Error ? loadError.message : "Không thể tải chi tiết môn học.");
    } finally {
      setIsLoading(false);
    }
  }, [subjectCode]);

  useEffect(() => {
    void load();
  }, [load]);

  return { subject, isLoading, error, refresh: load };
}
