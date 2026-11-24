package com.example.pets.petproject.domain.model;

import java.time.LocalDateTime;
import java.util.List;

public record CaseDTO(
        Integer caseId,
        String caseType,
        String status,
        Integer petId,
        Integer reportId,
        Integer adoptionRequestId,
        Integer reportSightingId,
        Integer ownerId,
        String ownerName,
        String ownerEmail,
        Integer participantId,
        String participantName,
        String participantEmail,
        String participantPhone,
        String title,
        String petName,
        String imageUrl,
        String location,
        String description,
        String lastMessage,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        // Fechas del avance: cierre del caso, publicacion del perro/reporte y solicitud/aviso que lo origino.
        LocalDateTime closedAt,
        LocalDateTime publishedAt,
        LocalDateTime requestedAt,
        // Seguridad del chat, vista desde quien consulta: chat bloqueado (y si lo bloqueo el),
        // si el bloqueo a la otra persona y si la otra persona lo bloqueo a el.
        boolean chatBlocked,
        boolean chatBlockedByMe,
        LocalDateTime chatBlockedAt,
        boolean blockedByMe,
        boolean blockedMe,
        List<CaseMessageDTO> messages
) {
}
