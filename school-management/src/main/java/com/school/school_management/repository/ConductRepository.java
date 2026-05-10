package com.school.school_management.repository;

import com.school.school_management.entity.Conduct;
import com.school.school_management.entity.SchoolClass;
import com.school.school_management.entity.Semester;
import com.school.school_management.entity.Student;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public interface ConductRepository extends BaseRepository<Conduct, UUID> {

    List<Conduct> findAllByOrderByIdDesc();

    Optional<Conduct> findById(UUID id);

    Optional<Conduct> findByStudentAndSemester(Student student, Semester semester);

    List<Conduct> findByStudentOrderByIdDesc(Student student);

    List<Conduct> findBySchoolClassOrderByStudentAsc(SchoolClass schoolClass);

    List<Conduct> findBySchoolClassAndSemesterOrderByStudentAsc(SchoolClass schoolClass, Semester semester);
}
