package com.example.me.hospitalmanagement.error;

import com.example.me.hospitalmanagement.error.exception.BusinessRuleException;
import com.example.me.hospitalmanagement.error.exception.DuplicateResourceException;
import com.example.me.hospitalmanagement.error.exception.ForbiddenOperationException;
import com.example.me.hospitalmanagement.error.exception.ResourceNotFoundException;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import jakarta.persistence.EntityNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.NoHandlerFoundException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleMethodArgumentNotValid(MethodArgumentNotValidException ex, HttpServletRequest request) {
        log.warn("Validation error on path {}: {}", request.getRequestURI(), ex.getMessage());
        List<FieldErrorDto> fieldErrors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(err -> new FieldErrorDto(err.getField(), err.getDefaultMessage()))
                .toList();

        ApiError apiError = new ApiError(
                HttpStatus.BAD_REQUEST.value(),
                HttpStatus.BAD_REQUEST.getReasonPhrase(),
                "VALIDATION_FAILED",
                "Validation failed for one or more fields",
                request.getRequestURI(),
                fieldErrors
        );
        return new ResponseEntity<>(apiError, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiError> handleConstraintViolation(ConstraintViolationException ex, HttpServletRequest request) {
        log.warn("Constraint violation on path {}: {}", request.getRequestURI(), ex.getMessage());
        List<FieldErrorDto> fieldErrors = new ArrayList<>();
        ex.getConstraintViolations().forEach(violation -> {
            String propertyPath = violation.getPropertyPath().toString();
            String field = propertyPath.contains(".") ? propertyPath.substring(propertyPath.lastIndexOf('.') + 1) : propertyPath;
            fieldErrors.add(new FieldErrorDto(field, violation.getMessage()));
        });

        ApiError apiError = new ApiError(
                HttpStatus.BAD_REQUEST.value(),
                HttpStatus.BAD_REQUEST.getReasonPhrase(),
                "VALIDATION_FAILED",
                "Validation failed for request parameters",
                request.getRequestURI(),
                fieldErrors
        );
        return new ResponseEntity<>(apiError, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiError> handleHttpMessageNotReadable(HttpMessageNotReadableException ex, HttpServletRequest request) {
        log.warn("Malformed JSON request on path {}: {}", request.getRequestURI(), ex.getMessage());
        String msg = "Malformed or missing JSON body";
        ApiError apiError = new ApiError(
                HttpStatus.BAD_REQUEST.value(),
                HttpStatus.BAD_REQUEST.getReasonPhrase(),
                "MALFORMED_JSON",
                msg,
                request.getRequestURI()
        );
        return new ResponseEntity<>(apiError, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiError> handleMethodArgumentTypeMismatch(MethodArgumentTypeMismatchException ex, HttpServletRequest request) {
        log.warn("Type mismatch on path {}: {}", request.getRequestURI(), ex.getMessage());
        String requiredType = ex.getRequiredType() != null ? ex.getRequiredType().getSimpleName() : "valid type";
        String message = String.format("Parameter '%s' must be of type %s", ex.getName(), requiredType);
        ApiError apiError = new ApiError(
                HttpStatus.BAD_REQUEST.value(),
                HttpStatus.BAD_REQUEST.getReasonPhrase(),
                "TYPE_MISMATCH",
                message,
                request.getRequestURI()
        );
        return new ResponseEntity<>(apiError, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ApiError> handleMissingServletRequestParameter(MissingServletRequestParameterException ex, HttpServletRequest request) {
        log.warn("Missing parameter on path {}: {}", request.getRequestURI(), ex.getMessage());
        ApiError apiError = new ApiError(
                HttpStatus.BAD_REQUEST.value(),
                HttpStatus.BAD_REQUEST.getReasonPhrase(),
                "MISSING_PARAMETER",
                ex.getMessage(),
                request.getRequestURI()
        );
        return new ResponseEntity<>(apiError, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiError> handleIllegalArgument(IllegalArgumentException ex, HttpServletRequest request) {
        log.warn("Illegal argument on path {}: {}", request.getRequestURI(), ex.getMessage());
        ApiError apiError = new ApiError(
                HttpStatus.BAD_REQUEST.value(),
                HttpStatus.BAD_REQUEST.getReasonPhrase(),
                "INVALID_ARGUMENT",
                ex.getMessage(),
                request.getRequestURI()
        );
        return new ResponseEntity<>(apiError, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiError> handleBadCredentials(BadCredentialsException ex, HttpServletRequest request) {
        log.warn("Bad credentials on path {}: {}", request.getRequestURI(), ex.getMessage());
        ApiError apiError = new ApiError(
                HttpStatus.UNAUTHORIZED.value(),
                HttpStatus.UNAUTHORIZED.getReasonPhrase(),
                "BAD_CREDENTIALS",
                "Invalid username or password",
                request.getRequestURI()
        );
        return new ResponseEntity<>(apiError, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(UsernameNotFoundException.class)
    public ResponseEntity<ApiError> handleUsernameNotFound(UsernameNotFoundException ex, HttpServletRequest request) {
        log.warn("Username not found on path {}: {}", request.getRequestURI(), ex.getMessage());
        ApiError apiError = new ApiError(
                HttpStatus.UNAUTHORIZED.value(),
                HttpStatus.UNAUTHORIZED.getReasonPhrase(),
                "BAD_CREDENTIALS",
                "Invalid username or password",
                request.getRequestURI()
        );
        return new ResponseEntity<>(apiError, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(ExpiredJwtException.class)
    public ResponseEntity<ApiError> handleExpiredJwt(ExpiredJwtException ex, HttpServletRequest request) {
        log.warn("Expired JWT on path {}: {}", request.getRequestURI(), ex.getMessage());
        ApiError apiError = new ApiError(
                HttpStatus.UNAUTHORIZED.value(),
                HttpStatus.UNAUTHORIZED.getReasonPhrase(),
                "TOKEN_EXPIRED",
                "JWT token has expired",
                request.getRequestURI()
        );
        return new ResponseEntity<>(apiError, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(JwtException.class)
    public ResponseEntity<ApiError> handleJwtException(JwtException ex, HttpServletRequest request) {
        log.warn("Invalid JWT on path {}: {}", request.getRequestURI(), ex.getMessage());
        ApiError apiError = new ApiError(
                HttpStatus.UNAUTHORIZED.value(),
                HttpStatus.UNAUTHORIZED.getReasonPhrase(),
                "TOKEN_INVALID",
                "Invalid JWT token",
                request.getRequestURI()
        );
        return new ResponseEntity<>(apiError, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(com.example.me.hospitalmanagement.error.exception.InvalidRefreshTokenException.class)
    public ResponseEntity<ApiError> handleInvalidRefreshToken(com.example.me.hospitalmanagement.error.exception.InvalidRefreshTokenException ex, HttpServletRequest request) {
        log.warn("Invalid refresh token on path {}: {}", request.getRequestURI(), ex.getMessage());
        ApiError apiError = new ApiError(
                HttpStatus.UNAUTHORIZED.value(),
                HttpStatus.UNAUTHORIZED.getReasonPhrase(),
                "TOKEN_INVALID",
                ex.getMessage(),
                request.getRequestURI()
        );
        return new ResponseEntity<>(apiError, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(com.example.me.hospitalmanagement.error.exception.ExpiredRefreshTokenException.class)
    public ResponseEntity<ApiError> handleExpiredRefreshToken(com.example.me.hospitalmanagement.error.exception.ExpiredRefreshTokenException ex, HttpServletRequest request) {
        log.warn("Expired refresh token on path {}: {}", request.getRequestURI(), ex.getMessage());
        ApiError apiError = new ApiError(
                HttpStatus.UNAUTHORIZED.value(),
                HttpStatus.UNAUTHORIZED.getReasonPhrase(),
                "TOKEN_EXPIRED",
                ex.getMessage(),
                request.getRequestURI()
        );
        return new ResponseEntity<>(apiError, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(AuthenticationCredentialsNotFoundException.class)
    public ResponseEntity<ApiError> handleAuthCredentialsNotFound(AuthenticationCredentialsNotFoundException ex, HttpServletRequest request) {
        log.warn("Auth credentials not found on path {}: {}", request.getRequestURI(), ex.getMessage());
        ApiError apiError = new ApiError(
                HttpStatus.UNAUTHORIZED.value(),
                HttpStatus.UNAUTHORIZED.getReasonPhrase(),
                "UNAUTHORIZED",
                "Authentication credentials not found",
                request.getRequestURI()
        );
        return new ResponseEntity<>(apiError, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiError> handleGenericAuthentication(AuthenticationException ex, HttpServletRequest request) {
        log.warn("Authentication failed on path {}: {}", request.getRequestURI(), ex.getMessage());
        ApiError apiError = new ApiError(
                HttpStatus.UNAUTHORIZED.value(),
                HttpStatus.UNAUTHORIZED.getReasonPhrase(),
                "UNAUTHORIZED",
                ex.getMessage() != null ? ex.getMessage() : "Authentication failed",
                request.getRequestURI()
        );
        return new ResponseEntity<>(apiError, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiError> handleAccessDenied(AccessDeniedException ex, HttpServletRequest request) {
        log.warn("Access denied on path {}: {}", request.getRequestURI(), ex.getMessage());
        ApiError apiError = new ApiError(
                HttpStatus.FORBIDDEN.value(),
                HttpStatus.FORBIDDEN.getReasonPhrase(),
                "FORBIDDEN",
                "Access Denied: You do not have permission to access this resource",
                request.getRequestURI()
        );
        return new ResponseEntity<>(apiError, HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(ForbiddenOperationException.class)
    public ResponseEntity<ApiError> handleForbiddenOperation(ForbiddenOperationException ex, HttpServletRequest request) {
        log.warn("Forbidden operation on path {}: {}", request.getRequestURI(), ex.getMessage());
        ApiError apiError = new ApiError(
                HttpStatus.FORBIDDEN.value(),
                HttpStatus.FORBIDDEN.getReasonPhrase(),
                "FORBIDDEN",
                ex.getMessage(),
                request.getRequestURI()
        );
        return new ResponseEntity<>(apiError, HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler({ResourceNotFoundException.class, EntityNotFoundException.class, NoSuchElementException.class})
    public ResponseEntity<ApiError> handleNotFoundExceptions(RuntimeException ex, HttpServletRequest request) {
        log.warn("Resource not found on path {}: {}", request.getRequestURI(), ex.getMessage());
        ApiError apiError = new ApiError(
                HttpStatus.NOT_FOUND.value(),
                HttpStatus.NOT_FOUND.getReasonPhrase(),
                "RESOURCE_NOT_FOUND",
                ex.getMessage(),
                request.getRequestURI()
        );
        return new ResponseEntity<>(apiError, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler({NoResourceFoundException.class, NoHandlerFoundException.class})
    public ResponseEntity<ApiError> handleNoResourceFound(Exception ex, HttpServletRequest request) {
        log.warn("No handler/resource found on path {}: {}", request.getRequestURI(), ex.getMessage());
        ApiError apiError = new ApiError(
                HttpStatus.NOT_FOUND.value(),
                HttpStatus.NOT_FOUND.getReasonPhrase(),
                "RESOURCE_NOT_FOUND",
                "Resource not found: " + request.getRequestURI(),
                request.getRequestURI()
        );
        return new ResponseEntity<>(apiError, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiError> handleHttpRequestMethodNotSupported(HttpRequestMethodNotSupportedException ex, HttpServletRequest request) {
        log.warn("Method not supported on path {}: {}", request.getRequestURI(), ex.getMessage());
        String message = String.format("Request method '%s' is not supported", ex.getMethod());
        ApiError apiError = new ApiError(
                HttpStatus.METHOD_NOT_ALLOWED.value(),
                HttpStatus.METHOD_NOT_ALLOWED.getReasonPhrase(),
                "METHOD_NOT_ALLOWED",
                message,
                request.getRequestURI()
        );
        return new ResponseEntity<>(apiError, HttpStatus.METHOD_NOT_ALLOWED);
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<ApiError> handleHttpMediaTypeNotSupported(HttpMediaTypeNotSupportedException ex, HttpServletRequest request) {
        log.warn("Media type not supported on path {}: {}", request.getRequestURI(), ex.getMessage());
        String message = String.format("Content-Type '%s' is not supported", ex.getContentType());
        ApiError apiError = new ApiError(
                HttpStatus.UNSUPPORTED_MEDIA_TYPE.value(),
                HttpStatus.UNSUPPORTED_MEDIA_TYPE.getReasonPhrase(),
                "UNSUPPORTED_MEDIA_TYPE",
                message,
                request.getRequestURI()
        );
        return new ResponseEntity<>(apiError, HttpStatus.UNSUPPORTED_MEDIA_TYPE);
    }

    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ApiError> handleDuplicateResource(DuplicateResourceException ex, HttpServletRequest request) {
        log.warn("Duplicate resource on path {}: {}", request.getRequestURI(), ex.getMessage());
        ApiError apiError = new ApiError(
                HttpStatus.CONFLICT.value(),
                HttpStatus.CONFLICT.getReasonPhrase(),
                "DUPLICATE_RESOURCE",
                ex.getMessage(),
                request.getRequestURI()
        );
        return new ResponseEntity<>(apiError, HttpStatus.CONFLICT);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiError> handleDataIntegrityViolation(DataIntegrityViolationException ex, HttpServletRequest request) {
        log.warn("Data integrity violation on path {}: {}", request.getRequestURI(), ex.getMessage());
        String msg = "Database constraint violation occurred.";
        if (ex.getRootCause() != null && ex.getRootCause().getMessage() != null) {
            msg = ex.getRootCause().getMessage();
        } else if (ex.getMessage() != null) {
            msg = ex.getMessage();
        }
        ApiError apiError = new ApiError(
                HttpStatus.CONFLICT.value(),
                HttpStatus.CONFLICT.getReasonPhrase(),
                "DATA_INTEGRITY_VIOLATION",
                msg,
                request.getRequestURI()
        );
        return new ResponseEntity<>(apiError, HttpStatus.CONFLICT);
    }

    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<ApiError> handleOptimisticLockingFailure(ObjectOptimisticLockingFailureException ex, HttpServletRequest request) {
        log.warn("Optimistic locking failure on path {}: {}", request.getRequestURI(), ex.getMessage());
        ApiError apiError = new ApiError(
                HttpStatus.CONFLICT.value(),
                HttpStatus.CONFLICT.getReasonPhrase(),
                "OPTIMISTIC_LOCK_FAILURE",
                "The record was changed by someone else. Please retry.",
                request.getRequestURI()
        );
        return new ResponseEntity<>(apiError, HttpStatus.CONFLICT);
    }

    @ExceptionHandler(BusinessRuleException.class)
    public ResponseEntity<ApiError> handleBusinessRule(BusinessRuleException ex, HttpServletRequest request) {
        log.warn("Business rule violation on path {}: {}", request.getRequestURI(), ex.getMessage());
        ApiError apiError = new ApiError(
                422,
                "Unprocessable Entity",
                "BUSINESS_RULE_VIOLATION",
                ex.getMessage(),
                request.getRequestURI()
        );
        return new ResponseEntity<>(apiError, HttpStatus.UNPROCESSABLE_ENTITY);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleGenericFallback(Exception ex, HttpServletRequest request) {
        log.error("Unhandled server exception on path " + request.getRequestURI(), ex);
        ApiError apiError = new ApiError(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                HttpStatus.INTERNAL_SERVER_ERROR.getReasonPhrase(),
                "INTERNAL_SERVER_ERROR",
                "Something went wrong. Please try again later.",
                request.getRequestURI()
        );
        return new ResponseEntity<>(apiError, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
