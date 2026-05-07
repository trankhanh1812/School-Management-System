import type { StudentRecord } from "@/features/student/student-data";

export type AssessmentRecord = StudentRecord["subjectResults"][number]["assessments"][number];
export type SubjectResultRecord = StudentRecord["subjectResults"][number];

function parseScore(score: string) {
  const value = Number.parseFloat(score);
  return Number.isFinite(value) ? value : 0;
}

function parseWeight(weight: string) {
  if (weight.includes("Hệ số 3")) return 3;
  if (weight.includes("Hệ số 2")) return 2;
  if (weight.includes("Hệ số 1")) return 1;
  return 0;
}

function roundOne(value: number) {
  return Math.round(value * 10) / 10;
}

export function calculateOfficialAverage(assessments: AssessmentRecord[]) {
  const officialAssessments = assessments.filter(
    (assessment) => assessment.category === "Chính thức",
  );

  const totalWeight = officialAssessments.reduce(
    (sum, assessment) => sum + parseWeight(assessment.weight),
    0,
  );

  if (totalWeight === 0) {
    return 0;
  }

  const weightedTotal = officialAssessments.reduce(
    (sum, assessment) =>
      sum + parseScore(assessment.score) * parseWeight(assessment.weight),
    0,
  );

  return roundOne(weightedTotal / totalWeight);
}

export function calculateSurveyAverage(assessments: AssessmentRecord[]) {
  const surveyAssessments = assessments.filter(
    (assessment) => assessment.category === "Khảo sát",
  );

  if (surveyAssessments.length === 0) {
    return 0;
  }

  const total = surveyAssessments.reduce(
    (sum, assessment) => sum + parseScore(assessment.score),
    0,
  );

  return roundOne(total / surveyAssessments.length);
}

export function getAcademicRank(average: number) {
  if (average >= 8) return "Giỏi";
  if (average >= 6.5) return "Khá";
  if (average >= 5) return "Trung bình";
  return "Cần hỗ trợ";
}

export function buildComputedSubjectResult(subjectResult: SubjectResultRecord) {
  const officialAverage = calculateOfficialAverage(subjectResult.assessments);
  const surveyAverage = calculateSurveyAverage(subjectResult.assessments);
  const rank = getAcademicRank(officialAverage);

  return {
    ...subjectResult,
    officialAverage: officialAverage.toFixed(1),
    surveyAverage: surveyAverage.toFixed(1),
    rank,
  };
}
