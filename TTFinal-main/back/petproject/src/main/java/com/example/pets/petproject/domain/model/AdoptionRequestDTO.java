package com.example.pets.petproject.domain.model;

import com.example.pets.petproject.domain.enums.AdoptionRequestStatus;

import java.time.LocalDateTime;
import java.util.List;

public record AdoptionRequestDTO(
        Integer requestId,
        Integer petId,
        String petName,
        String petImageUrl,
        String petBreed,
        String petOwnerName,
        Integer userId,
        String contactName,
        String contactEmail,
        String contactPhone,
        String message,
        AdoptionRequestStatus status,
        String decisionNotes,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        // Avance completo: publicacion del perro, caso de contacto y fecha en que termino.
        LocalDateTime petPublishedAt,
        Integer caseId,
        String caseStatus,
        LocalDateTime caseOpenedAt,
        LocalDateTime finishedAt,
        // Ultima correccion de quien la envio y si todavia puede editarla (y que tanto).
        LocalDateTime editedAt,
        String editMode,
        // Respuestas a las preguntas de cuidados y de la raza (vacia en solicitudes anteriores).
        List<RequestAnswer> answers
) {}
