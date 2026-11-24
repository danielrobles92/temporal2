package com.example.pets.petproject.infraestructure.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/** Reporte de mal uso en el chat de un caso, para que lo revise el administrador. */
@Entity
@Table(name = "chat_reports")
@Getter
@Setter
public class ChatReportEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "chat_report_id")
    private Integer chatReportId;

    @Column(name = "case_id")
    private Integer caseId;

    /** Mensaje concreto que se reporto (opcional). */
    @Column(name = "message_id")
    private Integer messageId;

    @Column(name = "reporter_id", nullable = false)
    private Integer reporterId;

    @Column(name = "reported_user_id")
    private Integer reportedUserId;

    /** Titulo del caso al momento del reporte (se conserva si el caso se borra). */
    @Column(name = "case_title", length = 180)
    private String caseTitle;

    @Column(nullable = false, length = 30)
    private String reason;

    @Column(length = 1000)
    private String details;

    /** Copia de los mensajes de la persona reportada al momento del reporte. */
    @Column(columnDefinition = "TEXT")
    private String evidence;

    @Column(nullable = false, length = 20)
    private String status = "PENDING";

    @Column(name = "admin_notes", length = 1000)
    private String adminNotes;

    @Column(name = "reviewed_by")
    private Integer reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
