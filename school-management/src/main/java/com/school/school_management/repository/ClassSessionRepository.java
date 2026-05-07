package com.school.school_management.repository;

import com.school.school_management.entity.ClassSession;
import com.school.school_management.entity.SchoolClass;
import com.school.school_management.entity.Semester;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public interface ClassSessionRepository extends BaseRepository<ClassSession, UUID> {

    List<ClassSession> findBySchoolClassAndDeletedAtIsNullOrderByStartTimeDesc(SchoolClass schoolClass);

    List<ClassSession> findBySchoolClassAndSemesterAndDeletedAtIsNullOrderByStartTimeDesc(SchoolClass schoolClass, Semester semester);

    List<ClassSession> findByStartTimeGreaterThanEqualAndStartTimeLessThanAndDeletedAtIsNullOrderByStartTimeDesc(
            OffsetDateTime startTime,
            OffsetDateTime endTime
    );

    Optional<ClassSession> findByIdAndDeletedAtIsNull(UUID id);

    List<ClassSession> findByDeletedAtIsNullOrderByStartTimeDesc();

    List<ClassSession> findBySemesterAndDeletedAtIsNullOrderByStartTimeDesc(Semester semester);
}
