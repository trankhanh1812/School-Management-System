package com.school.school_management.dto;

import java.time.OffsetDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse<T> {

    private T data;
    private String message;
    private int status;
    private OffsetDateTime timestamp;

    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder()
                .data(data)
                .message("success")
                .status(200)
                .timestamp(OffsetDateTime.now())
                .build();
    }

    public static <T> ApiResponse<T> success(T data, String message) {
        return ApiResponse.<T>builder()
                .data(data)
                .message(message)
                .status(200)
                .timestamp(OffsetDateTime.now())
                .build();
    }

    public static <T> ApiResponse<T> of(T data, String message, int status) {
        return ApiResponse.<T>builder()
                .data(data)
                .message(message)
                .status(status)
                .timestamp(OffsetDateTime.now())
                .build();
    }

    public static <T> ApiResponse<T> error(String message, int status) {
        return ApiResponse.<T>builder()
                .data(null)
                .message(message)
                .status(status)
                .timestamp(OffsetDateTime.now())
                .build();
    }
}
