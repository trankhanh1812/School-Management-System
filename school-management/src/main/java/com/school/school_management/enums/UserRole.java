package com.school.school_management.enums;

/**
 * UserRole - Role/vai trò của người dùng trong hệ thống
 * 
 * ADMIN: Quản trị viên (toàn quyền)
 * TEACHER: Giáo viên
 * STUDENT: Học sinh
 * PARENT: Phụ huynh
 * STAFF: Nhân viên (quản lý tổng quát)
 */
public enum UserRole {
    ADMIN("Quản trị viên", 1),
    TEACHER("Giáo viên", 2),
    STUDENT("Học sinh", 3),
    PARENT("Phụ huynh", 4),
    STAFF("Nhân viên", 5);

    private final String displayName;
    private final int priority;  // Cao = quyền hạn lớn

    UserRole(String displayName, int priority) {
        this.displayName = displayName;
        this.priority = priority;
    }

    public String getDisplayName() {
        return displayName;
    }

    public int getPriority() {
        return priority;
    }

    public static UserRole fromString(String value) {
        if (value == null || value.isEmpty()) {
            return STUDENT;
        }
        try {
            return UserRole.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            return STUDENT;
        }
    }

    public boolean isAdmin() {
        return this == ADMIN;
    }

    public boolean isTeacher() {
        return this == TEACHER;
    }

    public boolean isStudent() {
        return this == STUDENT;
    }

    public boolean isParent() {
        return this == PARENT;
    }

    public boolean isStaff() {
        return this == STAFF;
    }

    /**
     * Check if this role has higher priority (more permissions)
     */
    public boolean hasHigherPriorityThan(UserRole other) {
        return this.priority < other.priority;
    }
}
