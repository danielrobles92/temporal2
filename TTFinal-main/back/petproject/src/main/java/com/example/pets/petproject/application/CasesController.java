package com.example.pets.petproject.application;

import com.example.pets.petproject.domain.core.AdoptionAnswers;
import com.example.pets.petproject.domain.enums.AdoptionRequestStatus;
import com.example.pets.petproject.domain.enums.PetStatus;
import com.example.pets.petproject.domain.enums.ReportStatus;
import com.example.pets.petproject.domain.model.CaseDTO;
import com.example.pets.petproject.domain.model.CaseMessageDTO;
import com.example.pets.petproject.domain.model.CaseStatusDTO;
import com.example.pets.petproject.domain.model.CreateCaseMessageDTO;
import com.example.pets.petproject.domain.core.NotificationService;
import com.example.pets.petproject.domain.core.UserBlockService;
import com.example.pets.petproject.domain.model.NotificationSummaryDTO;
import com.example.pets.petproject.domain.port.*;
import com.example.pets.petproject.domain.service.ImageStorageService;
import com.example.pets.petproject.infraestructure.entity.*;
import com.example.pets.petproject.security.AuthUtils;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/cases")
@CrossOrigin
public class CasesController {

    /** Estados en los que un caso se considera terminado. */
    private static final Set<String> CLOSED_STATUSES = Set.of("ADOPTED", "CANCELLED", "RESOLVED", "CLOSED");
    /** Estados que puede tener un caso (los que usan Casos.js y el cierre automatico). */
    private static final List<String> CASE_STATUSES = List.of("OPEN", "ADOPTED", "RESOLVED", "CANCELLED", "CLOSED");
    /** Nota de la solicitud cuando el perro lo adopto otra persona. */
    private static final String PET_ADOPTED_BY_OTHER = "PET_ADOPTED_BY_OTHER";
    private static final String AUTOMATIC_SENDER = "Aviso automatico";

    private final CaseRepositoryDB caseRepository;
    private final CaseMessageRepositoryDB messageRepository;
    private final AdoptionRequestRepositoryDB adoptionRequestRepository;
    private final ReportSightingRepositoryDB sightingRepository;
    private final LostPetReportRepositoryDB reportRepository;
    private final PetsRepositoryDB petsRepository;
    private final UserRepositoryDB userRepository;
    private final ImageStorageService imageStorageService;
    private final NotificationService notificationService;
    private final UserBlockService userBlockService;
    private final ReportSightingEntryRepositoryDB sightingEntryRepository;

    public CasesController(
            CaseRepositoryDB caseRepository,
            CaseMessageRepositoryDB messageRepository,
            AdoptionRequestRepositoryDB adoptionRequestRepository,
            ReportSightingRepositoryDB sightingRepository,
            LostPetReportRepositoryDB reportRepository,
            PetsRepositoryDB petsRepository,
            UserRepositoryDB userRepository,
            ImageStorageService imageStorageService,
            NotificationService notificationService,
            UserBlockService userBlockService,
            ReportSightingEntryRepositoryDB sightingEntryRepository
    ) {
        this.caseRepository = caseRepository;
        this.messageRepository = messageRepository;
        this.adoptionRequestRepository = adoptionRequestRepository;
        this.sightingRepository = sightingRepository;
        this.reportRepository = reportRepository;
        this.petsRepository = petsRepository;
        this.userRepository = userRepository;
        this.imageStorageService = imageStorageService;
        this.notificationService = notificationService;
        this.userBlockService = userBlockService;
        this.sightingEntryRepository = sightingEntryRepository;
    }

    // --- Control de acceso -------------------------------------------------------------

    /** Carga el caso y exige que quien llama participe en el (publicador o contacto) o sea admin. */
    private CaseEntity loadCaseWithAccess(Integer caseId) {
        CaseEntity caseEntity = caseRepository.findById(caseId)
                .orElseThrow(() -> new RuntimeException("Caso no encontrado"));
        Integer me = AuthUtils.currentUserId();
        boolean participates = me != null
                && (me.equals(caseEntity.getOwnerId()) || me.equals(caseEntity.getParticipantId()));
        if (!participates && !AuthUtils.isAdmin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No participas en este caso");
        }
        return caseEntity;
    }

