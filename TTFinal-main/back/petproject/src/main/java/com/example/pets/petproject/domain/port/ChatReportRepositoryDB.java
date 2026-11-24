package com.example.pets.petproject.domain.port;

import com.example.pets.petproject.infraestructure.entity.ChatReportEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatReportRepositoryDB extends JpaRepository<ChatReportEntity, Integer> {

    List<ChatReportEntity> findAllByOrderByCreatedAtDesc();

    boolean existsByCaseIdAndReporterIdAndStatus(Integer caseId, Integer reporterId, String status);

    long countByReportedUserId(Integer reportedUserId);
}
