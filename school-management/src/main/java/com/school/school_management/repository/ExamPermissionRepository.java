package com.school.school_management.repository;

import com.school.school_management.entity.ExamPermission;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public interface ExamPermissionRepository extends BaseRepository<ExamPermission, UUID> {

    List<ExamPermission> findAllByOrderByIdDesc();
}
