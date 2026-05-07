package com.school.school_management.repository;

import com.school.school_management.entity.Attendance;
import com.school.school_management.entity.ClassSession;
import com.school.school_management.entity.Student;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.query.Procedure;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface AttendanceRepository extends BaseRepository<Attendance, UUID> {

    List<Attendance> findAllByDeletedAtIsNullOrderByCreatedAtDesc();

    List<Attendance> findBySession(ClassSession session);

    Optional<Attendance> findByStudentAndSession(Student student, ClassSession session);

    List<Attendance> findByStudent(Student student);

    List<Attendance> findBySessionAndStatusOrderByCreatedAtDesc(ClassSession session, String status);

    List<Attendance> findBySessionOrderByCreatedAtDesc(ClassSession session);

    List<Attendance> findByStudentAndSession_StartTimeGreaterThanEqualAndSession_StartTimeLessThan(
            Student student,
            OffsetDateTime startDate,
            OffsetDateTime endDate
    );
}
