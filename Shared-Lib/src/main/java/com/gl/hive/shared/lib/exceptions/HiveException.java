package com.gl.hive.shared.lib.exceptions;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.http.HttpStatus;

@JsonIgnoreProperties(ignoreUnknown = true) // Optional if you add all fields

@Data
@EqualsAndHashCode(callSuper = true)
public class HiveException extends RuntimeException {

    @JsonProperty("httpStatus")
    private HttpStatus httpStatus;

    @JsonProperty("statusCode")
    private int statusCode;

    public HiveException() {
    }

    public HiveException(String message) {
        super(message);
    }

    public HiveException(String message, int statusCode) {
        super(message);
        this.statusCode = statusCode;
    }

    public HiveException(String message, HttpStatus httpStatus, int statusCode) {
        super(message);
        this.httpStatus = httpStatus;
        this.statusCode = statusCode;
    }

    public HiveException(String message, HttpStatus httpStatus) {
        super(message);
        this.httpStatus = httpStatus;
    }

}
