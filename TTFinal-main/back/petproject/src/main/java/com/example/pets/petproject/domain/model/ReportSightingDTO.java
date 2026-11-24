package com.example.pets.petproject.domain.model;

import java.time.LocalDateTime;
import java.util.List;

public record ReportSightingDTO(
        Integer sightingId,
        Integer reportId,
        Integer userId,
        String contactName,
        String contactEmail,
        String contactPhone,
        String location,
        Double latitude,
        Double longitude,
        String message,
        List<String> imageUrls,
        String status,
        String ownerReply,
        String reportName,
        Integer reportOwnerId,
        String reportOwnerName,
        LocalDateTime caseOpenedAt,
        LocalDateTime repliedAt,
        LocalDateTime createdAt,
        // Correccion de quien aviso y que tanto puede corregir todavia (FULL, CONTACT o NONE).
        LocalDateTime editedAt,
        String editMode,
        // Caso de contacto (si se abrio) y datos del reporte para la lista "Avisos enviados".
        Integer caseId,
        String caseStatus,
        String reportType,
        String reportImageUrl,
        // Otros avistamientos que la misma persona agrego despues.
        List<SightingEntryDTO> entries
) {}
