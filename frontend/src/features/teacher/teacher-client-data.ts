"use client";

import { useCallback, useEffect, useState } from "react";
import { teacherApi } from "@/features/teacher/api";
import {
  mapDepartmentList,
  mapTeacherList,
  mapTeacherMetrics,
  mapTeacherRecord,
  type TeacherMetricRecord,
} from "@/features/teacher/teacher-adapter";
import type { DepartmentRecord, TeacherRecord } from "@/features/teacher/teacher-data";

export type TeacherListFilters = {
  departmentQuery?: string;
  search?: string;
  limit?: number;
};

type TeacherListState = {
  records: TeacherRecord[];
  departments: DepartmentRecord[];
  metrics: TeacherMetricRecord[];
  isLoading: boolean;
  error: string;
  refresh: () => Promise<void>;
};

type TeacherDetailState = {
  teacher: TeacherRecord | null;
  isLoading: boolean;
  error: string;
  refresh: () => Promise<void>;
};

export function useTeacherListData(filters?: TeacherListFilters): TeacherListState {
  const [records, setRecords] = useState<TeacherRecord[]>([]);
  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);
  const [metrics, setMetrics] = useState<TeacherMetricRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const [listResponse, departmentsResponse, metricsResponse] = await Promise.all([
        teacherApi.list(filters),
        teacherApi.departments(),
        teacherApi.metrics(),
      ]);

      setRecords(mapTeacherList(listResponse.data));
      setDepartments(mapDepartmentList(departmentsResponse.data));
      setMetrics(mapTeacherMetrics(metricsResponse.data));
    } catch (loadError) {
      setRecords([]);
      setDepartments([]);
      setMetrics([]);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Không thể tải dữ liệu giáo viên từ hệ thống.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    records,
    departments,
    metrics,
    isLoading,
    error,
    refresh: load,
  };
}

export function useTeacherDetailData(teacherCode: string): TeacherDetailState {
  const [teacher, setTeacher] = useState<TeacherRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await teacherApi.detail(teacherCode);
      setTeacher(mapTeacherRecord(response.data));
    } catch (loadError) {
      setTeacher(null);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Không thể tải hồ sơ giáo viên từ hệ thống.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [teacherCode]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    teacher,
    isLoading,
    error,
    refresh: load,
  };
}
