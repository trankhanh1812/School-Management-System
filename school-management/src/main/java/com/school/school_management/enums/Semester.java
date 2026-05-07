package com.school.school_management.enums;

/**
 * Semester - Học kỳ trong năm học
 * 
 * SEMESTER_1: Học kỳ 1 (tháng tám đến tháng mười hai)
 * SEMESTER_2: Học kỳ 2 (tháng một đến tháng năm)
 */
public enum Semester {
    SEMESTER_1("Học kỳ 1", 1, 8, 12),    // Tháng 8-12
    SEMESTER_2("Học kỳ 2", 2, 1, 5);     // Tháng 1-5

    private final String displayName;
    private final int semesterNumber;
    private final int startMonth;
    private final int endMonth;

    Semester(String displayName, int semesterNumber, int startMonth, int endMonth) {
        this.displayName = displayName;
        this.semesterNumber = semesterNumber;
        this.startMonth = startMonth;
        this.endMonth = endMonth;
    }

    public String getDisplayName() {
        return displayName;
    }

    public int getSemesterNumber() {
        return semesterNumber;
    }

    public int getStartMonth() {
        return startMonth;
    }

    public int getEndMonth() {
        return endMonth;
    }

    public static Semester fromString(String value) {
        if (value == null || value.isEmpty()) {
            return SEMESTER_1;
        }
        try {
            return Semester.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            return SEMESTER_1;
        }
    }

    public static Semester fromSemesterNumber(int number) {
        if (number == 1) return SEMESTER_1;
        if (number == 2) return SEMESTER_2;
        return SEMESTER_1;
    }

    public static Semester getCurrentSemester(int month) {
        if (month >= 8 || month <= 5) {
            if (month <= 5) {
                return SEMESTER_2;
            } else {
                return SEMESTER_1;
            }
        }
        return SEMESTER_1;
    }

    public boolean isFirstSemester() {
        return this == SEMESTER_1;
    }

    public boolean containsMonth(int month) {
        if (this == SEMESTER_1) {
            return month >= startMonth && month <= 12;
        } else {
            return month >= 1 && month <= endMonth;
        }
    }

    public Semester getNextSemester() {
        return this == SEMESTER_1 ? SEMESTER_2 : SEMESTER_1;
    }

    public Semester getPreviousSemester() {
        return this == SEMESTER_1 ? SEMESTER_2 : SEMESTER_1;
    }
}