    private void requireSelfOrAdmin(Integer userId) {
        if (!AuthUtils.isSelfOrAdmin(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No autorizado");
        }
    }

    private void requireAdmin() {
        if (!AuthUtils.isAdmin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo un administrador puede hacer esto");
        }
    }

    /**
     * Nadie puede escribir en un chat bloqueado ni a una persona con la que hay un bloqueo
     * (en cualquiera de los dos sentidos). El administrador no queda sujeto a los bloqueos.
     */
    private void requireCanWrite(CaseEntity caseEntity, Integer senderId) {
        if (senderId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Inicia sesion para escribir en el caso");
        }
        if (AuthUtils.isAdmin() && !caseEntity.getOwnerId().equals(senderId)
                && !senderId.equals(caseEntity.getParticipantId())) {
            return;
        }
        if (caseEntity.getBlockedBy() != null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, senderId.equals(caseEntity.getBlockedBy())
                    ? "Bloqueaste este chat. Desbloquealo para volver a escribir."
                    : "Este chat esta bloqueado y ya no admite mensajes.");
        }
        Integer other = senderId.equals(caseEntity.getOwnerId()) ? caseEntity.getParticipantId() : caseEntity.getOwnerId();
        userBlockService.requireCanContact(senderId, other, "Esta persona ya no acepta mensajes tuyos.");
    }

    /** true si en este caso no se puede escribir (chat bloqueado o bloqueo entre las dos personas). */
    private boolean writingBlocked(CaseEntity caseEntity) {
        return caseEntity.getBlockedBy() != null
                || userBlockService.blockedEitherWay(caseEntity.getOwnerId(), caseEntity.getParticipantId());
    }

    /** Texto fijo del cambio de estado cuando el chat esta bloqueado (no se acepta texto libre). */
    private static String standardStatusMessage(String status) {
        return switch (status) {
            case "ADOPTED" -> "Adopcion completada.";
            case "RESOLVED" -> "Caso resuelto.";
            case "CANCELLED" -> "Caso cancelado.";
            case "CLOSED" -> "Caso cerrado.";
            default -> "Caso reabierto.";
        };
    }

    /** El autor de una accion es el usuario de la sesion, no el id que mande el cliente. */
    private Integer currentUserOr(Integer fallback) {
        Integer me = AuthUtils.currentUserId();
        return me != null ? me : fallback;
    }

    /** Notifica al otro participante del caso (el que no realizo la accion). */
    private void notifyCounterpart(CaseEntity caseEntity, Integer actorId, String type, String title, String message) {
        Integer recipient = actorId != null && actorId.equals(caseEntity.getOwnerId())
                ? caseEntity.getParticipantId()
                : caseEntity.getOwnerId();
        if (recipient != null && !recipient.equals(actorId)) {
            notificationService.notify(recipient, type, title, message, "/casos");
        }
    }

    /** Casos de un usuario: solo el propio usuario o un admin. */
    @GetMapping("/user/{userId}")
    public List<CaseDTO> getByUser(@PathVariable Integer userId) {
        requireSelfOrAdmin(userId);
        return caseRepository.findByOwnerIdOrParticipantIdOrderByUpdatedAtDesc(userId, userId)
                .stream()
                .map(caseEntity -> toDto(caseEntity, true))
                .toList();
    }

    /** Todos los casos: solo el administrador. */
    @GetMapping
    public List<CaseDTO> getAll() {
        requireAdmin();
        return caseRepository.findAll().stream()
                .sorted(Comparator.comparing(CaseEntity::getUpdatedAt).reversed())
                .map(caseEntity -> toDto(caseEntity, true))
                .toList();
    }

    @GetMapping("/{caseId}")
    public CaseDTO getById(@PathVariable Integer caseId) {
        return toDto(loadCaseWithAccess(caseId), true);
    }

