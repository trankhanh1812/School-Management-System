package com.school.school_management.util;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

public final class DateTimeUtil {

    public static final ZoneId DEFAULT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    public static final DateTimeFormatter ISO_OFFSET_FORMATTER = DateTimeFormatter.ISO_OFFSET_DATE_TIME;
    public static final DateTimeFormatter LOCAL_DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private DateTimeUtil() {
    }

    public static OffsetDateTime nowUtc() {
        return OffsetDateTime.now(ZoneOffset.UTC);
    }

    public static OffsetDateTime now(ZoneId zoneId) {
        return OffsetDateTime.now(zoneId);
    }

    public static LocalDate today() {
        return LocalDate.now(DEFAULT_ZONE);
    }

    public static String format(OffsetDateTime dateTime) {
        return dateTime == null ? null : dateTime.format(ISO_OFFSET_FORMATTER);
    }

    public static String format(LocalDateTime dateTime) {
        return dateTime == null ? null : dateTime.format(LOCAL_DATE_TIME_FORMATTER);
    }

    public static OffsetDateTime parseOffset(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return OffsetDateTime.parse(value, ISO_OFFSET_FORMATTER);
    }

    public static LocalDateTime parseLocalDateTime(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return LocalDateTime.parse(value, LOCAL_DATE_TIME_FORMATTER);
        } catch (DateTimeParseException ex) {
            return LocalDateTime.parse(value);
        }
    }
}
