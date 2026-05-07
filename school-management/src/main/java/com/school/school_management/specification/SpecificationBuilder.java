//package com.school.school_management.specification;
//
//import java.util.ArrayList;
//import java.util.List;
//import org.springframework.data.jpa.domain.Specification;
//
//public class SpecificationBuilder<T> {
//
//    private final List<FilterCriteria> criteriaList = new ArrayList<>();
//
//    public SpecificationBuilder<T> with(String field, SearchOperation operation, Object value) {
//        criteriaList.add(FilterCriteria.builder()
//                .field(field)
//                .operation(operation)
//                .value(value)
//                .orPredicate(false)
//                .build());
//        return this;
//    }
//
//    public SpecificationBuilder<T> with(String field, SearchOperation operation, Object value, Object valueTo) {
//        criteriaList.add(FilterCriteria.builder()
//                .field(field)
//                .operation(operation)
//                .value(value)
//                .valueTo(valueTo)
//                .orPredicate(false)
//                .build());
//        return this;
//    }
//
//    public SpecificationBuilder<T> withOr(String field, SearchOperation operation, Object value) {
//        criteriaList.add(FilterCriteria.builder()
//                .field(field)
//                .operation(operation)
//                .value(value)
//                .orPredicate(true)
//                .build());
//        return this;
//    }
//
//    public SpecificationBuilder<T> with(FilterCriteria criteria) {
//        criteriaList.add(criteria);
//        return this;
//    }
//
//    public Specification<T> build() {
//        if (criteriaList.isEmpty()) {
//            return null;
//        }
//
//        Specification<T> result = null;
//        for (FilterCriteria criteria : criteriaList) {
//            Specification<T> spec = new BaseSpecification<>(criteria);
//            if (result == null) {
//                result = spec;
//                continue;
//            }
//            result = criteria.isOrPredicate() ? result.or(spec) : result.and(spec);
//        }
//        return result;
//    }
//}
