package com.example.pets.petproject.application;

import com.example.pets.petproject.domain.core.AdoptionAnswers;
import com.example.pets.petproject.domain.core.ContactData;
import com.example.pets.petproject.domain.core.NotificationService;
import com.example.pets.petproject.domain.core.UserBlockService;
import com.example.pets.petproject.domain.enums.AdoptionRequestStatus;
import com.example.pets.petproject.domain.enums.PetStatus;
import com.example.pets.petproject.domain.model.AdoptionRequestDTO;
import com.example.pets.petproject.domain.model.CreateAdoptionRequestDTO;
import com.example.pets.petproject.domain.model.ModerationDTO;
import com.example.pets.petproject.domain.model.UpdateAdoptionRequestDTO;
import com.example.pets.petproject.domain.port.AdoptionRequestRepositoryDB;
import com.example.pets.petproject.domain.port.CaseMessageRepositoryDB;
import com.example.pets.petproject.domain.port.CaseRepositoryDB;
import com.example.pets.petproject.domain.port.PetsRepositoryDB;
import com.example.pets.petproject.domain.port.UserRepositoryDB;
import com.example.pets.petproject.infraestructure.entity.AdoptionRequestEntity;
import com.example.pets.petproject.infraestructure.entity.CaseEntity;
import com.example.pets.petproject.infraestructure.entity.CaseMessageEntity;
import com.example.pets.petproject.infraestructure.entity.ImageEntity;
import com.example.pets.petproject.infraestructure.entity.PetsEntity;
import com.example.pets.petproject.security.AuthUtils;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Set;

@RestController
@RequestMapping("/adoption-requests")
@CrossOrigin
public class AdoptionRequestController {

    private final AdoptionRequestRepositoryDB repository;
    private final PetsRepositoryDB petsRepository;
    private final UserRepositoryDB userRepository;
    private final CaseRepositoryDB caseRepository;
    private final NotificationService notificationService;
    private final UserBlockService userBlockService;
    private final CaseMessageRepositoryDB caseMessageRepository;

    /** Estados en los que el caso de contacto ya termino. */
    private static final Set<String> CLOSED_CASE_STATUSES = Set.of("ADOPTED", "CANCELLED", "RESOLVED", "CLOSED");
    /** Que puede corregir quien envio la solicitud: todo, solo sus datos de contacto o nada. */
    static final String EDIT_FULL = "FULL";
    static final String EDIT_CONTACT = "CONTACT";
    static final String EDIT_NONE = "NONE";

    public AdoptionRequestController(AdoptionRequestRepositoryDB repository, PetsRepositoryDB petsRepository,
                                     UserRepositoryDB userRepository, CaseRepositoryDB caseRepository,
                                     NotificationService notificationService, UserBlockService userBlockService,
                                     CaseMessageRepositoryDB caseMessageRepository) {
        this.repository = repository;
        this.petsRepository = petsRepository;
        this.userRepository = userRepository;
        this.caseRepository = caseRepository;
        this.notificationService = notificationService;
        this.userBlockService = userBlockService;
        this.caseMessageRepository = caseMessageRepository;
    }

    /** Todas las solicitudes (con datos de contacto): solo el administrador. */
    @GetMapping
    public List<AdoptionRequestDTO> getAll() {
        if (!AuthUtils.isAdmin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo un administrador puede ver todas las solicitudes");
        }
        return repository.findAll().stream().map(this::toDto).toList();
    }

    /** Solicitudes que hizo un usuario: solo el propio usuario o un admin. */
    @GetMapping("/user/{userId}")
    public List<AdoptionRequestDTO> getByUser(@PathVariable Integer userId) {
        requireSelfOrAdmin(userId);
        return repository.findByUserId(userId).stream().map(this::toDto).toList();
    }

