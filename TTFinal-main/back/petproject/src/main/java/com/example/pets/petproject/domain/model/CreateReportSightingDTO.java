package com.example.pets.petproject.domain.model;

public record CreateReportSightingDTO(
        Integer userId,
        String contactName,
        String contactEmail,
        String contactPhone,
        String location,
        Double latitude,
        Double longitude,
        String message
) {}
