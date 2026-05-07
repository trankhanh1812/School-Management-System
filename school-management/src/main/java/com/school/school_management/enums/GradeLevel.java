package com.school.school_management.enums;

/**
 * GradeLevel - Lớp/khối học
 * 
 * GRADE_1 đến GRADE_12: Từ lớp 1 đến lớp 12
 */
public enum GradeLevel {
    GRADE_1("Lớp 1", 1),
    GRADE_2("Lớp 2", 2),
    GRADE_3("Lớp 3", 3),
    GRADE_4("Lớp 4", 4),
    GRADE_5("Lớp 5", 5),
    GRADE_6("Lớp 6", 6),
    GRADE_7("Lớp 7", 7),
    GRADE_8("Lớp 8", 8),
    GRADE_9("Lớp 9", 9),
    GRADE_10("Lớp 10", 10),
    GRADE_11("Lớp 11", 11),
    GRADE_12("Lớp 12", 12);

    private final String displayName;
    private final int levelNumber;

    GradeLevel(String displayName, int levelNumber) {
        this.displayName = displayName;
        this.levelNumber = levelNumber;
    }

    public String getDisplayName() {
        return displayName;
    }

    public int getLevelNumber() {
        return levelNumber;
    }

    public static GradeLevel fromString(String value) {
        if (value == null || value.isEmpty()) {
            return GRADE_1;
        }
        try {
            return GradeLevel.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            return GRADE_1;
        }
    }

    public static GradeLevel fromNumber(int number) {
        if (number < 1 || number > 12) {
            return GRADE_1;
        }
        return GradeLevel.values()[number - 1];
    }

    public boolean isElementary() {
        return levelNumber >= 1 && levelNumber <= 5;
    }

    public boolean isMiddleSchool() {
        return levelNumber >= 6 && levelNumber <= 9;
    }

    public boolean isHighSchool() {
        return levelNumber >= 10 && levelNumber <= 12;
    }

    public GradeLevel getNextGrade() {
        if (levelNumber < 12) {
            return fromNumber(levelNumber + 1);
        }
        return GRADE_12;
    }

    public GradeLevel getPreviousGrade() {
        if (levelNumber > 1) {
            return fromNumber(levelNumber - 1);
        }
        return GRADE_1;
    }
}
