package com.school.school_management.enums;

/**
 * ImportStatus - Trạng thái import dữ liệu
 * 
 * PENDING: Chờ xử lý
 * PROCESSING: Đang xử lý
 * SUCCESS: Thành công
 * FAILED: Thất bại
 * PARTIAL: Thành công một phần (có lỗi)
 * CANCELLED: Bị hủy bỏ
 */
public enum ImportStatus {
    PENDING("Chờ xử lý", 0),
    PROCESSING("Đang xử lý", 1),
    SUCCESS("Thành công", 2),
    FAILED("Thất bại", -1),
    PARTIAL("Thành công một phần", 3),
    CANCELLED("Bị hủy bỏ", 0);

    private final String displayName;
    private final int statusCode;

    ImportStatus(String displayName, int statusCode) {
        this.displayName = displayName;
        this.statusCode = statusCode;
    }

    public String getDisplayName() {
        return displayName;
    }

    public int getStatusCode() {
        return statusCode;
    }

    public static ImportStatus fromString(String value) {
        if (value == null || value.isEmpty()) {
            return PENDING;
        }
        try {
            return ImportStatus.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            return PENDING;
        }
    }

    public boolean isCompleted() {
        return this == SUCCESS || this == FAILED || this == PARTIAL || this == CANCELLED;
    }

    public boolean isInProgress() {
        return this == PENDING || this == PROCESSING;
    }

    public boolean isSuccessful() {
        return this == SUCCESS || this == PARTIAL;
    }
}
