package com.school.school_management.repository;

import com.school.school_management.entity.AcademicYear;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface AcademicYearRepository extends BaseRepository<AcademicYear, UUID> {

    Optional<AcademicYear> findByCode(String code);

    @Query("""
            select ay from AcademicYear ay
            where upper(cast(ay.status as string)) = :status
            order by ay.startDate desc
            """)
    List<AcademicYear> findByStatusSafeOrderByStartDateDesc(@Param("status") String status, Pageable pageable);

    Optional<AcademicYear> findFirstByOrderByStartDateDesc();
}
