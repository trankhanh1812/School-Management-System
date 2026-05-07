package com.school.school_management.repository;

import com.school.school_management.entity.Score;
import com.school.school_management.entity.ScoreHistory;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ScoreHistoryRepository extends JpaRepository<ScoreHistory, UUID> {

    List<ScoreHistory> findByScoreOrderByChangedAtDesc(Score score);

    @Query("SELECT sh FROM ScoreHistory sh " +
           "JOIN sh.score s " +
           "WHERE s.student.id = :studentId " +
           "ORDER BY sh.changedAt DESC")
    List<ScoreHistory> findAllByStudent_IdOrderByChangedAtDesc(@Param("studentId") UUID studentId);
}
