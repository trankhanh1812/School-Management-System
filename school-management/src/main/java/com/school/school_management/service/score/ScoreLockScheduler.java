package com.school.school_management.service.score;

import java.time.OffsetDateTime;
import java.util.List;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.school.school_management.entity.Score;
import com.school.school_management.repository.ScoreRepository;

import lombok.extern.slf4j.Slf4j;

/**
 * Periodically LOCKs published scores whose edit window has elapsed.
 *
 * <p>Previously locking only happened lazily when someone attempted an edit, so a
 * published score that was never touched again stayed editable forever. This job
 * enforces the spec rule "sau hạn → điểm tự động LOCKED" independent of user action.
 */
@Slf4j
@Component
public class ScoreLockScheduler {

    private static final String PUBLISHED = "PUBLISHED";
    private static final String LOCKED = "LOCKED";

    private final ScoreRepository scoreRepository;

    public ScoreLockScheduler(ScoreRepository scoreRepository) {
        this.scoreRepository = scoreRepository;
    }

    // Every hour on the hour.
    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void lockExpiredScores() {
        List<Score> published = scoreRepository.findByStatusIgnoreCaseAndDeletedAtIsNull(PUBLISHED);
        OffsetDateTime now = OffsetDateTime.now();
        int locked = 0;
        for (Score score : published) {
            if (isEditWindowExpired(score, now)) {
                score.setStatus(LOCKED);
                scoreRepository.save(score);
                locked++;
            }
        }
        if (locked > 0) {
            log.info("Auto-locked {} score(s) past their edit window", locked);
        }
    }

    private boolean isEditWindowExpired(Score score, OffsetDateTime now) {
        Integer editWindowDays = score.getExam() != null ? score.getExam().getEditWindowDays() : null;
        OffsetDateTime publishedAt = score.getPublishedAt();
        if (publishedAt == null || editWindowDays == null || editWindowDays < 0) {
            return false;
        }
        return now.isAfter(publishedAt.plusDays(editWindowDays));
    }
}
