"use client";

import { useCallback, useEffect, useState } from "react";
import { studentApi } from "@/features/student/api";
import {
  mapStudentList,
  mapStudentRecord,
  mapSubjectResults,
  mapTranscript,
  mapTranscriptOverview,
} from "@/features/student/student-adapter";
import { type StudentRecord } from "@/features/student/student-data";

export type StudentDataSource = "api" | "mock";

export type StudentListFilters = {
  academicYearCode?: string;
  classQuery?: string;
  status?: string;
  search?: string;
  scope?: "current" | "all";
  limit?: number;
};

type StudentListState = {
  records: StudentRecord[];
  source: StudentDataSource;
  isLoading: boolean;
  error: string;
  refresh: () => Promise<void>;
};

type StudentDetailState = {
  student: StudentRecord | null;
  source: StudentDataSource;
  isLoading: boolean;
  error: string;
  refresh: () => Promise<void>;
};

type MyScoresState = {
  records: StudentRecord["subjectResults"];
  source: StudentDataSource;
  isLoading: boolean;
  error: string;
  refresh: () => Promise<void>;
};

type MyTranscriptState = {
  transcript: StudentRecord["transcript"];
  transcriptOverview: StudentRecord["transcriptOverview"];
  source: StudentDataSource;
  isLoading: boolean;
  error: string;
  refresh: () => Promise<void>;
};

export function useStudentListData(filters?: StudentListFilters): StudentListState {
  const [records, setRecords] = useState<StudentRecord[]>([]);
  const [source, setSource] = useState<StudentDataSource>("api");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await studentApi.list(filters);
      setRecords(mapStudentList(response.data));
      setSource("api");
    } catch (loadError) {
      setRecords([]);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Không thể tải danh sách học sinh từ hệ thống.",
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
    source,
    isLoading,
    error,
    refresh: load,
  };
}

export function useStudentDetailData(studentCode: string): StudentDetailState {
  const [student, setStudent] = useState<StudentRecord | null>(null);
  const [source, setSource] = useState<StudentDataSource>("api");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await studentApi.detail(studentCode);
      setStudent(mapStudentRecord(response.data));
      setSource("api");
    } catch (loadError) {
      setStudent(null);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Không thể tải hồ sơ học sinh từ hệ thống.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [studentCode]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    student,
    source,
    isLoading,
    error,
    refresh: load,
  };
}

export function useMyStudentProfileData(): StudentDetailState {
  const [student, setStudent] = useState<StudentRecord | null>(null);
  const [source, setSource] = useState<StudentDataSource>("api");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await studentApi.myProfile();
      setStudent(mapStudentRecord(response.data));
      setSource("api");
    } catch (loadError) {
      setStudent(null);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Không thể tải hồ sơ học sinh hiện tại từ hệ thống.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    student,
    source,
    isLoading,
    error,
    refresh: load,
  };
}

export function useMyStudentScoresData(): MyScoresState {
  const [records, setRecords] = useState<StudentRecord["subjectResults"]>([]);
  const [source, setSource] = useState<StudentDataSource>("api");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await studentApi.myScores();
      setRecords(mapSubjectResults(response.data));
      setSource("api");
    } catch (loadError) {
      setRecords([]);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Không thể tải bảng điểm học sinh hiện tại từ hệ thống.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    records,
    source,
    isLoading,
    error,
    refresh: load,
  };
}

export function useMyStudentTranscriptData(): MyTranscriptState {
  const [transcript, setTranscript] = useState<StudentRecord["transcript"]>([]);
  const [transcriptOverview, setTranscriptOverview] = useState<StudentRecord["transcriptOverview"]>([]);
  const [source, setSource] = useState<StudentDataSource>("api");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await studentApi.myTranscript();
      setTranscript(mapTranscript(response.data?.transcript));
      setTranscriptOverview(mapTranscriptOverview(response.data?.transcriptOverview));
      setSource("api");
    } catch (loadError) {
      setTranscript([]);
      setTranscriptOverview([]);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Không thể tải học bạ học sinh hiện tại từ hệ thống.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    transcript,
    transcriptOverview,
    source,
    isLoading,
    error,
    refresh: load,
  };
}
