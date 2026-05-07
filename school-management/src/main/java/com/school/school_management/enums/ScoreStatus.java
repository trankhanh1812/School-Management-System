package com.school.school_management.enums;

/**
 * ScoreStatus - Trạng thái điểm/bài kiểm tra
 * 
 * PENDING: Chưa chấm
 * APPROVED: Đã phê duyệt
 * REJECTED: Bị từ chối (cần chấm lại)
 * SUBMITTED: Đã nộp
 * ABSENT: Vắng thi
 */
public enum ScoreStatus {
    PENDING("Chưa chấm", 0),
    APPROVED("Đã phê duyệt", 2),
    REJECTED("Cần chấm lại", 1),
    SUBMITTED("Đã nộp", 1),
    ABSENT("Vắng thi", 0);

    private final String displayName;
    private final int priority;

    ScoreStatus(String displayName, int priority) {
        this.displayName = displayName;
        this.priority = priority;
    }

    public String getDisplayName() {
        return displayName;
    }

    public int getPriority() {
        return priority;
    }

    public static ScoreStatus fromString(String value) {
        if (value == null || value.isEmpty()) {
            return PENDING;
        }
        try {
            return ScoreStatus.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            return PENDING;
        }
    }

    public boolean isFinalized() {
        return this == APPROVED || this == ABSENT;
    }

    public boolean needsGrading() {
        return this == PENDING || this == REJECTED || this == SUBMITTED;
    }
}
