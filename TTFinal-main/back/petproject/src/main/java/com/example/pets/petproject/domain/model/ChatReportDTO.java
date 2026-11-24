package com.example.pets.petproject.domain.model;

import java.time.LocalDateTime;

/** Reporte de mal uso en un chat, como lo ve el administrador. */
public record ChatReportDTO(
        Integer chatReportId,
        Integer caseId,
        String caseTitle,
        String caseType,
        /** false si el caso ya se borro (queda la evidencia guardada). */
        boolean caseExists,
        boolean chatBlocked,
        Integer messageId,
        Integer reporterId,
        String reporterName,
        String reporterEmail,
        Integer reportedUserId,
        String reportedUserName,
        String reportedUserEmail,
        Boolean reportedUserActive,
        /** Cuantos reportes en total tiene la persona reportada (reincidencia). */
        long reportedUserReportCount,
        String reason,
        String details,
        String evidence,
        String status,
        String adminNotes,
        String reviewedByName,
        LocalDateTime reviewedAt,
        LocalDateTime createdAt
) {
}
