package com.school.school_management.repository;

import com.school.school_management.entity.Exam;
import com.school.school_management.entity.ExamClass;
import com.school.school_management.entity.SchoolClass;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ExamClassRepository extends JpaRepository<ExamClass, UUID> {

    List<ExamClass> findByExam(Exam exam);

    Optional<ExamClass> findByExamAndSchoolClass(Exam exam, SchoolClass schoolClass);

    List<ExamClass> findBySchoolClass_ClassCode(String classCode);
}
