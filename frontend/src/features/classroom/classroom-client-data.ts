"use client";

import { useCallback, useEffect, useState } from "react";
import { classroomApi } from "@/features/classroom/api";
import {
  mapClassroomList,
  mapClassroomMetrics,
  mapClassroomRecord,
  mapClassStudentList,
  mapPromotionPlans,
  type ClassStudentRecord,
  type ClassroomMetricRecord,
} from "@/features/classroom/classroom-adapter";
import type { ClassroomRecord, PromotionPlan } from "@/features/classroom/classroom-data";

export type ClassroomListFilters = {
  academicYearCode?: string;
  search?: string;
  scope?: "current" | "all";
  limit?: number;
};

type ClassroomListState = {
  records: ClassroomRecord[];
  metrics: ClassroomMetricRecord[];
  isLoading: boolean;
  error: string;
  refresh: () => Promise<void>;
};

type ClassroomDetailState = {
  classroom: ClassroomRecord | null;
  students: ClassStudentRecord[];
  promotionPlans: PromotionPlan[];
  isLoading: boolean;
  error: string;
  refresh: () => Promise<void>;
};

type PromotionBoardState = {
  plans: PromotionPlan[];
  metrics: ClassroomMetricRecord[];
  isLoading: boolean;
  error: string;
  refresh: () => Promise<void>;
};

export function useClassroomListData(filters?: ClassroomListFilters): ClassroomListState {
  const [records, setRecords] = useState<ClassroomRecord[]>([]);
  const [metrics, setMetrics] = useState<ClassroomMetricRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const [listResponse, metricsResponse] = await Promise.all([
        classroomApi.list(filters),
        classroomApi.metrics(),
      ]);

      setRecords(mapClassroomList(listResponse.data));
      setMetrics(mapClassroomMetrics(metricsResponse.data));
    } catch (loadError) {
      setRecords([]);
      setMetrics([]);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Không thể tải dữ liệu lớp học từ hệ thống.",
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
    metrics,
    isLoading,
    error,
    refresh: load,
  };
}

export function useClassroomDetailData(classCode: string): ClassroomDetailState {
  const [classroom, setClassroom] = useState<ClassroomRecord | null>(null);
  const [students, setStudents] = useState<ClassStudentRecord[]>([]);
  const [promotionPlans, setPromotionPlans] = useState<PromotionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const [detailResponse, studentsResponse, plansResponse] = await Promise.all([
        classroomApi.detail(classCode),
        classroomApi.students(classCode),
        classroomApi.promotionPlans(classCode),
      ]);

      setClassroom(mapClassroomRecord(detailResponse.data));
      setStudents(mapClassStudentList(studentsResponse.data));
      setPromotionPlans(mapPromotionPlans(plansResponse.data));
    } catch (loadError) {
      setClassroom(null);
      setStudents([]);
      setPromotionPlans([]);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Không thể tải chi tiết lớp học từ hệ thống.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [classCode]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    classroom,
    students,
    promotionPlans,
    isLoading,
    error,
    refresh: load,
  };
}

export function usePromotionBoardData(): PromotionBoardState {
  const [plans, setPlans] = useState<PromotionPlan[]>([]);
  const [metrics, setMetrics] = useState<ClassroomMetricRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const [allPlans, metricsResponse] = await Promise.all([
        classroomApi.allPromotionPlans(),
        classroomApi.metrics(),
      ]);

      setPlans(mapPromotionPlans(allPlans));
      setMetrics(mapClassroomMetrics(metricsResponse.data));
    } catch (loadError) {
      setPlans([]);
      setMetrics([]);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Không thể tải dữ liệu xét lên lớp từ hệ thống.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    plans,
    metrics,
    isLoading,
    error,
    refresh: load,
  };
}
