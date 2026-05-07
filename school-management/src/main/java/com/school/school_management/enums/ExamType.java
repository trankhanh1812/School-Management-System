package com.school.school_management.enums;

/**
 * ExamType - Loại đầu điểm theo nghiệp vụ VN.
 * Nhóm tính trung bình: ORAL, QUIZ_15, ONE_PERIOD, MIDTERM, FINAL.
 * Nhóm khảo sát: SURVEY (không tính trung bình chính thức).
 */
public enum ExamType {
    ORAL("Điểm miệng", 10, 1.0, true),
    QUIZ_15("Kiểm tra 15 phút", 15, 1.0, true),
    ONE_PERIOD("Kiểm tra 1 tiết", 45, 2.0, true),
    MIDTERM("Kiểm tra giữa kỳ", 60, 3.0, true),
    FINAL("Kiểm tra cuối kỳ", 90, 3.0, true),
    SURVEY("Khảo sát", 60, 0.0, false);

    private final String displayName;
    private final int durationMinutes;
    private final double weight;
    private final boolean weighted;

    ExamType(String displayName, int durationMinutes, double weight, boolean weighted) {
        this.displayName = displayName;
        this.durationMinutes = durationMinutes;
        this.weight = weight;
        this.weighted = weighted;
    }

    public String getDisplayName() {
        return displayName;
    }

    public int getDurationMinutes() {
        return durationMinutes;
    }

    public double getWeight() {
        return weight;
    }

    public boolean isWeighted() {
        return weighted;
    }

    public static ExamType fromString(String value) {
        if (value == null || value.isEmpty()) {
            return FINAL;
        }

        String normalized = value.trim().toUpperCase();
        if ("QUIZ".equals(normalized)) {
            return QUIZ_15;
        }
        if ("PRACTICE".equals(normalized) || "DIAGNOSTIC".equals(normalized)) {
            return SURVEY;
        }

        try {
            return ExamType.valueOf(normalized);
        } catch (IllegalArgumentException e) {
            return FINAL;
        }
    }

    public boolean isHighStakes() {
        return this == MIDTERM || this == FINAL;
    }

    public boolean isGraded() {
        return weighted;
    }
}
