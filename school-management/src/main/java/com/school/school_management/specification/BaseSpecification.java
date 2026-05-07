//package com.school.school_management.specification;
//
//import jakarta.persistence.criteria.CriteriaBuilder;
//import jakarta.persistence.criteria.CriteriaQuery;
//import jakarta.persistence.criteria.Path;
//import jakarta.persistence.criteria.Predicate;
//import jakarta.persistence.criteria.Root;
//import java.time.LocalDate;
//import java.time.LocalDateTime;
//import java.time.OffsetDateTime;
//import java.util.ArrayList;
//import java.util.Collection;
//import java.util.List;
//import java.util.UUID;
//import org.springframework.data.jpa.domain.Specification;
//
///**
// * BaseSpecification - Reusable base specification for dynamic JPA queries.
// *
// * Supports 12 operation types with type-safe value conversion:
// * EQUAL, NOT_EQUAL, GREATER_THAN, GREATER_THAN_OR_EQUAL, LESS_THAN, LESS_THAN_OR_EQUAL,
// * LIKE, IN, BETWEEN, IS_NULL, IS_NOT_NULL
// *
// * Common usage examples:
// * - Search: new BaseSpecification<>(new FilterCriteria("fullName", SearchOperation.LIKE, "John"))
// * - Filter status: new BaseSpecification<>(new FilterCriteria("status", SearchOperation.EQUAL, "ACTIVE"))
// * - Filter by class: new BaseSpecification<>(new FilterCriteria("classId", SearchOperation.EQUAL, classId))
// * - Filter by year: new BaseSpecification<>(new FilterCriteria("year", SearchOperation.EQUAL, 2024))
// */
//public class BaseSpecification<T> implements Specification<T> {
//
//    private final FilterCriteria criteria;
//
//    public BaseSpecification(FilterCriteria criteria) {
//        this.criteria = criteria;
//    }
//
//    /**
//     * Factory method for creating a specification from criteria
//     */
//    public static <T> BaseSpecification<T> of(FilterCriteria criteria) {
//        return new BaseSpecification<>(criteria);
//    }
//
//    /**
//     * Factory method for EQUAL operation
//     * Usage: BaseSpecification.equal("status", "ACTIVE")
//     */
//    public static <T> BaseSpecification<T> equal(String field, Object value) {
//        return new BaseSpecification<>(new FilterCriteria(field, SearchOperation.EQUAL, value));
//    }
//
//    /**
//     * Factory method for LIKE operation (case-insensitive search)
//     * Usage: BaseSpecification.like("fullName", "John")
//     */
//    public static <T> BaseSpecification<T> like(String field, String value) {
//        return new BaseSpecification<>(new FilterCriteria(field, SearchOperation.LIKE, value));
//    }
//
//    /**
//     * Factory method for IN operation
//     * Usage: BaseSpecification.in("classId", classIds)
//     */
//    public static <T> BaseSpecification<T> in(String field, Object value) {
//        return new BaseSpecification<>(new FilterCriteria(field, SearchOperation.IN, value));
//    }
//
//    /**
//     * Factory method for BETWEEN operation
//     * Usage: BaseSpecification.between("createdAt", dateFrom, dateTo)
//     */
//    public static <T> BaseSpecification<T> between(String field, Object from, Object to) {
//        FilterCriteria criteria = new FilterCriteria(field, SearchOperation.BETWEEN, from);
//        criteria.setValueTo(to);
//        return new BaseSpecification<>(criteria);
//    }
//
//    /**
//     * Factory method for IS_NULL check
//     * Usage: BaseSpecification.isNull("deletedAt")
//     */
//    public static <T> BaseSpecification<T> isNull(String field) {
//        return new BaseSpecification<>(new FilterCriteria(field, SearchOperation.IS_NULL, null));
//    }
//
//    /**
//     * Factory method for IS_NOT_NULL check
//     * Usage: BaseSpecification.isNotNull("deletedAt")
//     */
//    public static <T> BaseSpecification<T> isNotNull(String field) {
//        return new BaseSpecification<>(new FilterCriteria(field, SearchOperation.IS_NOT_NULL, null));
//    }
//
//    @Override
//    public Predicate toPredicate(Root<T> root, CriteriaQuery<?> query, CriteriaBuilder cb) {
//        Path<?> path = root.get(criteria.getField());
//        Object value = convertValue(path, criteria.getValue());
//        Object valueTo = convertValue(path, criteria.getValueTo());
//
//        return switch (criteria.getOperation()) {
//            case EQUAL -> cb.equal(path, value);
//            case NOT_EQUAL -> cb.notEqual(path, value);
//            case GREATER_THAN -> greaterThan(cb, path, value);
//            case GREATER_THAN_OR_EQUAL -> greaterThanOrEqualTo(cb, path, value);
//            case LESS_THAN -> lessThan(cb, path, value);
//            case LESS_THAN_OR_EQUAL -> lessThanOrEqualTo(cb, path, value);
//            case LIKE -> cb.like(cb.lower(path.as(String.class)), buildLikePattern(value));
//            case IN -> buildInPredicate(path, value);
//            case BETWEEN -> between(cb, path, value, valueTo);
//            case IS_NULL -> cb.isNull(path);
//            case IS_NOT_NULL -> cb.isNotNull(path);
//        };
//    }
//
//    private Predicate buildInPredicate(Path<?> path, Object value) {
//        List<?> values = toList(value);
//        List<Object> convertedValues = new ArrayList<>();
//        for (Object item : values) {
//            convertedValues.add(convertValue(path, item));
//        }
//        return path.in(convertedValues);
//    }
//
//    @SuppressWarnings({"rawtypes", "unchecked"})
//    private Predicate greaterThan(CriteriaBuilder cb, Path<?> path, Object value) {
//        return cb.greaterThan((jakarta.persistence.criteria.Expression<? extends Comparable>) path, (Comparable) value);
//    }
//
//    @SuppressWarnings({"rawtypes", "unchecked"})
//    private Predicate greaterThanOrEqualTo(CriteriaBuilder cb, Path<?> path, Object value) {
//        return cb.greaterThanOrEqualTo((jakarta.persistence.criteria.Expression<? extends Comparable>) path, (Comparable) value);
//    }
//
//    @SuppressWarnings({"rawtypes", "unchecked"})
//    private Predicate lessThan(CriteriaBuilder cb, Path<?> path, Object value) {
//        return cb.lessThan((jakarta.persistence.criteria.Expression<? extends Comparable>) path, (Comparable) value);
//    }
//
//    @SuppressWarnings({"rawtypes", "unchecked"})
//    private Predicate lessThanOrEqualTo(CriteriaBuilder cb, Path<?> path, Object value) {
//        return cb.lessThanOrEqualTo((jakarta.persistence.criteria.Expression<? extends Comparable>) path, (Comparable) value);
//    }
//
//    @SuppressWarnings({"rawtypes", "unchecked"})
//    private Predicate between(CriteriaBuilder cb, Path<?> path, Object value, Object valueTo) {
//        return cb.between((jakarta.persistence.criteria.Expression<? extends Comparable>) path, (Comparable) value, (Comparable) valueTo);
//    }
//
//    private List<?> toList(Object value) {
//        if (value instanceof Collection<?> collection) {
//            return new ArrayList<>(collection);
//        }
//        List<Object> one = new ArrayList<>();
//        one.add(value);
//        return one;
//    }
//
//    private Object convertValue(Path<?> path, Object raw) {
//        if (raw == null) {
//            return null;
//        }
//
//        Class<?> type = path.getJavaType();
//
//        // UUID
//        if (type.equals(UUID.class)) {
//            if (raw instanceof UUID uuid) {
//                return uuid;
//            }
//            if (raw instanceof String text) {
//                return UUID.fromString(text);
//            }
//            return UUID.fromString(raw.toString());
//        }
//
//        // Integer
//        if (type.equals(Integer.class) || type.equals(int.class)) {
//            if (raw instanceof Integer integer) {
//                return integer;
//            }
//            if (raw instanceof Number number) {
//                return number.intValue();
//            }
//            if (raw instanceof String text) {
//                return Integer.parseInt(text);
//            }
//            return Integer.parseInt(raw.toString());
//        }
//
//        // Long
//        if (type.equals(Long.class) || type.equals(long.class)) {
//            if (raw instanceof Long longValue) {
//                return longValue;
//            }
//            if (raw instanceof Number number) {
//                return number.longValue();
//            }
//            if (raw instanceof String text) {
//                return Long.parseLong(text);
//            }
//            return Long.parseLong(raw.toString());
//        }
//
//        // Double
//        if (type.equals(Double.class) || type.equals(double.class)) {
//            if (raw instanceof Double doubleValue) {
//                return doubleValue;
//            }
//            if (raw instanceof Number number) {
//                return number.doubleValue();
//            }
//            if (raw instanceof String text) {
//                return Double.parseDouble(text);
//            }
//            return Double.parseDouble(raw.toString());
//        }
//
//        // Float
//        if (type.equals(Float.class) || type.equals(float.class)) {
//            if (raw instanceof Float floatValue) {
//                return floatValue;
//            }
//            if (raw instanceof Number number) {
//                return number.floatValue();
//            }
//            if (raw instanceof String text) {
//                return Float.parseFloat(text);
//            }
//            return Float.parseFloat(raw.toString());
//        }
//
//        // Boolean
//        if (type.equals(Boolean.class) || type.equals(boolean.class)) {
//            if (raw instanceof Boolean boolValue) {
//                return boolValue;
//            }
//            if (raw instanceof String text) {
//                return Boolean.parseBoolean(text);
//            }
//            return Boolean.parseBoolean(raw.toString());
//        }
//
//        // LocalDate
//        if (type.equals(LocalDate.class)) {
//            if (raw instanceof LocalDate localDate) {
//                return localDate;
//            }
//            if (raw instanceof String text) {
//                return LocalDate.parse(text);
//            }
//            return LocalDate.parse(raw.toString());
//        }
//
//        // LocalDateTime
//        if (type.equals(LocalDateTime.class)) {
//            if (raw instanceof LocalDateTime localDateTime) {
//                return localDateTime;
//            }
//            if (raw instanceof String text) {
//                return LocalDateTime.parse(text);
//            }
//            return LocalDateTime.parse(raw.toString());
//        }
//
//        // OffsetDateTime
//        if (type.equals(OffsetDateTime.class)) {
//            if (raw instanceof OffsetDateTime offsetDateTime) {
//                return offsetDateTime;
//            }
//            if (raw instanceof String text) {
//                return OffsetDateTime.parse(text);
//            }
//            return OffsetDateTime.parse(raw.toString());
//        }
//
//        return raw;
//    }
//
//    private String buildLikePattern(Object value) {
//        if (value == null) {
//            return "%%";
//        }
//        String raw = value instanceof String text ? text : String.valueOf(value);
//        return "%" + raw.toLowerCase() + "%";
//    }
//}
