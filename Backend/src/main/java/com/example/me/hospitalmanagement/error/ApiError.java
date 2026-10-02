package com.example.me.hospitalmanagement.error;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public class ApiError {
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime timestamp;
    private int status;
    private String error;
    private String code;
    private String message;
    private String path;
    private List<FieldErrorDto> fieldErrors;

    public ApiError() {
        this.timestamp = LocalDateTime.now();
    }

    public ApiError(int status, String error, String code, String message, String path) {
        this();
        this.status = status;
        this.error = error;
        this.code = code;
        this.message = message;
        this.path = path;
    }

    public ApiError(int status, String error, String code, String message, String path, List<FieldErrorDto> fieldErrors) {
        this(status, error, code, message, path);
        this.fieldErrors = fieldErrors;
    }
}