    /** Abrir el caso de contacto de una solicitud: solo el publicador del perro (o un admin). */
    @PostMapping("/adoption/{requestId}")
    public CaseDTO createAdoptionCase(@PathVariable Integer requestId) {
        AdoptionRequestEntity request = adoptionRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Solicitud de adopcion no encontrada"));
        Integer petOwnerId = petsRepository.findById(request.getPetId()).map(PetsEntity::getOwnerId).orElse(null);
        if (!AuthUtils.isSelfOrAdmin(petOwnerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo el responsable de la publicacion puede abrir el caso");
        }
        return caseRepository.findByAdoptionRequestId(requestId)
                .map(caseEntity -> toDto(caseEntity, true))
                .orElseGet(() -> {
                    userBlockService.requireCanContact(petOwnerId, request.getUserId(),
                            "Esta persona ya no acepta contacto tuyo.");
                    return createAdoptionCaseInternal(requestId);
                });
    }

    /** Abrir el caso de un aviso: solo el duenio del reporte (o un admin). */
    @PostMapping("/sighting/{sightingId}")
    public CaseDTO createSightingCase(@PathVariable Integer sightingId) {
        ReportSightingEntity sighting = sightingRepository.findById(sightingId)
                .orElseThrow(() -> new RuntimeException("Aviso no encontrado"));
        Integer reportOwnerId = reportRepository.findById(sighting.getReportId())
                .map(LostPetReportEntity::getReporterId).orElse(null);
        if (!AuthUtils.isSelfOrAdmin(reportOwnerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo el duenio del reporte puede abrir el caso");
        }
        return caseRepository.findByReportSightingId(sightingId)
                .map(caseEntity -> toDto(caseEntity, true))
                .orElseGet(() -> {
                    userBlockService.requireCanContact(reportOwnerId, sighting.getUserId(),
                            "Esta persona ya no acepta contacto tuyo.");
                    return createSightingCaseInternal(sightingId);
                });
    }

    @PostMapping("/{caseId}/messages")
    public CaseDTO addMessage(@PathVariable Integer caseId, @RequestBody CreateCaseMessageDTO dto) {
        CaseEntity caseEntity = loadCaseWithAccess(caseId);
        Integer senderId = currentUserOr(dto.senderId());
        requireCanWrite(caseEntity, senderId);
        return addMessageInternal(caseEntity, senderId, dto.message(), List.of());
    }

    @PostMapping(value = "/{caseId}/messages", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public CaseDTO addMessageWithImages(
            @PathVariable Integer caseId,
            @RequestPart("message") CreateCaseMessageDTO dto,
            @RequestPart(value = "images", required = false) List<MultipartFile> images
    ) {
        // Se valida el acceso (y que el chat no este bloqueado) antes de guardar las fotos.
        CaseEntity caseEntity = loadCaseWithAccess(caseId);
        Integer senderId = currentUserOr(dto.senderId());
        requireCanWrite(caseEntity, senderId);
        List<String> imagePaths = images == null ? List.of() : images.stream()
                .map(imageStorageService::storeCaseMessageImage)
                .filter(path -> path != null && !path.isBlank())
                .toList();
        return addMessageInternal(caseEntity, senderId, dto.message(), imagePaths);
    }

    private CaseDTO addMessageInternal(CaseEntity caseEntity, Integer senderId, String messageText, List<String> imagePaths) {
        Integer caseId = caseEntity.getCaseId();
        boolean hasMessage = messageText != null && !messageText.isBlank();
        boolean hasImages = imagePaths != null && !imagePaths.isEmpty();
        if (!hasMessage && !hasImages) {
            throw new IllegalArgumentException("El mensaje o las imagenes son requeridos");
        }

        CaseMessageEntity message = new CaseMessageEntity();
        message.setCaseId(caseId);
        message.setSenderId(senderId);
        message.setSenderName(resolveUserName(senderId));
        message.setMessage(hasMessage ? messageText.trim() : "Fotos adjuntas");
        message.setImageUrls(joinImageUrls(imagePaths));
        messageRepository.save(message);

        caseEntity.setLastMessage(hasMessage ? messageText.trim() : "Fotos adjuntas");
        caseEntity.setUpdatedAt(LocalDateTime.now());
        caseRepository.save(caseEntity);

        // Notificar al otro participante del caso.
        notifyCounterpart(caseEntity, senderId, "CASE_MESSAGE",
                "Nuevo mensaje en: " + caseEntity.getTitle(),
                hasMessage ? messageText.trim() : "Te enviaron fotos");

        return toDto(caseEntity, true);
    }

    /** Cambiar el estado (adoptado, cancelado, resuelto...): solo el publicador del caso o un admin. */
    @PatchMapping("/{caseId}/status")
    public CaseDTO updateStatus(@PathVariable Integer caseId, @RequestBody CaseStatusDTO dto) {
        CaseEntity caseEntity = caseRepository.findById(caseId)
                .orElseThrow(() -> new RuntimeException("Caso no encontrado"));
        if (!AuthUtils.isSelfOrAdmin(caseEntity.getOwnerId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo el responsable de la publicacion puede cambiar el estado del caso");
        }
        // Antes aceptaba cualquier texto y lo guardaba como estado del caso (RNF-04).
        com.example.pets.petproject.domain.core.EnumParser.requireOneOf(dto.status(), CASE_STATUSES, "Estado del caso");
        Integer actorId = currentUserOr(dto.actorId());

        LocalDateTime now = LocalDateTime.now();
        caseEntity.setStatus(dto.status());
        caseEntity.setUpdatedAt(now);
        // Fecha de cierre: se fija al pasar a un estado final y se borra si el caso se reabre.
        caseEntity.setClosedAt(CLOSED_STATUSES.contains(dto.status()) ? now : null);

        // La solicitud de adopcion ligada refleja como termino el caso (Solicitudes lo muestra).
        if (caseEntity.getAdoptionRequestId() != null) {
            adoptionRequestRepository.findById(caseEntity.getAdoptionRequestId()).ifPresent(request -> {
                if ("ADOPTED".equals(dto.status())) {
                    request.setDecisionNotes("ADOPTED");
                } else if (CLOSED_STATUSES.contains(dto.status())) {
                    request.setDecisionNotes("CANCELLED_AFTER_CONTACT");
                } else {
                    request.setDecisionNotes("CONTACT_CASE_OPENED");
                }
                request.setUpdatedAt(now);
                adoptionRequestRepository.save(request);
            });
        }

        // Con el chat bloqueado el estado se puede seguir cambiando, pero sin texto libre
        // (si no, el cambio de estado serviria para seguir escribiendole a la otra persona).
        String statusText = dto.message() == null ? "" : dto.message().trim();
        if (!statusText.isEmpty() && !AuthUtils.isAdmin() && writingBlocked(caseEntity)) {
            statusText = standardStatusMessage(dto.status());
        }
        if (!statusText.isEmpty()) {
            CaseMessageEntity message = new CaseMessageEntity();
            message.setCaseId(caseId);
            message.setSenderId(actorId);
            message.setSenderName(resolveUserName(actorId));
            message.setMessage(statusText);
            messageRepository.save(message);
            caseEntity.setLastMessage(statusText);
        }

        if ("ADOPTED".equals(dto.status()) && caseEntity.getPetId() != null) {
            petsRepository.findById(caseEntity.getPetId()).ifPresent(pet -> {
                pet.setStatus(PetStatus.ADOPTED);
                petsRepository.save(pet);
            });
            if ("ADOPTION".equals(caseEntity.getCaseType())) {
                closeOtherApplicants(caseEntity, now);
            }
        }

        if ("RESOLVED".equals(dto.status()) && caseEntity.getReportId() != null) {
            reportRepository.findById(caseEntity.getReportId()).ifPresent(report -> {
                report.setStatus(ReportStatus.RESOLVED);
                report.setUpdatedAt(LocalDateTime.now());
                reportRepository.save(report);
            });
        }

        // Notificar el cambio de estado al otro participante.
        notifyCounterpart(caseEntity, actorId, "CASE_STATUS",
                "Caso actualizado: " + caseEntity.getTitle(),
                "Nuevo estado: " + dto.status());

        return toDto(caseRepository.save(caseEntity), true);
    }

    /**
     * El perro ya fue adoptado por el solicitante de {@code adoptedCase}: se cierran los casos
     * abiertos de los demas solicitantes (estado CLOSED) y se rechazan sus solicitudes que seguian
     * pendientes. A cada persona se le deja un mensaje en su caso y una notificacion.
     */
    private void closeOtherApplicants(CaseEntity adoptedCase, LocalDateTime now) {
        Integer petId = adoptedCase.getPetId();
        String petName = petsRepository.findById(petId).map(PetsEntity::getName).orElse("El perro");
        String closingText = petName + " fue adoptado por otro solicitante. Este caso se cerro automaticamente.";

        for (CaseEntity other : caseRepository.findByPetIdAndCaseType(petId, "ADOPTION")) {
            if (other.getCaseId().equals(adoptedCase.getCaseId()) || CLOSED_STATUSES.contains(other.getStatus())) {
                continue;
            }
            other.setStatus("CLOSED");
            other.setClosedAt(now);
            other.setUpdatedAt(now);
            other.setLastMessage(closingText);
            caseRepository.save(other);

            CaseMessageEntity message = new CaseMessageEntity();
            message.setCaseId(other.getCaseId());
            message.setSenderName(AUTOMATIC_SENDER);
            message.setMessage(closingText);
            messageRepository.save(message);

            if (other.getAdoptionRequestId() != null) {
                adoptionRequestRepository.findById(other.getAdoptionRequestId()).ifPresent(request -> {
                    request.setDecisionNotes(PET_ADOPTED_BY_OTHER);
                    request.setUpdatedAt(now);
                    adoptionRequestRepository.save(request);
                });
            }

            notificationService.notify(other.getParticipantId(), "CASE_STATUS",
                    petName + " ya fue adoptado",
                    "El publicador eligio a otro solicitante, asi que tu caso se cerro. Gracias por tu interes.",
                    "/casos?case=" + other.getCaseId());
        }

        // Solicitudes que aun no tenian caso de contacto: se rechazan y se avisa a quien las hizo.
        for (AdoptionRequestEntity request : adoptionRequestRepository.findByPetIdIn(List.of(petId))) {
            if (request.getRequestId().equals(adoptedCase.getAdoptionRequestId())
                    || request.getStatus() != AdoptionRequestStatus.PENDING) {
                continue;
            }
            request.setStatus(AdoptionRequestStatus.REJECTED);
            request.setDecisionNotes(PET_ADOPTED_BY_OTHER);
            request.setUpdatedAt(now);
            adoptionRequestRepository.save(request);

            notificationService.notify(request.getUserId(), "ADOPTION_DECISION",
                    petName + " ya fue adoptado",
                    "Tu solicitud se cerro porque el perro fue adoptado por otra persona.",
                    "/solicitudes");
        }
    }

    @DeleteMapping("/{caseId}")
    public void deleteCase(@PathVariable Integer caseId) {
        requireAdmin();
        if (!caseRepository.existsById(caseId)) {
            throw new RuntimeException("Caso no encontrado");
        }
        caseRepository.deleteById(caseId);
    }

    @GetMapping("/notifications/{userId}")
    public NotificationSummaryDTO getNotifications(@PathVariable Integer userId) {
        requireSelfOrAdmin(userId);
        List<Integer> petIds = petsRepository.findByOwnerId(userId).stream()
                .map(PetsEntity::getPetId)
                .toList();
        long adoptionRequests = petIds.isEmpty() ? 0 : adoptionRequestRepository.findByPetIdIn(petIds).stream()
                .filter(request -> request.getStatus() == AdoptionRequestStatus.PENDING)
                .count();
        long sightings = reportRepository.findByReporterId(userId).stream()
                .flatMap(report -> sightingRepository.findByReportIdOrderByCreatedAtDesc(report.getReportId()).stream())
                .filter(sighting -> "NEW".equals(sighting.getStatus()))
                .count();
        long openCases = caseRepository.findByOwnerIdOrParticipantIdOrderByUpdatedAtDesc(userId, userId).stream()
                .filter(item -> !CLOSED_STATUSES.contains(item.getStatus()))
                .count();
        return new NotificationSummaryDTO(adoptionRequests, sightings, openCases, adoptionRequests + sightings + openCases);
    }

    private CaseDTO createAdoptionCaseInternal(Integer requestId) {
        AdoptionRequestEntity request = adoptionRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Solicitud de adopcion no encontrada"));
        PetsEntity pet = petsRepository.findById(request.getPetId())
                .orElseThrow(() -> new RuntimeException("Mascota no encontrada"));

        CaseEntity caseEntity = new CaseEntity();
        caseEntity.setCaseType("ADOPTION");
        caseEntity.setStatus("OPEN");
        caseEntity.setPetId(pet.getPetId());
        caseEntity.setAdoptionRequestId(request.getRequestId());
        caseEntity.setOwnerId(pet.getOwnerId());
        caseEntity.setParticipantId(request.getUserId());
        caseEntity.setTitle("Adopcion de " + pet.getName());
        caseEntity.setLastMessage(request.getMessage());
        caseEntity = caseRepository.save(caseEntity);

        request.setStatus(AdoptionRequestStatus.APPROVED);
        request.setDecisionNotes("CONTACT_CASE_OPENED");
        request.setUpdatedAt(LocalDateTime.now());
        adoptionRequestRepository.save(request);

        // Primer mensaje del chat: lo que escribio el solicitante y sus respuestas a las preguntas.
        String answers = AdoptionAnswers.toText(request.getApplicantAnswers());
        String first = request.getMessage() == null || request.getMessage().isBlank() ? answers
                : answers == null ? request.getMessage() : request.getMessage().trim() + "\n\n" + answers;
        addSystemMessage(caseEntity.getCaseId(), request.getUserId(), request.getContactName(), first);
        return toDto(caseEntity, true);
    }

    private CaseDTO createSightingCaseInternal(Integer sightingId) {
        ReportSightingEntity sighting = sightingRepository.findById(sightingId)
                .orElseThrow(() -> new RuntimeException("Aviso no encontrado"));
        LostPetReportEntity report = reportRepository.findById(sighting.getReportId())
                .orElseThrow(() -> new RuntimeException("Reporte no encontrado"));

        CaseEntity caseEntity = new CaseEntity();
        caseEntity.setCaseType("LOST");
        caseEntity.setStatus("OPEN");
        caseEntity.setReportId(report.getReportId());
        caseEntity.setReportSightingId(sighting.getSightingId());
        caseEntity.setOwnerId(report.getReporterId());
        caseEntity.setParticipantId(sighting.getUserId());
        caseEntity.setTitle("Aviso sobre " + report.getName());
        caseEntity.setLastMessage(sighting.getMessage());
        caseEntity = caseRepository.save(caseEntity);

        sighting.setStatus("CASE_OPENED");
        sighting.setCaseOpenedAt(LocalDateTime.now());
        sightingRepository.save(sighting);

        addSystemMessage(caseEntity.getCaseId(), sighting.getUserId(), sighting.getContactName(), sighting.getMessage());
        // Los otros avistamientos que la persona agrego a su aviso tambien quedan en el chat.
        for (ReportSightingEntryEntity entry : sightingEntryRepository.findBySightingIdOrderByCreatedAtAsc(sighting.getSightingId())) {
            CaseMessageEntity message = new CaseMessageEntity();
            message.setCaseId(caseEntity.getCaseId());
            message.setSenderId(sighting.getUserId());
            message.setSenderName(sighting.getContactName() == null ? resolveUserName(sighting.getUserId()) : sighting.getContactName());
            message.setMessage(ReportsController.describeEntry(entry));
            if (entry.getImageUrls() != null && !entry.getImageUrls().isBlank()) {
                message.setImageUrls(String.join("\n", entry.getImageUrls().split(",")));
            }
            messageRepository.save(message);
        }
        return toDto(caseEntity, true);
    }

    private void addSystemMessage(Integer caseId, Integer senderId, String senderName, String messageText) {
        if (messageText == null || messageText.isBlank()) {
            return;
        }
        CaseMessageEntity message = new CaseMessageEntity();
        message.setCaseId(caseId);
        message.setSenderId(senderId);
        message.setSenderName(senderName == null || senderName.isBlank() ? resolveUserName(senderId) : senderName);
        message.setMessage(messageText.trim());
        messageRepository.save(message);
    }

    private CaseDTO toDto(CaseEntity caseEntity, boolean includeMessages) {
        PetsEntity pet = caseEntity.getPetId() == null ? null : petsRepository.findById(caseEntity.getPetId()).orElse(null);
        LostPetReportEntity report = caseEntity.getReportId() == null ? null : reportRepository.findById(caseEntity.getReportId()).orElse(null);
        AdoptionRequestEntity adoptionRequest = caseEntity.getAdoptionRequestId() == null ? null : adoptionRequestRepository.findById(caseEntity.getAdoptionRequestId()).orElse(null);
        ReportSightingEntity sighting = caseEntity.getReportSightingId() == null ? null : sightingRepository.findById(caseEntity.getReportSightingId()).orElse(null);
        UserEntity owner = userRepository.findById(caseEntity.getOwnerId()).orElse(null);
        UserEntity participant = caseEntity.getParticipantId() == null ? null : userRepository.findById(caseEntity.getParticipantId()).orElse(null);

        String imageUrl = null;
        if (pet != null && pet.getImages() != null && !pet.getImages().isEmpty()) {
            imageUrl = pet.getImages().stream()
                    .min(Comparator.comparing(image -> !Boolean.TRUE.equals(image.getIsPrimary())))
                    .map(ImageEntity::getUrlImage)
                    .orElse(null);
        }
        if (imageUrl == null && report != null) {
            imageUrl = report.getImageUrl();
        }

        String participantName = participant != null ? participant.getUsername() : null;
        String participantEmail = participant != null ? participant.getEmail() : null;
        String participantPhone = participant != null ? participant.getPhone() : null;
        if (adoptionRequest != null) {
            participantName = adoptionRequest.getContactName();
            participantEmail = adoptionRequest.getContactEmail();
            participantPhone = adoptionRequest.getContactPhone();
        }
        if (sighting != null) {
            participantName = sighting.getContactName();
            participantEmail = sighting.getContactEmail();
            participantPhone = sighting.getContactPhone();
        }

        // Bloqueos vistos desde quien consulta.
        Integer me = AuthUtils.currentUserId();
        Integer counterpartId = me != null && me.equals(caseEntity.getOwnerId())
                ? caseEntity.getParticipantId()
                : caseEntity.getOwnerId();
        boolean viewerParticipates = me != null
                && (me.equals(caseEntity.getOwnerId()) || me.equals(caseEntity.getParticipantId()));
        boolean blockedByMe = viewerParticipates && userBlockService.hasBlocked(me, counterpartId);
        boolean blockedMe = viewerParticipates && userBlockService.hasBlocked(counterpartId, me);

        List<CaseMessageDTO> messages = includeMessages
                ? messageRepository.findByCaseIdOrderByCreatedAtAsc(caseEntity.getCaseId()).stream().map(this::toMessageDto).toList()
                : List.of();

        return new CaseDTO(
                caseEntity.getCaseId(),
                caseEntity.getCaseType(),
                caseEntity.getStatus(),
                caseEntity.getPetId(),
                caseEntity.getReportId(),
                caseEntity.getAdoptionRequestId(),
                caseEntity.getReportSightingId(),
                caseEntity.getOwnerId(),
                owner != null ? owner.getUsername() : null,
                owner != null ? owner.getEmail() : null,
                caseEntity.getParticipantId(),
                participantName,
                participantEmail,
                participantPhone,
                caseEntity.getTitle(),
                pet != null ? pet.getName() : report != null ? report.getName() : null,
                imageUrl,
                pet != null ? pet.getLocation() : report != null ? report.getLocation() : null,
                pet != null ? pet.getDescription() : report != null ? report.getDescription() : null,
                caseEntity.getLastMessage(),
                caseEntity.getCreatedAt(),
                caseEntity.getUpdatedAt(),
                caseEntity.getClosedAt(),
                pet != null ? pet.getCreatedAt() : report != null ? report.getCreatedAt() : null,
                adoptionRequest != null ? adoptionRequest.getCreatedAt() : sighting != null ? sighting.getCreatedAt() : null,
                caseEntity.getBlockedBy() != null,
                me != null && me.equals(caseEntity.getBlockedBy()),
                caseEntity.getBlockedAt(),
                blockedByMe,
                blockedMe,
                messages
        );
    }

    private CaseMessageDTO toMessageDto(CaseMessageEntity message) {
        return new CaseMessageDTO(
                message.getMessageId(),
                message.getCaseId(),
                message.getSenderId(),
                message.getSenderName(),
                message.getMessage(),
                splitImageUrls(message.getImageUrls()),
                message.getCreatedAt()
        );
    }

    private String joinImageUrls(List<String> imageUrls) {
        if (imageUrls == null || imageUrls.isEmpty()) {
            return null;
        }
        return String.join("\n", imageUrls);
    }

    private List<String> splitImageUrls(String imageUrls) {
        if (imageUrls == null || imageUrls.isBlank()) {
            return List.of();
        }
        return Arrays.stream(imageUrls.split("\\R"))
                .filter(value -> value != null && !value.isBlank())
                .toList();
    }

    private String resolveUserName(Integer userId) {
        if (userId == null) {
            return "Contacto externo";
        }
        return userRepository.findById(userId).map(UserEntity::getUsername).orElse("Usuario");
    }
}
