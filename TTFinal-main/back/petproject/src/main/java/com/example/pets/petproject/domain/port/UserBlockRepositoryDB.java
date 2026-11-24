package com.example.pets.petproject.domain.port;

import com.example.pets.petproject.infraestructure.entity.UserBlockEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserBlockRepositoryDB extends JpaRepository<UserBlockEntity, Integer> {

    boolean existsByBlockerIdAndBlockedId(Integer blockerId, Integer blockedId);

    Optional<UserBlockEntity> findByBlockerIdAndBlockedId(Integer blockerId, Integer blockedId);

    List<UserBlockEntity> findByBlockerIdOrderByCreatedAtDesc(Integer blockerId);
}
