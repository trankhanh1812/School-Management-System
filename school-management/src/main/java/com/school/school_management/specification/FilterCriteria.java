package com.school.school_management.specification;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FilterCriteria {

    private String field;
    private SearchOperation operation;
    private Object value;
    private Object valueTo;
    private boolean orPredicate;
}
