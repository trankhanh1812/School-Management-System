package com.school.school_management.enums;

/**
 * AttendanceStatus - Trạng thái điểm danh
 * 
 * PRESENT: Có mặt
 * ABSENT: Vắng mặt
 * LATE: Đi muộn
 * EXCUSED: Vắng có phép
 */
public enum AttendanceStatus {
    PRESENT("Có mặt", 1),
    ABSENT("Vắng mặt", 0),
    LATE("Đi muộn", 0.5),
    EXCUSED("Vắng có phép", 1);

    private final String displayName;
    private final double attendanceScore;  // Điểm tính cho học bạ

    AttendanceStatus(String displayName, double attendanceScore) {
        this.displayName = displayName;
        this.attendanceScore = attendanceScore;
    }

    public String getDisplayName() {
        return displayName;
    }

    public double getAttendanceScore() {
        return attendanceScore;
    }

    public static AttendanceStatus fromString(String value) {
        if (value == null || value.isEmpty()) {
            return PRESENT;
        }
        try {
            return AttendanceStatus.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            return PRESENT;
        }
    }

    public boolean isAbsent() {
        return this == ABSENT;
    }

    public boolean isPresentOrExcused() {
        return this == PRESENT || this == EXCUSED;
    }
}
