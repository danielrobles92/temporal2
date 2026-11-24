package com.example.pets.petproject.domain.model;

public record PotentialMatchDTO(
        Integer matchId,
        Integer reportId,
        Integer petId,
        String petName,
        String imageUrl,
        Integer score,
        Float visualScore,
        Float confidence,
        String reason,
        String status,
        String breed,
        Integer matchedReportId,
        /* Lo que detectó la red en las fotos del reporte propio y en las del candidato. */
        AiSummaryDTO reportAi,
        AiSummaryDTO candidateAi
) {}
