package com.school.school_management.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.school.school_management.util.DateTimeUtil;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Page;

import java.util.List;

/**
 * PaginationResponse - Reusable paginated response wrapper.
 * 
 * Wraps Spring Data Page<T> into a clean, standard pagination response format.
 * 
 * Example response:
 * {
 *   "data": [...],
 *   "pagination": {
 *     "currentPage": 0,
 *     "pageSize": 20,
 *     "totalElements": 150,
 *     "totalPages": 8,
 *     "isFirstPage": true,
 *     "isLastPage": false,
 *     "hasNext": true,
 *     "hasPrevious": false
 *   },
 *   "message": "Students retrieved successfully",
 *   "status": 200,
 *   "timestamp": "2026-03-18T10:30:00+07:00"
 * }
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaginationResponse<T> {
    
    private List<T> data;
    private PaginationInfo pagination;
    private String message;
    private int status;
    private String timestamp;
    
    /**
     * Inner class for pagination metadata
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PaginationInfo {
        
        @JsonProperty("currentPage")
        private int currentPage;  // 0-indexed
        
        @JsonProperty("pageSize")
        private int pageSize;
        
        @JsonProperty("totalElements")
        private long totalElements;
        
        @JsonProperty("totalPages")
        private int totalPages;
        
        @JsonProperty("isFirstPage")
        private boolean firstPage;
        
        @JsonProperty("isLastPage")
        private boolean lastPage;
        
        @JsonProperty("hasNext")
        private boolean hasNext;
        
        @JsonProperty("hasPrevious")
        private boolean hasPrevious;
    }
    
    /**
     * Factory method to create PaginationResponse from Spring Data Page
     * 
     * Usage:
     * Page<Student> page = studentRepository.findAll(spec, pageable);
     * return PaginationResponse.of(page, "Students retrieved successfully");
     */
    public static <T> PaginationResponse<T> of(Page<T> page, String message) {
        PaginationInfo pagination = PaginationInfo.builder()
            .currentPage(page.getNumber())
            .pageSize(page.getSize())
            .totalElements(page.getTotalElements())
            .totalPages(page.getTotalPages())
            .firstPage(page.isFirst())
            .lastPage(page.isLast())
            .hasNext(page.hasNext())
            .hasPrevious(page.hasPrevious())
            .build();
        
        return PaginationResponse.<T>builder()
            .data(page.getContent())
            .pagination(pagination)
            .message(message)
            .status(200)
            .timestamp(DateTimeUtil.nowUtc().toString())
            .build();
    }
    
    /**
     * Factory method with default message
     */
    public static <T> PaginationResponse<T> of(Page<T> page) {
        return of(page, "Data retrieved successfully");
    }
    
    /**
     * Factory method for error pagination response
     */
    public static <T> PaginationResponse<T> error(String message, int status) {
        return PaginationResponse.<T>builder()
            .data(null)
            .pagination(null)
            .message(message)
            .status(status)
            .timestamp(DateTimeUtil.nowUtc().toString())
            .build();
    }
    
    /**
     * Helper method: Get next page number if available
     */
    public Integer getNextPage() {
        if (pagination != null && pagination.hasNext) {
            return pagination.currentPage + 1;
        }
        return null;
    }
    
    /**
     * Helper method: Get previous page number if available
     */
    public Integer getPreviousPage() {
        if (pagination != null && pagination.hasPrevious) {
            return pagination.currentPage - 1;
        }
        return null;
    }
}
