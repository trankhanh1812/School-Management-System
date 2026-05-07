package com.school.school_management.enums;

/**
 * PromotionStatus - Trạng thái nâng lớp/lên lớp
 * 
 * PROMOTED: Được lên lớp
 * RETAINED: Ở lại (học lại)
 * TRANSFERRED: Chuyển trường
 * GRADUATED: Hoàn thành chương trình
 * PENDING: Chờ quyết định
 */
public enum PromotionStatus {
    PROMOTED("Được lên lớp", 1),
    RETAINED("Học lại", 0),
    TRANSFERRED("Chuyển trường", 1),
    GRADUATED("Hoàn thành chương trình", 1),
    PENDING("Chờ quyết định", 0);

    private final String displayName;
    private final int progressValue;  // 1 = tiếp tục, 0 = ở lại

    PromotionStatus(String displayName, int progressValue) {
        this.displayName = displayName;
        this.progressValue = progressValue;
    }

    public String getDisplayName() {
        return displayName;
    }

    public int getProgressValue() {
        return progressValue;
    }

    public static PromotionStatus fromString(String value) {
        if (value == null || value.isEmpty()) {
            return PENDING;
        }
        try {
            return PromotionStatus.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            return PENDING;
        }
    }

    public boolean isProgression() {
        return progressValue == 1;
    }

    public boolean isRetention() {
        return this == RETAINED;
    }

    public boolean isFinal() {
        return this == GRADUATED || this == TRANSFERRED;
    }
}
