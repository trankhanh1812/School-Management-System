package com.school.school_management.repository;

import com.school.school_management.entity.Score;
import com.school.school_management.entity.ScoreApprovalLog;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ScoreApprovalLogRepository extends JpaRepository<ScoreApprovalLog, UUID> {

    List<ScoreApprovalLog> findByScoreOrderByCreatedAtDesc(Score score);
}
