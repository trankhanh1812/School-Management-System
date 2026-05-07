package com.school.school_management.enums;

/**
 * StudentStatus - Status của học sinh trong hệ thống
 * 
 * ACTIVE: Đang theo học
 * INACTIVE: Không active (tạm ngưng)
 * SUSPENDED: Bị đình chỉ
 * GRADUATED: Đã tốt nghiệp
 * DROPPED: Bỏ học
 * TRANSFERRED: Chuyển trường
 */
public enum StudentStatus {
    ACTIVE("Đang học"),
    INACTIVE("Không active"),
    SUSPENDED("Bị đình chỉ"),
    GRADUATED("Tốt nghiệp"),
    DROPPED("Bỏ học"),
    TRANSFERRED("Chuyển trường");

    private final String displayName;

    StudentStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    public static StudentStatus fromString(String value) {
        if (value == null || value.isEmpty()) {
            return ACTIVE;
        }
        try {
            return StudentStatus.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ACTIVE;
        }
    }

    public boolean isActive() {
        return this == ACTIVE;
    }

    public boolean isTerminated() {
        return this == GRADUATED || this == DROPPED || this == TRANSFERRED;
    }
}
