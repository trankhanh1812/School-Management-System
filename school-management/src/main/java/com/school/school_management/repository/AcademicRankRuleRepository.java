package com.school.school_management.repository;

import com.school.school_management.entity.AcademicRankRule;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public interface AcademicRankRuleRepository extends BaseRepository<AcademicRankRule, UUID> {

    List<AcademicRankRule> findAllByOrderByCodeAsc();
}
