package com.example.pets.petproject.domain.model;

import java.time.LocalDateTime;
import java.util.List;

/** Otro avistamiento de la misma persona sobre el mismo reporte. */
public record SightingEntryDTO(
        Integer entryId,
        String location,
        Double latitude,
        Double longitude,
        String message,
        List<String> imageUrls,
        LocalDateTime createdAt
) {
}
