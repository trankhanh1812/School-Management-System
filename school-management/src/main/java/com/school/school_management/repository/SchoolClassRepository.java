package com.school.school_management.repository;

import com.school.school_management.entity.SchoolClass;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public interface SchoolClassRepository extends BaseRepository<SchoolClass, UUID> {

    List<SchoolClass> findAllByDeletedAtIsNullOrderByClassNameAsc();

    Optional<SchoolClass> findByIdAndDeletedAtIsNull(UUID id);

    Optional<SchoolClass> findByClassCodeAndDeletedAtIsNull(String classCode);

    boolean existsByClassCodeAndDeletedAtIsNull(String classCode);

    Optional<SchoolClass> findByClassCodeAndAcademicYear_CodeAndDeletedAtIsNull(String classCode, String academicYearCode);

    Optional<SchoolClass> findByClassNameAndAcademicYear_CodeAndDeletedAtIsNull(String className, String academicYearCode);

        @Query("""
                select c from SchoolClass c
                left join c.academicYear ay
                left join c.homeroomTeacher ht
                left join ht.user hu
                where c.deletedAt is null
                    and (:academicYearCode is null or upper(cast(ay.code as string)) = :academicYearCode)
                    and (
                        :searchPattern is null
                        or upper(coalesce(cast(c.classCode as string), '')) like :searchPattern
                        or upper(coalesce(cast(c.className as string), '')) like :searchPattern
                        or upper(coalesce(cast(hu.fullName as string), '')) like :searchPattern
                    )
                order by ay.code desc, c.className asc
                """)
        Page<SchoolClass> searchClassrooms(
                @Param("academicYearCode") String academicYearCode,
                @Param("searchPattern") String searchPattern,
                Pageable pageable
        );
}
