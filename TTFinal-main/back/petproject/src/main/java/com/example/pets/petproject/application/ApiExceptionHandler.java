package com.example.pets.petproject.application;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

/**
 * Responde {message} con el texto de los errores de negocio para que el front lo
 * muestre. Sin esto Spring Boot oculta el mensaje y el usuario solo ve
 * "Internal Server Error" o "Conflict". Se evalua despues de NotADogExceptionHandler.
 */
@RestControllerAdvice
@Order(Ordered.LOWEST_PRECEDENCE)
public class ApiExceptionHandler {

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> handle(ResponseStatusException e) {
        String message = e.getReason() != null ? e.getReason() : "No se pudo completar la operacion";
        return ResponseEntity.status(e.getStatusCode()).body(Map.of("message", message));
    }

    /** Foto o peticion de mas de 5 MB / 20 MB (spring.servlet.multipart): 413 con un mensaje claro. */
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, String>> handle(MaxUploadSizeExceededException e) {
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                .body(Map.of("message", "Cada foto debe pesar como maximo 5 MB"));
    }

    /**
     * Solo las RuntimeException lanzadas por la app (su mensaje esta escrito para el
     * usuario). Las de librerias (SQL, seguridad, etc.) siguen el manejo por defecto
     * para no exponer detalles internos.
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handle(RuntimeException e) {
        if (e.getClass() != RuntimeException.class || e.getMessage() == null) {
            throw e;
        }
        return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
    }
}
