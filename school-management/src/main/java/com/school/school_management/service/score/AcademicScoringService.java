package com.school.school_management.service.score;



import com.school.school_management.entity.Student;
import com.school.school_management.entity.Student;

import java.util.List;

/**
 * Single source of truth for a student's official academic average.
 *
 * <p>Previously the promotion logic used a plain arithmetic mean of raw scores, which
 * disagreed with the weighted, per-subject, SURVEY-excluded average shown on the
 * transcript. This service computes exactly the transcript formula so every consumer
 * (transcript, promotion, graduation) reports the same number.
 */
public interface AcademicScoringService {

    ScoringResult compute(Student student);

    /** Result holder: the overall average plus each subject-group's average. */
    final class ScoringResult {

        private final double overallAverage;
        private final List<Double> subjectAverages;

        public ScoringResult(double overallAverage, List<Double> subjectAverages) {
            this.overallAverage = overallAverage;
            this.subjectAverages = subjectAverages;
        }

        public double overallAverage() {
            return overallAverage;
        }

        public boolean hasScores() {
            return !subjectAverages.isEmpty();
        }

        /** Number of subject-groups whose weighted average is below the failing mark. */
        public long failedSubjectCount(double failingMark) {
            return subjectAverages.stream().filter(avg -> avg < failingMark).count();
        }
    }
}
