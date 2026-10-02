package com.example.me.hospitalmanagement.error.exception;

public class ExpiredRefreshTokenException extends RuntimeException {
    public ExpiredRefreshTokenException(String message) {
        super(message);
    }
}
