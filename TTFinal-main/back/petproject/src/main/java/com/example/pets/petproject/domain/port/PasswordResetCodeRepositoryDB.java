package com.example.pets.petproject.domain.port;

import com.example.pets.petproject.infraestructure.entity.PasswordResetCodeEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PasswordResetCodeRepositoryDB extends JpaRepository<PasswordResetCodeEntity, Integer> {
    Optional<PasswordResetCodeEntity> findFirstByUserIdAndUsedFalseOrderByCreatedAtDesc(Integer userId);
    List<PasswordResetCodeEntity> findByUserIdAndUsedFalse(Integer userId);
}
