package com.school.school_management.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Repository;

import com.school.school_management.entity.Department;

@Repository
public interface DepartmentRepository extends BaseRepository<Department, UUID> {

    List<Department> findAllByOrderByNameAsc();

    Optional<Department> findByCode(String code);
}
