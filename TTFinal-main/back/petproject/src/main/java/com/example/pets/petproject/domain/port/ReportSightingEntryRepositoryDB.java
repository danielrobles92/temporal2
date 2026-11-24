package com.example.pets.petproject.domain.port;

import com.example.pets.petproject.infraestructure.entity.ReportSightingEntryEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReportSightingEntryRepositoryDB extends JpaRepository<ReportSightingEntryEntity, Integer> {

    List<ReportSightingEntryEntity> findBySightingIdOrderByCreatedAtAsc(Integer sightingId);
}