    /** Solicitudes recibidas por un publicador: solo el propio publicador o un admin. */
    @GetMapping("/owner/{ownerId}")
    public List<AdoptionRequestDTO> getByOwner(@PathVariable Integer ownerId) {
        requireSelfOrAdmin(ownerId);
        List<Integer> petIds = petsRepository.findByOwnerId(ownerId)
                .stream()
                .map(pet -> pet.getPetId())
                .toList();
        if (petIds.isEmpty()) {
            return List.of();
        }
        return repository.findByPetIdIn(petIds).stream().map(this::toDto).toList();
    }

    @PostMapping
    public AdoptionRequestDTO create(@RequestBody CreateAdoptionRequestDTO dto) {
        // RN-01: el solicitante es el usuario autenticado (no se confia en el cliente).
        Integer userId = AuthUtils.currentUserId() != null ? AuthUtils.currentUserId() : dto.userId();

        if (repository.existsByPetIdAndUserId(dto.petId(), userId)) {
            throw new RuntimeException("Ya enviaste una solicitud para este perro. Si te equivocaste en algo, editala en Solicitudes.");
        }

        PetsEntity pet = petsRepository.findById(dto.petId())
                .orElseThrow(() -> new RuntimeException("La publicacion ya no esta disponible"));
        if (pet.getOwnerId() != null && pet.getOwnerId().equals(userId)) {
            throw new RuntimeException("No puedes solicitar adopcion de tu propia publicacion");
        }
        // Solo se solicita la adopcion de perros disponibles (no adoptados, perdidos ni inactivos).
        if (pet.getStatus() != PetStatus.AVAILABLE) {
            throw new RuntimeException("Este perro ya no esta disponible para adopcion");
        }
        // Si alguno de los dos bloqueo al otro, no se pueden mandar solicitudes.
        userBlockService.requireCanContact(userId, pet.getOwnerId(),
                "No puedes enviar solicitudes a esta publicacion.");

        AdoptionRequestEntity entity = new AdoptionRequestEntity();
        entity.setPetId(dto.petId());
        entity.setUserId(userId);
        entity.setContactName(dto.contactName());
        entity.setContactEmail(dto.contactEmail());
        entity.setContactPhone(dto.contactPhone());
        entity.setMessage(dto.message());
        entity.setApplicantAnswers(AdoptionAnswers.toJson(AdoptionAnswers.clean(dto.answers())));
        AdoptionRequestDTO saved = toDto(repository.save(entity));

        // Notificar al duenio de la publicacion.
        notificationService.notify(pet.getOwnerId(), "ADOPTION_REQUEST",
                "Nueva solicitud de adopcion para " + pet.getName(),
                dto.contactName() + " quiere adoptar a " + pet.getName(),
                "/solicitudes");
        return saved;
    }

