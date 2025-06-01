package com.gl.hive.ProjectService.exceptions;

import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.http.HttpStatus;

/**
 * Exception thrown when a requested resource is not found.
 * This is a temporary local copy to avoid shared library dependency issues.
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class ResourceNotFoundException extends RuntimeException {

    private HttpStatus httpStatus;
    private int statusCode;

    public ResourceNotFoundException() {
    }

    public ResourceNotFoundException(String message) {
        super(message);
    }

    public ResourceNotFoundException(String message, HttpStatus httpStatus, int statusCode) {
        super(message);
        this.httpStatus = httpStatus;
        this.statusCode = statusCode;
    }

    public ResourceNotFoundException(String message, HttpStatus httpStatus) {
        super(message);
        this.httpStatus = httpStatus;
    }
}
