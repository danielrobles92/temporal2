package com.example.pets.petproject.domain.port;

import com.example.pets.petproject.infraestructure.entity.ReportSightingEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ReportSightingRepositoryDB extends JpaRepository<ReportSightingEntity, Integer> {
    List<ReportSightingEntity> findByReportIdOrderByCreatedAtDesc(Integer reportId);

    /** El aviso que una persona ya envio sobre un reporte (solo hay uno por persona y reporte). */
    Optional<ReportSightingEntity> findFirstByReportIdAndUserIdOrderByCreatedAtAsc(Integer reportId, Integer userId);

    /** Avisos que envio una persona ("Avisos enviados"). */
    List<ReportSightingEntity> findByUserIdOrderByCreatedAtDesc(Integer userId);
}
