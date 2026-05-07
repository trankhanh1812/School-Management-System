package com.school.school_management.repository;

import com.school.school_management.entity.Exam;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public interface ExamRepository extends BaseRepository<Exam, UUID> {

    List<Exam> findAllByDeletedAtIsNullOrderByExamDateDesc();

    Optional<Exam> findByIdAndDeletedAtIsNull(UUID id);
}
