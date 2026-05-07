package com.school.school_management.repository;

import com.school.school_management.entity.PromotionLog;
import java.util.UUID;
import java.util.List;
import org.springframework.stereotype.Repository;

@Repository
public interface PromotionLogRepository extends BaseRepository<PromotionLog, UUID> {
	List<PromotionLog> findAllByStudent_IdOrderByPromotedAtDesc(UUID studentId);
}