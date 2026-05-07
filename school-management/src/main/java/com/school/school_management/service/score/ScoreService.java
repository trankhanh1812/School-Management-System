package com.school.school_management.service.score;

import com.school.school_management.dto.score.ScoreHistoryResponse;
import com.school.school_management.dto.score.ScoreResponse;
import com.school.school_management.dto.score.ScoreUpsertRequest;
import java.util.List;

public interface ScoreService {

    List<ScoreResponse> listScores(String examId);

    ScoreResponse getScore(String scoreId);

    ScoreResponse updateScore(String scoreId, ScoreUpsertRequest request);

    void submitScores(String examId);

    ScoreResponse approveScore(String scoreId);

    void publishScores(String examId);

    List<ScoreHistoryResponse> getScoreHistory(String scoreId);
}
