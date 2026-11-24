package com.example.pets.petproject.domain.core;

import com.example.pets.petproject.domain.port.UserBlockRepositoryDB;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/**
 * Consultas de bloqueos entre usuarios. Un bloqueo corta el contacto en los dos sentidos:
 * ninguno puede escribirle al otro en un caso, ni mandarle solicitudes de adopcion o avisos.
 */
@Service
public class UserBlockService {

    private final UserBlockRepositoryDB repository;

    public UserBlockService(UserBlockRepositoryDB repository) {
        this.repository = repository;
    }

    /** true si {@code blockerId} bloqueo a {@code blockedId}. */
    public boolean hasBlocked(Integer blockerId, Integer blockedId) {
        if (blockerId == null || blockedId == null || blockerId.equals(blockedId)) {
            return false;
        }
        return repository.existsByBlockerIdAndBlockedId(blockerId, blockedId);
    }

    /** true si alguno de los dos bloqueo al otro. */
    public boolean blockedEitherWay(Integer a, Integer b) {
        return hasBlocked(a, b) || hasBlocked(b, a);
    }

    /**
     * Impide que {@code actorId} contacte a {@code otherId} si hay un bloqueo entre ambos.
     * El mensaje distingue quien bloqueo para que el usuario sepa como deshacerlo.
     */
    public void requireCanContact(Integer actorId, Integer otherId, String whenBlockedByOther) {
        if (hasBlocked(actorId, otherId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Bloqueaste a esta persona. Desbloqueala desde tu perfil para volver a contactarla.");
        }
        if (hasBlocked(otherId, actorId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, whenBlockedByOther);
        }
    }
}
