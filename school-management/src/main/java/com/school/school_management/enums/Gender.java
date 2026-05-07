package com.school.school_management.enums;

/**
 * Gender - Giới tính
 * 
 * MALE: Nam
 * FEMALE: Nữ
 * OTHER: Khác
 */
public enum Gender {
    MALE("Nam", "M"),
    FEMALE("Nữ", "F"),
    OTHER("Khác", "O");

    private final String displayName;
    private final String shortCode;

    Gender(String displayName, String shortCode) {
        this.displayName = displayName;
        this.shortCode = shortCode;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getShortCode() {
        return shortCode;
    }

    public static Gender fromString(String value) {
        if (value == null || value.isEmpty()) {
            return MALE;
        }
        try {
            return Gender.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            return MALE;
        }
    }

    public static Gender fromShortCode(String code) {
        if (code == null || code.isEmpty()) {
            return MALE;
        }
        for (Gender gender : Gender.values()) {
            if (gender.shortCode.equalsIgnoreCase(code)) {
                return gender;
            }
        }
        return MALE;
    }
}
