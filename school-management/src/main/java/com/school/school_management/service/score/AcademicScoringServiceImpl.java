package com.school.school_management.service.score;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.school.school_management.entity.Score;
import com.school.school_management.entity.Student;
import com.school.school_management.enums.ExamType;

@Service
public class AcademicScoringServiceImpl implements AcademicScoringService {

    @Override
    public ScoringResult compute(Student student) {
        if (student == null || student.getScores() == null) {
            return new ScoringResult(0.0, List.of());
        }

        // Group official scores by (academic year | semester | subject), same as the transcript.
        Map<String, List<Score>> groups = new LinkedHashMap<>();
        for (Score score : student.getScores()) {
            if (score == null || score.getDeletedAt() != null || score.getScoreValue() == null) {
                continue;
            }
            if (!isOfficial(score)) {
                continue;
            }
            groups.computeIfAbsent(subjectKey(score), key -> new ArrayList<>()).add(score);
        }

        // Per subject-group: weighted average over weighted exam types (SURVEY excluded).
        List<Double> subjectAverages = new ArrayList<>();
        for (List<Score> scores : groups.values()) {
            double weightedSum = 0.0;
            double weightTotal = 0.0;
            for (Score score : scores) {
                ExamType examType = examTypeOf(score);
                if (!examType.isWeighted()) {
                    continue;
                }
                double weight = weightOf(score, examType);
                weightedSum += score.getScoreValue().doubleValue() * weight;
                weightTotal += weight;
            }
            if (weightTotal > 0) {
                subjectAverages.add(weightedSum / weightTotal);
            }
        }

        double overall = subjectAverages.isEmpty()
            ? 0.0
            : subjectAverages.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
        return new ScoringResult(overall, subjectAverages);
    }

    /** Only published (or subsequently locked) scores count toward the official average. */
    private boolean isOfficial(Score score) {
        if (score.getStatus() == null) {
            return false;
        }
        String status = score.getStatus().trim().toUpperCase(Locale.ROOT);
        return status.equals("PUBLISHED") || status.equals("LOCKED");
    }

    private String subjectKey(Score score) {
        String year = "?";
        String semester = "?";
        String subject = "?";
        if (score.getExam() != null) {
            if (score.getExam().getSemester() != null) {
                if (score.getExam().getSemester().getCode() != null) {
                    semester = score.getExam().getSemester().getCode();
                }
                if (score.getExam().getSemester().getAcademicYear() != null
                        && score.getExam().getSemester().getAcademicYear().getCode() != null) {
                    year = score.getExam().getSemester().getAcademicYear().getCode();
                }
            }
            if (score.getExam().getSubject() != null && score.getExam().getSubject().getCode() != null) {
                subject = score.getExam().getSubject().getCode();
            }
        }
        return year + "|" + semester + "|" + subject;
    }

    private ExamType examTypeOf(Score score) {
        String rawType = score.getExam() != null ? score.getExam().getExamType() : null;
        return ExamType.fromString(rawType);
    }

    /** Weight of a weighted score: the exam's configured weight if positive, else the exam-type default. */
    private double weightOf(Score score, ExamType examType) {
        if (score.getExam() != null && score.getExam().getWeight() != null) {
            double configured = score.getExam().getWeight().doubleValue();
            if (configured > 0) {
                return configured;
            }
        }
        return examType.getWeight();
    }
}
