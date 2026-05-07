package com.school.school_management.enums;

import java.time.LocalDate;
import java.util.Locale;

public enum TimetableVersionStatus {
    DRAFT,
    LOCKED,
    EXPIRED;

    public static TimetableVersionStatus from(String value) {
        if (value == null || value.isBlank()) {
            return LOCKED;
        }

        String normalized = value.trim().toUpperCase(Locale.ROOT);
        for (TimetableVersionStatus status : values()) {
            if (status.name().equals(normalized)) {
                return status;
            }
        }

        throw new IllegalArgumentException("Invalid timetable status: " + value);
    }

    public static TimetableVersionStatus resolve(String value, LocalDate effectiveTo) {
        TimetableVersionStatus status = from(value);
        if (status == DRAFT && effectiveTo != null && effectiveTo.isBefore(LocalDate.now())) {
            return EXPIRED;
        }

        return status;
    }

    public boolean isReadOnly() {
        return this == LOCKED || this == EXPIRED;
    }

    public boolean isLocked() {
        return this == LOCKED;
    }

    public String toApiValue() {
        return name();
    }
}
