package org.godn.uploadservice.exception;
import java.util.HashMap;
import java.util.Map;

import lombok.Getter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // --- 1. Handle Custom Logic Exceptions ---

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ErrorResponse> handleBadRequestException(BadRequestException ex) {
        logger.warn("Bad Request: {}", ex.getMessage());
        return new ResponseEntity<>(new ErrorResponse(false, ex.getMessage()), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFoundException(ResourceNotFoundException ex) {
        logger.warn("Resource Not Found: {}", ex.getMessage());
        return new ResponseEntity<>(new ErrorResponse(false, ex.getMessage()), HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ErrorResponse> handleUnauthorizedException(UnauthorizedException ex) {
        logger.warn("Unauthorized Access: {}", ex.getMessage());
        return new ResponseEntity<>(new ErrorResponse(false, ex.getMessage()), HttpStatus.UNAUTHORIZED);
    }

    // --- 2. Handle Validation Errors (@Valid) ---

    /**
     * This handles errors when a DTO fails validation (e.g., @NotBlank, @Pattern).
     * It returns a Map of field names to error messages.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        logger.warn("Validation Failed: {}", errors);
        return new ResponseEntity<>(errors, HttpStatus.BAD_REQUEST);
    }

    // --- 3. Handle Unexpected System Errors ---

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGlobalException(Exception ex) {
        // Log the full stack trace for debugging on the server
        logger.error("An unexpected error occurred: ", ex);

        // Return a generic safe message to the client
        return new ResponseEntity<>(
                new ErrorResponse(false, "An internal server error occurred. Please try again later."),
                HttpStatus.INTERNAL_SERVER_ERROR
        );
    }

    // --- Helper Class for Error Responses ---
    // You can put this in a separate file like ApiResponseDto.java if you prefer
    public record ErrorResponse(boolean success, String message) {}
}