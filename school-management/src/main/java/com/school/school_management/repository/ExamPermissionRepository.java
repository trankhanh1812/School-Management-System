package com.school.school_management.repository;

import com.school.school_management.entity.Exam;
import com.school.school_management.entity.ExamPermission;
import com.school.school_management.entity.Student;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public interface ExamPermissionRepository extends BaseRepository<ExamPermission, UUID> {

    List<ExamPermission> findAllByOrderByIdDesc();

    List<ExamPermission> findByExamOrderByStudentAsc(Exam exam);

    List<ExamPermission> findByStudentOrderByIdDesc(Student student);

    Optional<ExamPermission> findByExamAndStudent(Exam exam, Student student);
}
