package com.school.school_management.repository;

import com.school.school_management.entity.Student;
import com.school.school_management.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public interface StudentRepository extends BaseRepository<Student, UUID> {

    List<Student> findAllByDeletedAtIsNullOrderByStudentCodeAsc();

    Optional<Student> findByStudentCodeAndDeletedAtIsNull(String studentCode);

    boolean existsByStudentCodeAndDeletedAtIsNull(String studentCode);

    /** Resolve the Student profile linked to a given User account. */
    Optional<Student> findByUserAndDeletedAtIsNull(User user);

    @Query("""
                select distinct s from Student s
                left join s.user u
                left join s.studentClasses sc
                left join sc.schoolClass c
                left join sc.academicYear ay
                where s.deletedAt is null
                    and (sc is null or sc.endDate is null)
                    and (:academicYearCode is null or upper(cast(ay.code as string)) = :academicYearCode)
                    and (:classQuery is null or upper(cast(c.classCode as string)) = :classQuery or upper(cast(c.className as string)) = :classQuery)
                    and (:status is null or upper(cast(s.status as string)) = :status)
                    and (
                        :searchPattern is null
                        or upper(cast(s.studentCode as string)) like :searchPattern
                        or upper(coalesce(cast(u.fullName as string), '')) like :searchPattern
                        or upper(coalesce(cast(c.className as string), '')) like :searchPattern
                    )
                order by s.studentCode asc
                """)
        Page<Student> searchStudents(
                @Param("academicYearCode") String academicYearCode,
                @Param("classQuery") String classQuery,
                @Param("status") String status,
                @Param("searchPattern") String searchPattern,
                Pageable pageable
        );

    @Query("""
                select distinct s from Student s
                left join s.studentClasses sc
                left join sc.schoolClass c
                where s.deletedAt is null
                    and sc.endDate is null
                    and upper(cast(c.classCode as string)) = :classCode
                order by s.studentCode asc
                """)
    List<Student> findByClass(@Param("classCode") String classCode);

    Optional<Student> findByIdAndDeletedAtIsNull(UUID id);
}
