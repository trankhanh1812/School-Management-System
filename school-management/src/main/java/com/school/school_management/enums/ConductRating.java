package com.school.school_management.enums;

/**
 * ConductRating - Xếp loại hạnh kiểm
 * 
 * EXCELLENT: Xuất sắc
 * GOOD: Tốt
 * AVERAGE: Trung bình
 * POOR: Yếu
 * VERY_POOR: Rất yếu
 */
public enum ConductRating {
    EXCELLENT("Xuất sắc", 5, 95),
    GOOD("Tốt", 4, 80),
    AVERAGE("Trung bình", 3, 65),
    POOR("Yếu", 2, 50),
    VERY_POOR("Rất yếu", 1, 0);

    private final String displayName;
    private final int score;      // Điểm hạnh kiểm
    private final int minThreshold;  // Ngưỡng tối thiểu

    ConductRating(String displayName, int score, int minThreshold) {
        this.displayName = displayName;
        this.score = score;
        this.minThreshold = minThreshold;
    }

    public String getDisplayName() {
        return displayName;
    }

    public int getScore() {
        return score;
    }

    public int getMinThreshold() {
        return minThreshold;
    }

    public static ConductRating fromString(String value) {
        if (value == null || value.isEmpty()) {
            return AVERAGE;
        }
        try {
            return ConductRating.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            return AVERAGE;
        }
    }

    public static ConductRating fromScore(int score) {
        if (score >= 95) return EXCELLENT;
        if (score >= 80) return GOOD;
        if (score >= 65) return AVERAGE;
        if (score >= 50) return POOR;
        return VERY_POOR;
    }

    public boolean isGood() {
        return this == EXCELLENT || this == GOOD;
    }

    public boolean isPoor() {
        return this == POOR || this == VERY_POOR;
    }
}
