package com.school.school_management.repository;

import com.school.school_management.entity.Subject;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public interface SubjectRepository extends BaseRepository<Subject, UUID> {

    List<Subject> findAllByDeletedAtIsNullOrderByNameAsc();

    Optional<Subject> findByIdAndDeletedAtIsNull(UUID id);

    Optional<Subject> findByCodeAndDeletedAtIsNull(String code);

    boolean existsByCodeAndDeletedAtIsNull(String code);
}
