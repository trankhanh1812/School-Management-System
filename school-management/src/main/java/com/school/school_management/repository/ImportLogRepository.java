package com.school.school_management.repository;

import com.school.school_management.entity.ImportLog;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public interface ImportLogRepository extends BaseRepository<ImportLog, UUID> {

    List<ImportLog> findAllByOrderByImportedAtDesc();
}