    /**
     * Quien envio la solicitud la corrige en lugar de mandar otra. Mientras esta pendiente puede
     * cambiar todo; con el caso de contacto abierto, solo sus datos de contacto (lo demas se dice
     * en el chat). Una solicitud terminada ya no se edita.
     */
    @PutMapping("/{id}")
    public AdoptionRequestDTO update(@PathVariable Integer id, @RequestBody UpdateAdoptionRequestDTO dto) {
        AdoptionRequestEntity entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Solicitud de adopcion no encontrada"));
        Integer me = AuthUtils.currentUserId();
        if (me == null || !me.equals(entity.getUserId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo quien envio la solicitud puede editarla");
        }
        PetsEntity pet = petsRepository.findById(entity.getPetId())
                .orElseThrow(() -> new RuntimeException("La publicacion ya no esta disponible"));
        userBlockService.requireCanContact(me, pet.getOwnerId(), "No puedes editar solicitudes de esta publicacion.");

        CaseEntity contactCase = caseRepository.findByAdoptionRequestId(id).orElse(null);
        String mode = editMode(entity, contactCase);
        if (EDIT_NONE.equals(mode)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Esta solicitud ya termino y no se puede editar");
        }

        String name = ContactData.requireName(dto.contactName());
        String email = ContactData.email(dto.contactEmail(), true);
        String phone = ContactData.phone(dto.contactPhone());
        String message = ContactData.clean(dto.message());
        if (message != null && message.length() > 1000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El mensaje admite como maximo 1000 caracteres");
        }
        boolean messageChanged = !Objects.equals(message, ContactData.clean(entity.getMessage()));
        if (EDIT_CONTACT.equals(mode) && dto.message() != null && messageChanged) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "El caso ya esta abierto: el mensaje ya no se cambia, escribelo en el chat del caso");
        }
        String answers = dto.answers() == null ? entity.getApplicantAnswers()
                : AdoptionAnswers.toJson(AdoptionAnswers.clean(dto.answers()));
        boolean answersChanged = !Objects.equals(answers, entity.getApplicantAnswers());
        if (EDIT_CONTACT.equals(mode) && answersChanged) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "El caso ya esta abierto: las respuestas ya no se cambian, platicalo en el chat del caso");
        }

        List<String> changed = ContactData.changedFields(entity.getContactName(), entity.getContactEmail(),
                entity.getContactPhone(), name, email, phone);
        if (changed.isEmpty() && (EDIT_CONTACT.equals(mode) || (!messageChanged && !answersChanged))) {
            return toDto(entity);   // nada que guardar
        }

        LocalDateTime now = LocalDateTime.now();
        entity.setContactName(name);
        entity.setContactEmail(email);
        entity.setContactPhone(phone);
        if (EDIT_FULL.equals(mode)) {
            entity.setMessage(message);
            entity.setApplicantAnswers(answers);
        }
        entity.setEditedAt(now);
        entity.setUpdatedAt(now);
        repository.save(entity);

        // Con el caso abierto, el cambio de datos queda a la vista en el chat.
        if (contactCase != null && !changed.isEmpty()) {
            String text = name + " actualizo sus datos de contacto (" + ContactData.joinSpanish(changed) + ").";
            CaseMessageEntity notice = new CaseMessageEntity();
            notice.setCaseId(contactCase.getCaseId());
            notice.setSenderName("Aviso automatico");
            notice.setMessage(text);
            caseMessageRepository.save(notice);
            contactCase.setLastMessage(text);
            contactCase.setUpdatedAt(now);
            caseRepository.save(contactCase);
        }

        notificationService.notify(pet.getOwnerId(), "ADOPTION_REQUEST_EDITED",
                name + " actualizo su solicitud",
                "Corrigio su solicitud para adoptar a " + pet.getName() + ".",
                contactCase != null ? "/casos?case=" + contactCase.getCaseId() : "/solicitudes");
        return toDto(entity);
    }

    /** FULL mientras esta pendiente, CONTACT con el caso abierto y NONE cuando ya termino. */
    private String editMode(AdoptionRequestEntity entity, CaseEntity contactCase) {
        if (entity.getStatus() == AdoptionRequestStatus.PENDING) {
            return EDIT_FULL;
        }
        if (entity.getStatus() == AdoptionRequestStatus.APPROVED
                && (contactCase == null || !CLOSED_CASE_STATUSES.contains(contactCase.getStatus()))) {
            return EDIT_CONTACT;
        }
        return EDIT_NONE;
    }

    @DeleteMapping("/{id}/cancel")
    public void cancel(@PathVariable Integer id) {
        cancelRequest(id);
    }

    @DeleteMapping("/{id}")
    public void cancelByDelete(@PathVariable Integer id) {
        cancelRequest(id);
    }

    @DeleteMapping("/{id}/admin")
    public void deleteByAdmin(@PathVariable Integer id) {
        if (!AuthUtils.isAdmin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo un administrador puede eliminar");
        }
        if (!repository.existsById(id)) {
            throw new RuntimeException("Solicitud de adopcion no encontrada");
        }
        repository.deleteById(id);
    }

    @PostMapping("/{id}/cancel")
    public void cancelByPost(@PathVariable Integer id) {
        cancelRequest(id);
    }

    /** Solo quien creo la solicitud (o un admin) puede cancelarla. */
    private void cancelRequest(Integer id) {
        AdoptionRequestEntity entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Solicitud de adopcion no encontrada"));
        if (!AuthUtils.isSelfOrAdmin(entity.getUserId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo quien creo la solicitud puede cancelarla");
        }
        if (entity.getStatus() != AdoptionRequestStatus.PENDING) {
            throw new RuntimeException("Solo puedes cancelar solicitudes pendientes");
        }
        repository.deleteById(id);
    }

    @PatchMapping("/{id}/decision")
    public AdoptionRequestDTO decide(@PathVariable Integer id, @RequestBody ModerationDTO dto) {
        AdoptionRequestEntity entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Solicitud de adopcion no encontrada"));

        // RN-10: solo el duenio de la publicacion (o un admin) puede aprobar/rechazar.
        PetsEntity pet = petsRepository.findById(entity.getPetId()).orElse(null);
        Integer ownerId = pet != null ? pet.getOwnerId() : null;
        if (!AuthUtils.isSelfOrAdmin(ownerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Solo el responsable de la publicacion puede decidir la solicitud");
        }

        entity.setStatus(com.example.pets.petproject.domain.core.EnumParser.parse(
                AdoptionRequestStatus.class, dto.status(), "Estado"));
        entity.setDecisionNotes(dto.notes());
        entity.setUpdatedAt(LocalDateTime.now());
        AdoptionRequestDTO result = toDto(repository.save(entity));

        // Notificar la decision al solicitante.
        String decision = entity.getStatus() == AdoptionRequestStatus.APPROVED ? "aprobada"
                : entity.getStatus() == AdoptionRequestStatus.REJECTED ? "rechazada"
                : entity.getStatus().name().toLowerCase();
        notificationService.notify(entity.getUserId(), "ADOPTION_DECISION",
                "Tu solicitud de adopcion fue " + decision,
                result.petName() != null ? "Solicitud sobre " + result.petName() : null,
                "/solicitudes");
        return result;
    }

    private void requireSelfOrAdmin(Integer userId) {
        if (!AuthUtils.isSelfOrAdmin(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No autorizado");
        }
    }

    private AdoptionRequestDTO toDto(AdoptionRequestEntity e) {
        PetsEntity pet = petsRepository.findById(e.getPetId()).orElse(null);
        String petName = pet != null ? pet.getName() : null;
        String petOwnerName = pet != null && pet.getOwnerId() != null
                ? userRepository.findById(pet.getOwnerId()).map(user -> user.getUsername()).orElse(null)
                : null;
        String petImageUrl = pet != null && pet.getImages() != null && !pet.getImages().isEmpty()
                ? pet.getImages().stream()
                        .filter(image -> Boolean.TRUE.equals(image.getIsPrimary()))
                        .findFirst()
                        .or(() -> pet.getImages().stream().findFirst())
                        .map(ImageEntity::getUrlImage)
                        .orElse(null)
                : null;

        CaseEntity contactCase = caseRepository.findByAdoptionRequestId(e.getRequestId()).orElse(null);
        // Termina cuando su caso se cierra (adoptado/cancelado) o cuando se rechaza sin abrir caso.
        LocalDateTime finishedAt = contactCase != null
                ? contactCase.getClosedAt()
                : e.getStatus() == AdoptionRequestStatus.REJECTED ? e.getUpdatedAt() : null;

        return new AdoptionRequestDTO(
                e.getRequestId(),
                e.getPetId(),
                petName,
                petImageUrl,
                pet != null ? pet.getBreed() : null,
                petOwnerName,
                e.getUserId(),
                e.getContactName(),
                e.getContactEmail(),
                e.getContactPhone(),
                e.getMessage(),
                e.getStatus(),
                e.getDecisionNotes(),
                e.getCreatedAt(),
                e.getUpdatedAt(),
                pet != null ? pet.getCreatedAt() : null,
                contactCase != null ? contactCase.getCaseId() : null,
                contactCase != null ? contactCase.getStatus() : null,
                contactCase != null ? contactCase.getCreatedAt() : null,
                finishedAt,
                e.getEditedAt(),
                editMode(e, contactCase),
                AdoptionAnswers.fromJson(e.getApplicantAnswers())
        );
    }
}
