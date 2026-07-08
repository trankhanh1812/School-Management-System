package com.school.school_management.repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.school.school_management.entity.Attendance;
import com.school.school_management.entity.ClassSession;
import com.school.school_management.entity.Student;

@Repository
public interface AttendanceRepository extends BaseRepository<Attendance, UUID> {

    List<Attendance> findAllByDeletedAtIsNullOrderByCreatedAtDesc();

    /**
     * Finds the attendance row for a student+session INCLUDING soft-deleted ones
     * (native query bypasses the entity @SQLRestriction). Used to reuse/undelete an
     * existing row on re-marking, avoiding a unique-constraint violation.
     */
    @Query(value = "SELECT * FROM attendance WHERE student_id = :studentId AND session_id = :sessionId LIMIT 1",
        nativeQuery = true)
    Optional<Attendance> findAnyByStudentAndSession(@Param("studentId") UUID studentId,
                                                    @Param("sessionId") UUID sessionId);

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
