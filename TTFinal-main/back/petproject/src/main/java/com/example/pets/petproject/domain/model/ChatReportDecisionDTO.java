package com.example.pets.petproject.domain.model;

/** Decision del administrador sobre un reporte de chat: REVIEWED, DISMISSED o PENDING. */
public record ChatReportDecisionDTO(
        String status,
        String adminNotes
) {
}
