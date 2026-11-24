package com.example.pets.petproject.domain.model;

public record LoginRequestDTO(
        String email,
        String password,
        // "Recordarme": la sesion dura jwt.remember-expiration-ms en lugar de jwt.expiration-ms.
        Boolean rememberMe
) {}
