package com.school.school_management.enums;

/**
 * RequestStatus - Trạng thái yêu cầu (xin phép, khiếu nại, điều chỉnh điểm, v.v.)
 * 
 * PENDING: Chờ xết duyệt
 * APPROVED: Được phê duyệt
 * REJECTED: Bị từ chối
 * CANCELLED: Bị hủy bỏ
 */
public enum RequestStatus {
    PENDING("Chờ xét duyệt", 0),
    APPROVED("Được phê duyệt", 1),
    REJECTED("Bị từ chối", -1),
    CANCELLED("Bị hủy bỏ", 0);

    private final String displayName;
    private final int statusCode;

    RequestStatus(String displayName, int statusCode) {
        this.displayName = displayName;
        this.statusCode = statusCode;
    }

    public String getDisplayName() {
        return displayName;
    }

    public int getStatusCode() {
        return statusCode;
    }

    public static RequestStatus fromString(String value) {
        if (value == null || value.isEmpty()) {
            return PENDING;
        }
        try {
            return RequestStatus.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            return PENDING;
        }
    }

    public boolean isFinalized() {
        return this == APPROVED || this == REJECTED || this == CANCELLED;
    }

    public boolean isPending() {
        return this == PENDING;
    }

    public boolean isApproved() {
        return this == APPROVED;
    }
}
