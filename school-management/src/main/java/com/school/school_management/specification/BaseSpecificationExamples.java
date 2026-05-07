//package com.school.school_management.specification;
//
//import org.springframework.data.domain.Page;
//import org.springframework.data.domain.PageRequest;
//import org.springframework.data.domain.Pageable;
//import org.springframework.data.jpa.domain.Specification;
//import java.time.LocalDate;
//import java.util.Arrays;
//import java.util.UUID;
//
///**
// * BaseSpecificationExamples - Demonstrates common usage patterns for BaseSpecification.
// *
// * BaseSpecification is a reusable, flexible filtering solution for dynamic JPA queries.
// * Instead of creating entity-specific specification classes, use BaseSpecification directly
// * with FilterCriteria for all common filtering scenarios.
// *
// * Common Use Cases:
// * 1. Search by name/text (LIKE)
// * 2. Filter by exact field value (EQUAL)
// * 3. Filter by status (EQUAL/IN)
// * 4. Filter by academic year (EQUAL)
// * 5. Filter by date range (BETWEEN)
// * 6. Complex filters with AND/OR (SpecificationBuilder)
// */
//public class BaseSpecificationExamples {
//
//    /**
//     * ========== SIMPLE USAGE - Direct BaseSpecification ==========
//     */
//
//    /**
//     * Example 1: Search students by full name (case-insensitive)
//     * Use: studentRepository.findAll(
//     *      new BaseSpecification<>(new FilterCriteria("fullName", SearchOperation.LIKE, "John"))
//     * )
//     */
//    public static <T> Specification<T> searchByName(String fieldName, String searchText) {
//        return new BaseSpecification<>(
//            new FilterCriteria(fieldName, SearchOperation.LIKE, searchText)
//        );
//    }
//
//    /**
//     * Example 2: Filter by status (exact match)
//     * Use: studentRepository.findAll(
//     *      new BaseSpecification<>(new FilterCriteria("status", SearchOperation.EQUAL, "ACTIVE"))
//     * )
//     */
//    public static <T> Specification<T> filterByStatus(String statusValue) {
//        return new BaseSpecification<>(
//            new FilterCriteria("status", SearchOperation.EQUAL, statusValue)
//        );
//    }
//
//    /**
//     * Example 3: Filter by academic year
//     * Use: studentRepository.findAll(
//     *      new BaseSpecification<>(new FilterCriteria("academicYear", SearchOperation.EQUAL, 2024))
//     * )
//     */
//    public static <T> Specification<T> filterByYear(int year) {
//        return new BaseSpecification<>(
//            new FilterCriteria("academicYear", SearchOperation.EQUAL, year)
//        );
//    }
//
//    /**
//     * Example 4: Filter by class ID
//     * Use: studentRepository.findAll(
//     *      new BaseSpecification<>(new FilterCriteria("schoolClassId", SearchOperation.EQUAL, classId))
//     * )
//     */
//    public static <T> Specification<T> filterByClass(UUID classId) {
//        return new BaseSpecification<>(
//            new FilterCriteria("schoolClassId", SearchOperation.EQUAL, classId)
//        );
//    }
//
//    /**
//     * ========== USING FACTORY METHODS - Cleaner API ==========
//     */
//
//    /**
//     * Example 5: Search using factory method
//     * Use: studentRepository.findAll(
//     *      BaseSpecification.like("fullName", "John")
//     * )
//     */
//    public void exampleSearchWithFactory() {
//        // Direct usage in repository call
//        // Page<Student> = studentRepository.findAll(
//        //     BaseSpecification.like("fullName", "John"),
//        //     pageable
//        // );
//    }
//
//    /**
//     * Example 6: Filter status using factory method
//     * Use: studentRepository.findAll(BaseSpecification.equal("status", "ACTIVE"))
//     */
//    public void exampleFilterStatusWithFactory() {
//        // Cleaner than FilterCriteria constructor
//    }
//
//    /**
//     * Example 7: Check if not deleted (soft-delete check)
//     * Use: studentRepository.findAll(
//     *      BaseSpecification.isNull("deletedAt")
//     * )
//     */
//    public void exampleNotDeleted() {
//        // Find only non-deleted records
//    }
//
//    /**
//     * ========== COMPLEX FILTERS - Using SpecificationBuilder ==========
//     */
//
//    /**
//     * Example 8: Combined filter - Active students in specific class and year
//     * Use: studentRepository.findAll(new SpecificationBuilder<Student>()
//     *      .with("status", SearchOperation.EQUAL, "ACTIVE")
//     *      .with("schoolClassId", SearchOperation.EQUAL, classId)
//     *      .with("academicYear", SearchOperation.EQUAL, 2024)
//     *      .build()
//     * );
//     */
//    public void exampleCombinedFilter() {
//        /*
//        SpecificationBuilder<Student> builder = new SpecificationBuilder<>();
//        builder.with("status", SearchOperation.EQUAL, "ACTIVE");
//        builder.with("schoolClassId", SearchOperation.EQUAL, classId);
//        builder.with("academicYear", SearchOperation.EQUAL, 2024);
//
//        Specification<Student> spec = builder.build();
//        Page<Student> results = studentRepository.findAll(spec, pageable);
//        */
//    }
//
//    /**
//     * Example 9: Search with OR logic
//     * Use: Find students matching name "John" OR "Jane" OR in active status
//     * Code:
//     * new SpecificationBuilder<Student>()
//     *      .with("fullName", SearchOperation.LIKE, "John")
//     *      .withOr("fullName", SearchOperation.LIKE, "Jane")  // OR condition
//     *      .build()
//     */
//    public void exampleOrLogic() {
//        /*
//        SpecificationBuilder<Student> builder = new SpecificationBuilder<>();
//        builder.with("fullName", SearchOperation.LIKE, "John");
//        builder.withOr("fullName", SearchOperation.LIKE, "Jane");
//        builder.withOr("fullName", SearchOperation.LIKE, "Alice");
//
//        Specification<Student> spec = builder.build();
//        */
//    }
//
//    /**
//     * Example 10: Multiple filters with mixed AND/OR
//     * Use: Find ACTIVE students with name like "John" OR "Jane" in classroom A in year 2024
//     */
//    public void exampleMixedLogic() {
//        /*
//        SpecificationBuilder<Student> builder = new SpecificationBuilder<>();
//        builder.with("status", SearchOperation.EQUAL, "ACTIVE");           // AND
//        builder.with("fullName", SearchOperation.LIKE, "John");            // AND
//        builder.withOr("fullName", SearchOperation.LIKE, "Jane");          // OR
//        builder.with("schoolClassId", SearchOperation.EQUAL, classIdA);    // AND
//        builder.with("academicYear", SearchOperation.EQUAL, 2024);         // AND
//
//        Specification<Student> spec = builder.build();
//        */
//    }
//
//    /**
//     * ========== DATE RANGE FILTERS ==========
//     */
//
//    /**
//     * Example 11: Date range filter (e.g., students created in date range)
//     * Use:
//     * new SpecificationBuilder<Student>()
//     *      .with("createdAt", SearchOperation.BETWEEN, dateFrom, dateTo)
//     *      .build()
//     */
//    public void exampleDateRange() {
//        /*
//        LocalDate dateFrom = LocalDate.of(2024, 1, 1);
//        LocalDate dateTo = LocalDate.of(2024, 12, 31);
//
//        Specification<Student> spec = new SpecificationBuilder<Student>()
//            .with("createdAt", SearchOperation.BETWEEN, dateFrom, dateTo)
//            .build();
//        */
//    }
//
//    /**
//     * ========== IN CLAUSE - Multiple Values ==========
//     */
//
//    /**
//     * Example 12: Filter by multiple statuses
//     * Use: Find students with status ACTIVE OR INACTIVE (using IN)
//     */
//    public void exampleInClause() {
//        /*
//        Specification<Student> spec = new BaseSpecification<>(
//            new FilterCriteria("status", SearchOperation.IN, Arrays.asList("ACTIVE", "INACTIVE"))
//        );
//
//        Page<Student> results = studentRepository.findAll(spec, pageable);
//        */
//    }
//
//    /**
//     * Example 13: Filter by multiple class IDs
//     */
//    public void exampleInClauseWithIds() {
//        /*
//        List<UUID> classIds = Arrays.asList(classId1, classId2, classId3);
//        Specification<Student> spec = new BaseSpecification<>(
//            new FilterCriteria("schoolClassId", SearchOperation.IN, classIds)
//        );
//
//        Page<Student> results = studentRepository.findAll(spec, pageable);
//        */
//    }
//
//    /**
//     * ========== PAGINATION WITH SPECIFICATIONS ==========
//     */
//
//    /**
//     * Example 14: Paginated search results
//     * Use: Search with pagination
//     */
//    public void exampleWithPagination() {
//        /*
//        Specification<Student> spec = BaseSpecification.like("fullName", "John");
//        Pageable pageable = PageRequest.of(0, 20); // Page 0, 20 items per page
//
//        Page<Student> results = studentRepository.findAll(spec, pageable);
//        // Provides: total, page number, size, hasNext, hasPrevious, etc.
//        */
//    }
//
//    /**
//     * ========== REAL-WORLD SCENARIOS ==========
//     */
//
//    /**
//     * Scenario 1: Student Management API Filter
//     * GET /api/students?name=John&class=A&year=2024&status=ACTIVE
//     */
//    public void studentFilterScenario() {
//        /*
//        public Page<Student> searchStudents(
//                String name,
//                UUID classId,
//                Integer year,
//                String status,
//                Pageable pageable) {
//
//            SpecificationBuilder<Student> builder = new SpecificationBuilder<>();
//
//            if (name != null && !name.isEmpty()) {
//                builder.with("fullName", SearchOperation.LIKE, name);
//            }
//            if (classId != null) {
//                builder.with("schoolClassId", SearchOperation.EQUAL, classId);
//            }
//            if (year != null) {
//                builder.with("academicYear", SearchOperation.EQUAL, year);
//            }
//            if (status != null && !status.isEmpty()) {
//                builder.with("status", SearchOperation.EQUAL, status);
//            }
//            // Exclude deleted students
//            builder.with("deletedAt", SearchOperation.IS_NULL, null);
//
//            Specification<Student> spec = builder.build();
//            return studentRepository.findAll(spec, pageable);
//        }
//        */
//    }
//
//    /**
//     * Scenario 2: Class Roster Filter
//     * GET /api/classes/{id}/students?status=ACTIVE&academicYear=2024
//     */
//    public void classRosterScenario() {
//        /*
//        public Page<Student> getClassRoster(
//                UUID classId,
//                String status,
//                Integer year,
//                Pageable pageable) {
//
//            SpecificationBuilder<Student> builder = new SpecificationBuilder<>();
//            builder.with("schoolClassId", SearchOperation.EQUAL, classId);
//            builder.with("academicYear", SearchOperation.EQUAL, year);
//
//            if (status != null) {
//                builder.with("status", SearchOperation.EQUAL, status);
//            }
//            builder.with("deletedAt", SearchOperation.IS_NULL, null);
//
//            return studentRepository.findAll(builder.build(), pageable);
//        }
//        */
//    }
//
//    /**
//     * Scenario 3: Academic Report - Filter by multiple conditions
//     * Get students for academic ranking: grade A, in year 2024, not deleted
//     */
//    public void academicReportScenario() {
//        /*
//        public List<Student> getTopStudents(Integer year) {
//            SpecificationBuilder<Student> builder = new SpecificationBuilder<>();
//            builder.with("academicYear", SearchOperation.EQUAL, year);
//            builder.with("status", SearchOperation.EQUAL, "ACTIVE");
//            builder.with("deletedAt", SearchOperation.IS_NULL, null);
//
//            return studentRepository.findAll(builder.build());
//        }
//        */
//    }
//
//    /**
//     * ========== KEY FEATURES ==========
//     *
//     * ✅ Type-safe: Supports UUID, Integer, Long, Double, Float, Boolean, LocalDate, LocalDateTime, OffsetDateTime, String
//     * ✅ 12 Operation Types: EQUAL, NOT_EQUAL, GT, GTE, LT, LTE, LIKE, IN, BETWEEN, IS_NULL, IS_NOT_NULL
//     * ✅ Case-insensitive search: LIKE operation automatically converts to lowercase
//     * ✅ Flexible: Use directly or with SpecificationBuilder
//     * ✅ Composable: AND/OR logic via SpecificationBuilder
//     * ✅ Factory Methods: Easy-to-use static methods (equal, like, in, between, etc.)
//     * ✅ Reusable: Single BaseSpecification class for all entities
//     * ✅ Soft-delete aware: Use isNull("deletedAt") to filter active records
//     *
//     * ========== PERFORMANCE NOTES ==========
//     *
//     * • Use pagination for large result sets (Page<T> not List<T>)
//     * • Index frequently filtered columns in database (name, status, academicYear, etc.)
//     * • Prefer IN clause over multiple OR conditions for multiple values
//     * • Use IS_NULL for soft-delete checks instead of EQUAL checks
//     */
//}
