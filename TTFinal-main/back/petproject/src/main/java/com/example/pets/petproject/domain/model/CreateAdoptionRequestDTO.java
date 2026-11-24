package com.example.pets.petproject.domain.model;

import java.util.List;

public record CreateAdoptionRequestDTO(
        Integer petId,
        Integer userId,
        String contactName,
        String contactEmail,
        String contactPhone,
        String message,
        // Respuestas a las preguntas de cuidados y de la raza (las ve quien publico).
        List<RequestAnswer> answers
) {}
