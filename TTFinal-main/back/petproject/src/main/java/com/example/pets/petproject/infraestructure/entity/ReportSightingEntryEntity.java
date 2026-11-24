package com.example.pets.petproject.infraestructure.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/** Otro avistamiento que la misma persona agrego a su aviso sobre un reporte. */
@Entity
@Table(name = "report_sighting_entries")
@Getter
@Setter
public class ReportSightingEntryEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "entry_id")
    private Integer entryId;

    @Column(name = "sighting_id", nullable = false)
    private Integer sightingId;

    @Column(length = 255)
    private String location;

    private Double latitude;

    private Double longitude;

    @Column(nullable = false, length = 2000)
    private String message;

    @Column(name = "image_urls", length = 4000)
    private String imageUrls;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
