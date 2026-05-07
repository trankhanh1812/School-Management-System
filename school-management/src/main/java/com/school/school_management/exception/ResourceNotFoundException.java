package com.school.school_management.exception;

import java.util.UUID;

public class ResourceNotFoundException extends CustomException {

    public ResourceNotFoundException(String message) {
        super(message, 404);
    }

    public ResourceNotFoundException(String resourceName, String fieldName, Object fieldValue) {
        super(String.format("%s not found with %s : '%s'", resourceName, fieldName, fieldValue), 404);
    }

    public ResourceNotFoundException(String resourceName, UUID id) {
        super(String.format("%s not found with id: %s", resourceName, id), 404);
    }
}
