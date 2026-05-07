package com.school.school_management.enums;

/**
 * NotificationType - Loại thông báo trong hệ thống
 * 
 * SCORE_UPDATE: Cập nhật điểm
 * ATTENDANCE: Điểm danh
 * SCHEDULE_CHANGE: Thay đổi lịch học
 * EVENT: Sự kiện trường học
 * ANNOUNCEMENT: Thông báo chung
 * SYSTEM: Thông báo hệ thống
 */
public enum NotificationType {
    SCORE_UPDATE("Cập nhật điểm", "score"),
    ATTENDANCE("Điểm danh", "attendance"),
    SCHEDULE_CHANGE("Thay đổi lịch học", "schedule"),
    EVENT("Sự kiện trường học", "event"),
    ANNOUNCEMENT("Thông báo chung", "announcement"),
    SYSTEM("Thông báo hệ thống", "system");

    private final String displayName;
    private final String icon;  // Icon type cho UI

    NotificationType(String displayName, String icon) {
        this.displayName = displayName;
        this.icon = icon;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getIcon() {
        return icon;
    }

    public static NotificationType fromString(String value) {
        if (value == null || value.isEmpty()) {
            return ANNOUNCEMENT;
        }
        try {
            return NotificationType.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ANNOUNCEMENT;
        }
    }

    public boolean isUrgent() {
        return this == SCORE_UPDATE || this == ATTENDANCE;
    }
}
