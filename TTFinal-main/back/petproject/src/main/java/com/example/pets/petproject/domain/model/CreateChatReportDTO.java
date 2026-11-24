package com.example.pets.petproject.domain.model;

/**
 * Reporte de mal uso en un chat. {@code messageId} es opcional (mensaje concreto);
 * {@code blockUser} bloquea ademas a la persona reportada.
 */
public record CreateChatReportDTO(
        String reason,
        String details,
        Integer messageId,
        Boolean blockUser
) {
}
