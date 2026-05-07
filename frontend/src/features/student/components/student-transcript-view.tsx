"use client";

import { useMemo, useState } from "react";
import { DataTable } from "@/features/dashboard/components/data-table";
import type { StudentRecord } from "@/features/student/student-data";
import { buildComputedSubjectResult } from "@/features/student/score-utils";
import { FilterSelect } from "@/features/student/components/filter-select";
import { Panel } from "@/shared/ui/panel";

export function StudentTranscriptView({ student }: { student: StudentRecord }) {
  const availableAcademicYears = useMemo(
    () => ["Tất cả", ...student.transcriptOverview.map((item) => item.academicYear)],
    [student.transcriptOverview],
  );
  const availableSubjects = useMemo(
    () => ["Tất cả", ...new Set(student.transcript.map((item) => item.subject))],
    [student.transcript],
  );
  const availableSemesters = useMemo(
    () => ["Tất cả", ...new Set(student.subjectResults.map((item) => item.semester))],
    [student.subjectResults],
  );

  const [selectedAcademicYear, setSelectedAcademicYear] = useState(
    availableAcademicYears[0],
  );
  const [selectedSubject, setSelectedSubject] = useState(availableSubjects[0]);
  const [selectedSemester, setSelectedSemester] = useState(availableSemesters[0]);

  const filteredOverview = student.transcriptOverview.filter(
    (item) =>
      selectedAcademicYear === "Tất cả" || item.academicYear === selectedAcademicYear,
  );

  const filteredTranscript = student.transcript.filter(
    (item) => selectedSubject === "Tất cả" || item.subject === selectedSubject,
  );

  const filteredComputedSubjectResults = student.subjectResults
    .filter(
      (item) =>
        (selectedAcademicYear === "Tất cả" ||
          item.academicYear === selectedAcademicYear) &&
        (selectedSubject === "Tất cả" || item.subject === selectedSubject) &&
        (selectedSemester === "Tất cả" || item.semester === selectedSemester),
    )
    .map(buildComputedSubjectResult);

  return (
    <div className="grid gap-4">
      <Panel className="p-5 sm:p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <FilterSelect
            label="Năm học"
            value={selectedAcademicYear}
            options={availableAcademicYears}
            onChange={setSelectedAcademicYear}
          />
          <FilterSelect
            label="Học kỳ"
            value={selectedSemester}
            options={availableSemesters}
            onChange={setSelectedSemester}
          />
          <FilterSelect
            label="Môn học"
            value={selectedSubject}
            options={availableSubjects}
            onChange={setSelectedSubject}
          />
        </div>
      </Panel>

      <section className="grid gap-4 xl:grid-cols-3">
        {filteredOverview.map((item) => (
          <Panel key={`${student.studentCode}-${item.academicYear}`} className="p-5">
            <div className="grid gap-3">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">
                {item.academicYear}
              </p>
              <h3 className="text-2xl font-semibold tracking-tight text-slate-950">
                {item.className}
              </h3>
              <div className="grid gap-2 text-sm text-slate-700">
                <p>Điểm trung bình học kỳ: {item.semesterAverage}</p>
                <p>Điểm trung bình cả năm: {item.yearAverage}</p>
                <p>Học lực: {item.academicRank}</p>
                <p>Hạnh kiểm: {item.conduct}</p>
                <p>Nghỉ học: {item.absences}</p>
              </div>
            </div>
          </Panel>
        ))}
      </section>

      <DataTable
        title="Kết quả theo môn học"
        description="Có thể lọc nhanh theo môn để học sinh hoặc phụ huynh xem đúng phần cần quan tâm."
        columns={["Môn học", "HK I", "HK II", "Cả năm"]}
        rows={filteredTranscript.map((item) => [
          item.subject,
          item.semester1,
          item.semester2,
          item.yearAverage,
        ])}
      />

      <DataTable
        title="Kết quả theo môn và trạng thái đánh giá"
        description="Kết quả được tính từ đầu điểm và có thể lọc theo năm học, học kỳ, môn học."
        columns={["Năm học", "Môn học", "Kỳ", "Điểm chính thức", "Điểm khảo sát", "Xếp loại"]}
        rows={filteredComputedSubjectResults.map((item) => [
          item.academicYear,
          item.subject,
          item.semester,
          item.officialAverage,
          item.surveyAverage,
          item.rank,
        ])}
      />

      <Panel className="p-5 sm:p-6">
        <h3 className="text-xl font-semibold tracking-tight text-slate-950">
          Ghi chú tính điểm
        </h3>
        <div className="mt-4 grid gap-2 text-sm leading-7 text-slate-700">
          <p>• Điểm chính thức được tính theo trọng số của từng đầu điểm.</p>
          <p>• Điểm khảo sát được tách riêng để theo dõi tiến bộ và cảnh báo rủi ro học lực.</p>
          <p>• Xếp loại môn được suy ra trực tiếp từ điểm trung bình chính thức.</p>
        </div>
      </Panel>
    </div>
  );
}
