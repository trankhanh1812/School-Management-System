"use client";

import { useCallback, useEffect, useState } from "react";
import { parentApi, type LinkedChild, type ParentProfileRecord } from "@/features/parent/api";
import {
  mapStudentRecord,
  mapSubjectResults,
  mapTranscript,
  mapTranscriptOverview,
} from "@/features/student/student-adapter";
import type { StudentRecord } from "@/features/student/student-data";
import type { ConductRecord } from "@/features/conduct/api";
import type { ExamRecord } from "@/features/exam/api";

// ─── Parent own profile + children list ───────────────────────────────────────

type ParentProfileState = {
  profile: ParentProfileRecord | null;
  children: LinkedChild[];
  isLoading: boolean;
  error: string;
  refresh: () => Promise<void>;
};

export function useParentProfile(): ParentProfileState {
  const [profile, setProfile] = useState<ParentProfileRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await parentApi.myProfile();
      setProfile(res.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải thông tin phụ huynh.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return {
    profile,
    children: profile?.children ?? [],
    isLoading,
    error,
    refresh: load,
  };
}

// ─── Child profile ─────────────────────────────────────────────────────────────

type ChildProfileState = {
  student: StudentRecord | null;
  isLoading: boolean;
  error: string;
};

export function useChildProfile(studentCode: string): ChildProfileState {
  const [student, setStudent] = useState<StudentRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!studentCode) return;
    setIsLoading(true);
    setError("");
    try {
      const res = await parentApi.childProfile(studentCode);
      setStudent(mapStudentRecord(res.data));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải hồ sơ học sinh.");
    } finally {
      setIsLoading(false);
    }
  }, [studentCode]);

  useEffect(() => { void load(); }, [load]);

  return { student, isLoading, error };
}

// ─── Child scores ──────────────────────────────────────────────────────────────

type ChildScoresState = {
  records: ReturnType<typeof mapSubjectResults>;
  isLoading: boolean;
  error: string;
};

export function useChildScores(studentCode: string): ChildScoresState {
  const [records, setRecords] = useState<ReturnType<typeof mapSubjectResults>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!studentCode) return;
    setIsLoading(true);
    setError("");
    try {
      const res = await parentApi.childScores(studentCode);
      setRecords(mapSubjectResults(res.data));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải điểm số.");
    } finally {
      setIsLoading(false);
    }
  }, [studentCode]);

  useEffect(() => { void load(); }, [load]);

  return { records, isLoading, error };
}

// ─── Child transcript ──────────────────────────────────────────────────────────

type ChildTranscriptState = {
  transcript: ReturnType<typeof mapTranscript>;
  transcriptOverview: ReturnType<typeof mapTranscriptOverview>;
  isLoading: boolean;
  error: string;
};

export function useChildTranscript(studentCode: string): ChildTranscriptState {
  const [transcript, setTranscript] = useState<ReturnType<typeof mapTranscript>>([]);
  const [transcriptOverview, setTranscriptOverview] = useState<ReturnType<typeof mapTranscriptOverview>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!studentCode) return;
    setIsLoading(true);
    setError("");
    try {
      const res = await parentApi.childTranscript(studentCode);
      setTranscript(mapTranscript(res.data?.transcript));
      setTranscriptOverview(mapTranscriptOverview(res.data?.transcriptOverview));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải học bạ.");
    } finally {
      setIsLoading(false);
    }
  }, [studentCode]);

  useEffect(() => { void load(); }, [load]);

  return { transcript, transcriptOverview, isLoading, error };
}

// ─── Child conduct ─────────────────────────────────────────────────────────────

type ChildConductState = {
  records: ConductRecord[];
  isLoading: boolean;
  error: string;
};

export function useChildConduct(studentCode: string): ChildConductState {
  const [records, setRecords] = useState<ConductRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!studentCode) return;
    setIsLoading(true);
    setError("");
    try {
      const res = await parentApi.childConduct(studentCode);
      setRecords(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải hạnh kiểm.");
    } finally {
      setIsLoading(false);
    }
  }, [studentCode]);

  useEffect(() => { void load(); }, [load]);

  return { records, isLoading, error };
}

// ─── Child exams ───────────────────────────────────────────────────────────────

type ChildExamsState = {
  exams: ExamRecord[];
  isLoading: boolean;
  error: string;
};

export function useChildExams(
  studentCode: string,
  semesterCode?: string,
): ChildExamsState {
  const [exams, setExams] = useState<ExamRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!studentCode) return;
    setIsLoading(true);
    setError("");
    try {
      const res = await parentApi.childExams(studentCode, { semesterCode });
      setExams(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải lịch thi.");
    } finally {
      setIsLoading(false);
    }
  }, [studentCode, semesterCode]);

  useEffect(() => { void load(); }, [load]);

  return { exams, isLoading, error };
}
