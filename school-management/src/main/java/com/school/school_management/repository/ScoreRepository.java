package com.school.school_management.repository;

import com.school.school_management.entity.Exam;
import com.school.school_management.entity.Score;
import com.school.school_management.entity.Student;
import com.school.school_management.entity.Teacher;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public interface ScoreRepository extends BaseRepository<Score, UUID> {

    List<Score> findAllByDeletedAtIsNullOrderByCreatedAtDesc();

    Optional<Score> findByIdAndDeletedAtIsNull(UUID id);

    Optional<Score> findByStudentAndExamAndDeletedAtIsNull(Student student, Exam exam);

    List<Score> findByExamAndDeletedAtIsNull(Exam exam);

    List<Score> findByTeacherAndDeletedAtIsNull(Teacher teacher);
}
