//package com.school.school_management.examples;
//
//import com.school.school_management.dto.ApiResponse;
//import com.school.school_management.entity.Student;
//import com.school.school_management.response.PaginationResponse;
//import com.school.school_management.util.SoftDeleteHelper;
//import org.springframework.data.domain.Page;
//import org.springframework.data.domain.PageRequest;
//import org.springframework.data.domain.Pageable;
//
//import java.util.List;
//import java.util.UUID;
//
///**
// * PaginationAndSoftDeleteExamples - Demonstrates usage patterns for PaginationResponse & SoftDeleteHelper.
// *
// * Two core utilities for standard operations:
// * 1. PaginationResponse - Wraps Spring Data Page into standard pagination response
// * 2. SoftDeleteHelper - Manages soft-delete operations (mark/restore/check)
// */
//public class PaginationAndSoftDeleteExamples {
//
//    /**
//     * ========== PAGINATION RESPONSE EXAMPLES ==========
//     */
//
//    /**
//     * Example 1: Simple paginated list response
//     * Convert Page<Student> to PaginationResponse for API return
//     */
//    public PaginationResponse<Student> getStudentsPaginated() {
//        /*
//        Pageable pageable = PageRequest.of(0, 20); // First page, 20 items
//        Page<Student> page = studentRepository.findAll(pageable);
//
//        // Simple usage - returns PaginationResponse with metadata
//        return PaginationResponse.of(page, "Students retrieved successfully");
//        */
//        return null;
//    }
//
//    /**
//     * Example 2: Paginated search with specification
//     * Search students with pagination
//     */
//    public PaginationResponse<Student> searchStudents(String name, int pageNumber) {
//        /*
//        Pageable pageable = PageRequest.of(pageNumber, 20);
//        Specification<Student> spec = BaseSpecification.like("fullName", name);
//        Page<Student> page = studentRepository.findAll(spec, pageable);
//
//        // Custom message
//        return PaginationResponse.of(page, "Search results for: " + name);
//        */
//        return null;
//    }
//
//    /**
//     * Example 3: Filter active (non-deleted) students with pagination
//     * Exclude soft-deleted records from results
//     */
//    public PaginationResponse<Student> getActiveStudents(int pageNumber) {
//        /*
//        Pageable pageable = PageRequest.of(pageNumber, 20);
//
//        // Build specification: find only active students
//        Specification<Student> spec = BaseSpecification.isNull("deletedAt");
//        Page<Student> page = studentRepository.findAll(spec, pageable);
//
//        return PaginationResponse.of(page, "Active students retrieved");
//        */
//        return null;
//    }
//
//    /**
//     * Example 4: Complex filter + pagination
//     * Multiple conditions with pagination
//     */
//    public PaginationResponse<Student> filterStudents(
//            String name,
//            UUID classId,
//            Integer year,
//            String status,
//            int pageNumber) {
//        /*
//        Pageable pageable = PageRequest.of(pageNumber, 20);
//
//        SpecificationBuilder<Student> builder = new SpecificationBuilder<>();
//        if (name != null) {
//            builder.with("fullName", SearchOperation.LIKE, name);
//        }
//        if (classId != null) {
//            builder.with("schoolClassId", SearchOperation.EQUAL, classId);
//        }
//        if (year != null) {
//            builder.with("academicYear", SearchOperation.EQUAL, year);
//        }
//        if (status != null) {
//            builder.with("status", SearchOperation.EQUAL, status);
//        }
//        // Always filter out deleted
//        builder.with("deletedAt", SearchOperation.IS_NULL, null);
//
//        Page<Student> page = studentRepository.findAll(builder.build(), pageable);
//        return PaginationResponse.of(page, "Filtered students retrieved");
//        */
//        return null;
//    }
//
//    /**
//     * Example 5: Access pagination metadata in response
//     * Use helper methods to get pagination info
//     */
//    public void accessPaginationMetadata(PaginationResponse<Student> response) {
//        /*
//        // Access data
//        List<Student> students = response.getData();
//
//        // Access pagination info
//        PaginationResponse.PaginationInfo pagination = response.getPagination();
//        int currentPage = pagination.getCurrentPage();
//        int pageSize = pagination.getPageSize();
//        long totalElements = pagination.getTotalElements();
//        int totalPages = pagination.getTotalPages();
//        boolean hasNext = pagination.isHasNext();
//        boolean hasPrevious = pagination.isHasPrevious();
//
//        // Use helper methods
//        Integer nextPage = response.getNextPage();      // null if last page
//        Integer previousPage = response.getPreviousPage(); // null if first page
//
//        // Example: Handle pagination in UI
//        if (response.getNextPage() != null) {
//            System.out.println("Next page available: " + response.getNextPage());
//        }
//        */
//    }
//
//    /**
//     * ========== SOFT DELETE HELPER EXAMPLES ==========
//     */
//
//    /**
//     * Example 6: Mark a student as deleted (soft-delete)
//     * Sets deletedAt, deletedBy, and updates updatedAt
//     */
//    public void softDeleteStudent(UUID studentId, UUID userId) {
//        /*
//        Student student = studentRepository.findById(studentId).orElseThrow();
//
//        // Mark as deleted
//        SoftDeleteHelper.markDeleted(student, userId);
//
//        // Save changes to database
//        studentRepository.save(student);
//        */
//    }
//
//    /**
//     * Example 7: Restore a soft-deleted student
//     * Clears deletedAt, deletedBy, updates updatedAt
//     */
//    public void restoreStudent(UUID studentId) {
//        /*
//        Student student = studentRepository.findById(studentId).orElseThrow();
//
//        // Restore from soft-delete
//        SoftDeleteHelper.restore(student);
//
//        // Save changes
//        studentRepository.save(student);
//        */
//    }
//
//    /**
//     * Example 8: Check if student is deleted
//     * Simple true/false check for deletion status
//     */
//    public void checkDeleteStatus(Student student) {
//        /*
//        boolean isDeleted = SoftDeleteHelper.isDeleted(student);       // true if deleted
//        boolean isActive = SoftDeleteHelper.isActive(student);         // true if active
//
//        if (SoftDeleteHelper.isDeleted(student)) {
//            System.out.println("Student is deleted");
//        } else {
//            System.out.println("Student is active");
//        }
//        */
//    }
//
//    /**
//     * Example 9: Batch mark students as deleted
//     * Mark multiple students at once
//     */
//    public void batchDeleteStudents(List<Student> students, UUID userId) {
//        /*
//        // Mark all students as deleted
//        List<Student> markedStudents = SoftDeleteHelper.markDeletedBatch(students, userId);
//
//        // Save all in batch
//        studentRepository.saveAll(markedStudents);
//        */
//    }
//
//    /**
//     * Example 10: Batch restore students
//     * Restore multiple soft-deleted students
//     */
//    public void batchRestoreStudents(List<Student> deletedStudents) {
//        /*
//        // Restore all students
//        List<Student> restoredStudents = SoftDeleteHelper.restoreBatch(deletedStudents);
//
//        // Save all in batch
//        studentRepository.saveAll(restoredStudents);
//        */
//    }
//
//    /**
//     * Example 11: Filter active students from mixed list
//     * Separate active from deleted in a collection
//     */
//    public void filterActivesAndDeleted(List<Student> allStudents) {
//        /*
//        // Get only active students
//        List<Student> activeStudents = SoftDeleteHelper.filterActive(allStudents);
//
//        // Get only deleted students
//        List<Student> deletedStudents = SoftDeleteHelper.filterDeleted(allStudents);
//
//        System.out.println("Active: " + activeStudents.size());
//        System.out.println("Deleted: " + deletedStudents.size());
//        */
//    }
//
//    /**
//     * Example 12: Get deletion info
//     * Who deleted and when
//     */
//    public void getDeletionDetails(Student student) {
//        /*
//        String deletionInfo = SoftDeleteHelper.getDeletionInfo(student);
//        if (deletionInfo != null) {
//            System.out.println(deletionInfo);
//            // Output: "Deleted at: 2026-03-18T10:30:00+07:00, Deleted by: uuid-here"
//        } else {
//            System.out.println("Student is not deleted");
//        }
//        */
//    }
//
//    /**
//     * Example 13: Check who deleted the student
//     * Verify if specific user deleted the record
//     */
//    public void checkDeletedBy(Student student, UUID userId) {
//        /*
//        if (SoftDeleteHelper.isDeletedBy(student, userId)) {
//            System.out.println("This user deleted this student");
//        } else {
//            System.out.println("This user did not delete this student");
//        }
//        */
//    }
//
//    /**
//     * Example 14: Days since deletion
//     * Calculate how long ago record was deleted
//     */
//    public void checkDaysSinceDeletion(Student student) {
//        /*
//        long days = SoftDeleteHelper.daysSinceDeletion(student);
//
//        if (days == 0) {
//            System.out.println("Student is not deleted");
//        } else if (days > 30) {
//            System.out.println("Student deleted more than 30 days ago");
//            // Could trigger permanent deletion
//        } else {
//            System.out.println("Student deleted " + days + " days ago");
//        }
//        */
//    }
//
//    /**
//     * ========== COMBINED PATTERNS ==========
//     */
//
//    /**
//     * Example 15: Real API endpoint - List active students with pagination
//     * Combines PaginationResponse + soft-delete filtering
//     */
//    public PaginationResponse<Student> listActiveStudents(
//            UUID classId,
//            Integer academicYear,
//            int pageNumber,
//            int pageSize) {
//        /*
//        // Build pageable
//        Pageable pageable = PageRequest.of(pageNumber, pageSize);
//
//        // Build specification with soft-delete check
//        SpecificationBuilder<Student> builder = new SpecificationBuilder<>();
//        builder.with("deletedAt", SearchOperation.IS_NULL, null);  // Active only
//
//        if (classId != null) {
//            builder.with("schoolClassId", SearchOperation.EQUAL, classId);
//        }
//        if (academicYear != null) {
//            builder.with("academicYear", SearchOperation.EQUAL, academicYear);
//        }
//
//        // Fetch and wrap in PaginationResponse
//        Page<Student> page = studentRepository.findAll(builder.build(), pageable);
//        return PaginationResponse.of(page, "Active students in class");
//        */
//        return null;
//    }
//
//    /**
//     * Example 16: Real API endpoint - Delete student (soft-delete)
//     * Mark student as deleted and return updated state
//     */
//    public ApiResponse<Student> deleteStudent(UUID studentId, UUID userId) {
//        /*
//        Student student = studentRepository.findById(studentId)
//            .orElseThrow(() -> new EntityNotFoundException("Student not found"));
//
//        // Mark as deleted
//        SoftDeleteHelper.markDeleted(student, userId);
//
//        // Save to database
//        Student deleted = studentRepository.save(student);
//
//        // Return response with deletion info
//        return ApiResponse.of(
//            deleted,
//            "Student deleted successfully. Deletion info: " +
//            SoftDeleteHelper.getDeletionInfo(deleted),
//            200
//        );
//        */
//        return null;
//    }
//
//    /**
//     * Example 17: Real API endpoint - Restore student
//     * Undo soft-delete and return restored state
//     */
//    public ApiResponse<Student> restoreStudent(UUID studentId) {
//        /*
//        Student student = studentRepository.findById(studentId)
//            .orElseThrow(() -> new EntityNotFoundException("Student not found"));
//
//        if (!SoftDeleteHelper.isDeleted(student)) {
//            throw new CustomException("Student is not deleted", 400);
//        }
//
//        // Restore
//        SoftDeleteHelper.restore(student);
//
//        // Save to database
//        Student restored = studentRepository.save(student);
//
//        return ApiResponse.of(restored, "Student restored successfully", 200);
//        */
//        return null;
//    }
//
//    /**
//     * Example 18: Cleanup job - Permanently delete very old soft-deleted records
//     * Called by a scheduled task to clean up records deleted long ago
//     */
//    public void cleanupOldDeletedRecords(int daysThreshold) {
//        /*
//        // Find all deleted students
//        Specification<Student> spec = BaseSpecification.isNotNull("deletedAt");
//        List<Student> deletedStudents = studentRepository.findAll(spec);
//
//        // Filter those older than threshold
//        List<Student> toDelete = deletedStudents.stream()
//            .filter(s -> SoftDeleteHelper.daysSinceDeletion(s) > daysThreshold)
//            .collect(Collectors.toList());
//
//        // Permanently delete from database
//        studentRepository.deleteAll(toDelete);
//
//        System.out.println("Permanently deleted " + toDelete.size() + " old records");
//        */
//    }
//
//    /**
//     * ========== KEY FEATURES SUMMARY ==========
//     *
//     * PaginationResponse:
//     * ✅ Wraps Spring Data Page<T> into standard response format
//     * ✅ Includes pagination metadata (currentPage, pageSize, totalElements, totalPages, etc.)
//     * ✅ Factory methods: of(page), of(page, message), error(message, status)
//     * ✅ Helper methods: getNextPage(), getPreviousPage()
//     * ✅ JSON-friendly with @JsonProperty annotations
//     *
//     * SoftDeleteHelper:
//     * ✅ Mark single/batch entities as deleted
//     * ✅ Restore single/batch entities
//     * ✅ Check deletion status: isDeleted(), isActive()
//     * ✅ Filter active/deleted entities from collections
//     * ✅ Get deletion metadata: who deleted, when deleted
//     * ✅ Calculate days since deletion
//     * ✅ Check if deleted by specific user
//     *
//     * ========== USAGE PATTERNS ==========
//     *
//     * Pattern 1: Simple list
//     * -> PaginationResponse.of(page)
//     *
//     * Pattern 2: Filtered list with soft-delete
//     * -> builder.with("deletedAt", IS_NULL, null)
//     * -> PaginationResponse.of(page)
//     *
//     * Pattern 3: Soft-delete single record
//     * -> SoftDeleteHelper.markDeleted(entity, userId)
//     * -> repository.save(entity)
//     *
//     * Pattern 4: Batch delete
//     * -> SoftDeleteHelper.markDeletedBatch(list, userId)
//     * -> repository.saveAll(list)
//     *
//     * Pattern 5: Permanent delete (cleanup)
//     * -> Filter by daysSinceDeletion > threshold
//     * -> repository.deleteAll(toDelete)
//     */
//}
