package com.school.school_management.repository;

import com.school.school_management.entity.Parent;
import com.school.school_management.entity.ParentStudent;
import com.school.school_management.entity.Student;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public interface ParentStudentRepository extends BaseRepository<ParentStudent, UUID> {
    Optional<ParentStudent> findByParentAndStudent(Parent parent, Student student);

    List<ParentStudent> findByStudentIn(List<Student> students);
}
