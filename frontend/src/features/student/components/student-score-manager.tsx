"use client";

import { useMemo, useState } from "react";
import type { StudentRecord } from "@/features/student/student-data";
import {
  buildComputedSubjectResult,
  getAcademicRank,
} from "@/features/student/score-utils";
import { FilterSelect } from "@/features/student/components/filter-select";
import { ScoreEntryTable } from "@/features/student/components/score-entry-table";
import { Panel } from "@/shared/ui/panel";

export function StudentScoreManager({ student }: { student: StudentRecord }) {
  const [subjectResults, setSubjectResults] = useState(student.subjectResults);

  const academicYearOptions = useMemo(
    () => ["Tất cả", ...new Set(subjectResults.map((item) => item.academicYear))],
    [subjectResults],
  );
  const semesterOptions = useMemo(
    () => ["Tất cả", ...new Set(subjectResults.map((item) => item.semester))],
    [subjectResults],
  );
  const subjectOptions = useMemo(
    () => ["Tất cả", ...new Set(subjectResults.map((item) => item.subject))],
    [subjectResults],
  );

  const [selectedAcademicYear, setSelectedAcademicYear] = useState(
    academicYearOptions[0],
  );
  const [selectedSemester, setSelectedSemester] = useState(semesterOptions[0]);
  const [selectedSubject, setSelectedSubject] = useState(subjectOptions[0]);

  const filteredSubjectResults = subjectResults.filter(
    (item) =>
      (selectedAcademicYear === "Tất cả" ||
        item.academicYear === selectedAcademicYear) &&
      (selectedSemester === "Tất cả" || item.semester === selectedSemester) &&
      (selectedSubject === "Tất cả" || item.subject === selectedSubject),
  );

  const computedSubjectResults = filteredSubjectResults.map(buildComputedSubjectResult);
  const overallAverage =
    computedSubjectResults.length > 0
      ? computedSubjectResults.reduce(
          (sum, item) => sum + Number.parseFloat(item.officialAverage),
          0,
        ) / computedSubjectResults.length
      : 0;
  const roundedOverallAverage = Math.round(overallAverage * 10) / 10;
  const overallRank = getAcademicRank(roundedOverallAverage);

  const handleScoreChange = (
    subjectKey: string,
    assessmentName: string,
    nextScore: string,
  ) => {
    setSubjectResults((currentResults) =>
      currentResults.map((subjectResult) => {
        const currentSubjectKey = `${subjectResult.academicYear}-${subjectResult.semester}-${subjectResult.subject}`;

        if (currentSubjectKey !== subjectKey) {
          return subjectResult;
        }

        return {
          ...subjectResult,
          assessments: subjectResult.assessments.map((assessment) =>
            assessment.assessmentName === assessmentName
              ? { ...assessment, score: nextScore }
              : assessment,
          ),
        };
      }),
    );
  };

  return (
    <div className="grid gap-4">
      <Panel className="p-5 sm:p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <FilterSelect
            label="Năm học"
            value={selectedAcademicYear}
            options={academicYearOptions}
            onChange={setSelectedAcademicYear}
          />
          <FilterSelect
            label="Học kỳ"
            value={selectedSemester}
            options={semesterOptions}
            onChange={setSelectedSemester}
          />
          <FilterSelect
            label="Môn học"
            value={selectedSubject}
            options={subjectOptions}
            onChange={setSelectedSubject}
          />
        </div>
      </Panel>

      <Panel className="p-5 sm:p-6">
        <div className="grid gap-3 text-sm text-slate-700 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 p-4">
            <p className="font-medium text-slate-500">Điểm trung bình hiện tại</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              {roundedOverallAverage.toFixed(1)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 p-4">
            <p className="font-medium text-slate-500">Xếp loại tạm tính</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              {overallRank}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 p-4">
            <p className="font-medium text-slate-500">Môn đang hiển thị</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              {computedSubjectResults.length}
            </p>
          </div>
        </div>
      </Panel>

      <ScoreEntryTable
        student={student}
        subjectResults={filteredSubjectResults}
        onScoreChange={handleScoreChange}
      />
    </div>
  );
}
