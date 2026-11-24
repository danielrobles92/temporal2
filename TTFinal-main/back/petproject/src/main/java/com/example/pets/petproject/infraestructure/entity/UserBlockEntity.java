package com.example.pets.petproject.infraestructure.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/** Un usuario (blocker) bloqueo a otro (blocked): ya no pueden escribirse ni contactarse. */
@Entity
@Table(name = "user_blocks")
@Getter
@Setter
public class UserBlockEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "block_id")
    private Integer blockId;

    @Column(name = "blocker_id", nullable = false)
    private Integer blockerId;

    @Column(name = "blocked_id", nullable = false)
    private Integer blockedId;

    /** Caso desde el que se bloqueo (solo informativo). */
    @Column(name = "case_id")
    private Integer caseId;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
