package com.example.pets.petproject.domain.model;

/** Solicitud de codigo (solo email) o confirmacion (email + codigo + nueva contrasena). */
public record PasswordResetDTO(
        String email,
        String code,
        String newPassword
) {}
