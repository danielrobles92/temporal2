package com.example.pets.petproject.domain.model;

import java.time.LocalDateTime;

/** Usuario que bloqueo quien consulta (se muestra en su perfil). */
public record BlockedUserDTO(
        Integer userId,
        String name,
        LocalDateTime blockedAt,
        Integer caseId,
        String caseTitle
) {
}
