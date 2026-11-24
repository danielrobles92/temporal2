package com.example.pets.petproject.application;

import com.example.pets.petproject.domain.core.NotificationService;
import com.example.pets.petproject.domain.enums.UserRole;
import com.example.pets.petproject.domain.model.BlockedUserDTO;
import com.example.pets.petproject.domain.model.ChatReportDTO;
import com.example.pets.petproject.domain.model.ChatReportDecisionDTO;
import com.example.pets.petproject.domain.model.CreateChatReportDTO;
import com.example.pets.petproject.domain.port.CaseMessageRepositoryDB;
import com.example.pets.petproject.domain.port.CaseRepositoryDB;
import com.example.pets.petproject.domain.port.ChatReportRepositoryDB;
import com.example.pets.petproject.domain.port.UserBlockRepositoryDB;
import com.example.pets.petproject.domain.port.UserRepositoryDB;
import com.example.pets.petproject.infraestructure.entity.CaseEntity;
import com.example.pets.petproject.infraestructure.entity.CaseMessageEntity;
import com.example.pets.petproject.infraestructure.entity.ChatReportEntity;
import com.example.pets.petproject.infraestructure.entity.UserBlockEntity;
import com.example.pets.petproject.infraestructure.entity.UserEntity;
import com.example.pets.petproject.security.AuthUtils;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Seguridad en los chats de los casos. Cualquiera de los dos participantes (quien publico y
 * quien solicito o aviso) puede:
 * <ul>
 *   <li>reportar al administrador el mal uso del chat (malas palabras, pedir dinero, un perro
 *       que no existe...);</li>
 *   <li>bloquear el chat: nadie puede escribir en ese caso hasta que lo desbloquee;</li>
 *   <li>bloquear a la otra persona: ninguno puede escribirle al otro en ningun caso ni mandarle
 *       solicitudes o avisos. Los bloqueados se consultan y desbloquean en el perfil.</li>
 * </ul>
 * El administrador revisa los reportes en su panel.
 */
@RestController
@CrossOrigin
public class ChatSafetyController {

    /** Motivos de reporte que muestra Casos.js. */
    static final Map<String, String> REASONS = new LinkedHashMap<>();
    static {
        REASONS.put("OFFENSIVE_LANGUAGE", "Insultos o malas palabras");
        REASONS.put("MONEY_REQUEST", "Pide dinero a cambio del perro");
        REASONS.put("FAKE_DOG", "El perro no existe o la informacion es falsa");
        REASONS.put("HARASSMENT", "Acoso o amenazas");
        REASONS.put("SPAM", "Spam o publicidad");
        REASONS.put("OTHER", "Otro motivo");
    }
    private static final Set<String> DECISIONS = Set.of("PENDING", "REVIEWED", "DISMISSED");
    private static final String AUTOMATIC_SENDER = "Aviso automatico";
    private static final int MAX_DETAILS = 1000;
    private static final int MAX_NOTES = 1000;
    private static final int EVIDENCE_MESSAGES = 15;
    private static final DateTimeFormatter EVIDENCE_DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private final CaseRepositoryDB caseRepository;
    private final CaseMessageRepositoryDB messageRepository;
    private final UserBlockRepositoryDB blockRepository;
    private final ChatReportRepositoryDB chatReportRepository;
    private final UserRepositoryDB userRepository;
    private final NotificationService notificationService;

    public ChatSafetyController(
            CaseRepositoryDB caseRepository,
            CaseMessageRepositoryDB messageRepository,
            UserBlockRepositoryDB blockRepository,
            ChatReportRepositoryDB chatReportRepository,
            UserRepositoryDB userRepository,
            NotificationService notificationService
    ) {
        this.caseRepository = caseRepository;
        this.messageRepository = messageRepository;
        this.blockRepository = blockRepository;
        this.chatReportRepository = chatReportRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    // --- Acceso ---------------------------------------------------------------------------

    private Integer requireUser() {
        Integer me = AuthUtils.currentUserId();
        if (me == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Inicia sesion");
        }
        return me;
    }

    private CaseEntity loadCase(Integer caseId) {
        return caseRepository.findById(caseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Caso no encontrado"));
    }

    private boolean participates(CaseEntity caseEntity, Integer userId) {
        return userId != null && (userId.equals(caseEntity.getOwnerId()) || userId.equals(caseEntity.getParticipantId()));
    }

    /** Reportar o bloquear a la otra persona: solo quien participa en el caso. */
    private CaseEntity loadCaseAsParticipant(Integer caseId, Integer me) {
        CaseEntity caseEntity = loadCase(caseId);
        if (!participates(caseEntity, me)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No participas en este caso");
        }
        return caseEntity;
    }

    private Integer counterpartOf(CaseEntity caseEntity, Integer me) {
        Integer other = me.equals(caseEntity.getOwnerId()) ? caseEntity.getParticipantId() : caseEntity.getOwnerId();
        if (other == null || other.equals(me)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La otra persona de este caso no tiene una cuenta registrada");
        }
        return other;
    }

    private void requireAdmin() {
        if (!AuthUtils.isAdmin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo un administrador puede hacer esto");
        }
    }

    // --- Bloquear el chat de un caso -----------------------------------------------------

    /** Bloquea el chat: participantes del caso o un admin. */
    @PostMapping("/cases/{caseId}/block")
    public Map<String, Object> blockChat(@PathVariable Integer caseId) {
        Integer me = requireUser();
        CaseEntity caseEntity = loadCase(caseId);
        boolean admin = AuthUtils.isAdmin();
        if (!participates(caseEntity, me) && !admin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No participas en este caso");
        }
        if (caseEntity.getBlockedBy() == null) {
            LocalDateTime now = LocalDateTime.now();
            caseEntity.setBlockedBy(me);
            caseEntity.setBlockedAt(now);
            String text = admin && !participates(caseEntity, me)
                    ? "Un administrador bloqueo este chat. Ya no se pueden enviar mensajes."
                    : "Este chat fue bloqueado por uno de los participantes. Ya no se pueden enviar mensajes.";
            addAutomaticMessage(caseEntity, text, now);
        }
        return Map.of("caseId", caseId, "chatBlocked", true);
    }

    /** Desbloquea el chat: solo quien lo bloqueo o un admin. */
    @PostMapping("/cases/{caseId}/unblock")
    public Map<String, Object> unblockChat(@PathVariable Integer caseId) {
        Integer me = requireUser();
        CaseEntity caseEntity = loadCase(caseId);
        if (caseEntity.getBlockedBy() == null) {
            return Map.of("caseId", caseId, "chatBlocked", false);
        }
        if (!me.equals(caseEntity.getBlockedBy()) && !AuthUtils.isAdmin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo quien bloqueo el chat puede desbloquearlo");
        }
        LocalDateTime now = LocalDateTime.now();
        caseEntity.setBlockedBy(null);
        caseEntity.setBlockedAt(null);
        addAutomaticMessage(caseEntity, "El chat se desbloqueo. Ya se pueden enviar mensajes de nuevo.", now);
        return Map.of("caseId", caseId, "chatBlocked", false);
    }

    private void addAutomaticMessage(CaseEntity caseEntity, String text, LocalDateTime now) {
        CaseMessageEntity message = new CaseMessageEntity();
        message.setCaseId(caseEntity.getCaseId());
        message.setSenderName(AUTOMATIC_SENDER);
        message.setMessage(text);
        messageRepository.save(message);
        caseEntity.setLastMessage(text);
        caseEntity.setUpdatedAt(now);
        caseRepository.save(caseEntity);
    }

    // --- Bloquear usuarios ---------------------------------------------------------------

    /** Bloquea a la otra persona del caso (en todos los casos y para nuevos contactos). */
    @PostMapping("/cases/{caseId}/block-user")
    public BlockedUserDTO blockCounterpart(@PathVariable Integer caseId) {
        Integer me = requireUser();
        CaseEntity caseEntity = loadCaseAsParticipant(caseId, me);
        Integer other = counterpartOf(caseEntity, me);
        UserBlockEntity block = blockRepository.findByBlockerIdAndBlockedId(me, other)
                .orElseGet(() -> createBlock(me, other, caseId));
        return toBlockedDto(block, userRepository.findById(other).orElse(null), caseEntity);
    }

    private UserBlockEntity createBlock(Integer blockerId, Integer blockedId, Integer caseId) {
        UserBlockEntity block = new UserBlockEntity();
        block.setBlockerId(blockerId);
        block.setBlockedId(blockedId);
        block.setCaseId(caseId);
        return blockRepository.save(block);
    }

    /** Usuarios que bloqueo quien consulta (para su perfil). */
    @GetMapping("/blocks")
    public List<BlockedUserDTO> myBlocks() {
        Integer me = requireUser();
        List<UserBlockEntity> blocks = blockRepository.findByBlockerIdOrderByCreatedAtDesc(me);
        Map<Integer, UserEntity> users = byId(userRepository.findAllById(
                blocks.stream().map(UserBlockEntity::getBlockedId).distinct().toList()), UserEntity::getId);
        Map<Integer, CaseEntity> cases = byId(caseRepository.findAllById(
                blocks.stream().map(UserBlockEntity::getCaseId).filter(Objects::nonNull).distinct().toList()), CaseEntity::getCaseId);
        return blocks.stream()
                .map(block -> toBlockedDto(block, users.get(block.getBlockedId()),
                        block.getCaseId() == null ? null : cases.get(block.getCaseId())))
                .toList();
    }

    /** Desbloquea a un usuario que el propio usuario habia bloqueado. */
    @DeleteMapping("/blocks/{userId}")
    public Map<String, Object> unblockUser(@PathVariable Integer userId) {
        Integer me = requireUser();
        blockRepository.findByBlockerIdAndBlockedId(me, userId).ifPresent(blockRepository::delete);
        return Map.of("userId", userId, "blocked", false);
    }

    private BlockedUserDTO toBlockedDto(UserBlockEntity block, UserEntity user, CaseEntity caseEntity) {
        return new BlockedUserDTO(
                block.getBlockedId(),
                user != null ? user.getUsername() : "Usuario eliminado",
                block.getCreatedAt(),
                block.getCaseId(),
                caseEntity != null ? caseEntity.getTitle() : null
        );
    }

    // --- Reportar al administrador -------------------------------------------------------

    /** Reporta a la otra persona del caso. Avisa a todos los administradores. */
    @PostMapping("/cases/{caseId}/reports")
    public Map<String, Object> reportChat(@PathVariable Integer caseId, @RequestBody CreateChatReportDTO dto) {
        Integer me = requireUser();
        CaseEntity caseEntity = loadCaseAsParticipant(caseId, me);
        Integer reported = counterpartOf(caseEntity, me);

        String reason = dto.reason() == null ? "" : dto.reason().trim().toUpperCase();
        if (!REASONS.containsKey(reason)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Elige el motivo del reporte");
        }
        String details = dto.details() == null ? "" : dto.details().trim();
        if ("OTHER".equals(reason) && details.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Describe que paso para que el administrador pueda revisarlo");
        }
        if (details.length() > MAX_DETAILS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La descripcion admite como maximo " + MAX_DETAILS + " caracteres");
        }
        if (chatReportRepository.existsByCaseIdAndReporterIdAndStatus(caseId, me, "PENDING")) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya reportaste este chat. El administrador lo esta revisando.");
        }

        List<CaseMessageEntity> messages = messageRepository.findByCaseIdOrderByCreatedAtAsc(caseId);
        if (dto.messageId() != null) {
            CaseMessageEntity reportedMessage = messages.stream()
                    .filter(message -> dto.messageId().equals(message.getMessageId()))
                    .findFirst()
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "El mensaje no pertenece a este caso"));
            if (!reported.equals(reportedMessage.getSenderId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Solo puedes reportar mensajes de la otra persona");
            }
        }

        ChatReportEntity report = new ChatReportEntity();
        report.setCaseId(caseId);
        report.setMessageId(dto.messageId());
        report.setReporterId(me);
        report.setReportedUserId(reported);
        report.setCaseTitle(caseEntity.getTitle());
        report.setReason(reason);
        report.setDetails(details.isEmpty() ? null : details);
        report.setEvidence(buildEvidence(messages, reported, dto.messageId()));
        report = chatReportRepository.save(report);

        boolean blocked = false;
        if (Boolean.TRUE.equals(dto.blockUser())) {
            if (!blockRepository.existsByBlockerIdAndBlockedId(me, reported)) {
                createBlock(me, reported, caseId);
            }
            blocked = true;
        }

        notifyAdmins(report, me, reported);
        return Map.of("chatReportId", report.getChatReportId(), "blocked", blocked);
    }

    /**
     * Copia de los ultimos mensajes de la persona reportada (el reportado se marca con "►"),
     * para que el administrador tenga la evidencia aunque se borre el caso.
     */
    private String buildEvidence(List<CaseMessageEntity> messages, Integer reportedUserId, Integer reportedMessageId) {
        List<CaseMessageEntity> fromReported = messages.stream()
                .filter(message -> reportedUserId.equals(message.getSenderId()))
                .toList();
        List<CaseMessageEntity> lastOnes = fromReported.subList(Math.max(0, fromReported.size() - EVIDENCE_MESSAGES), fromReported.size());
        List<CaseMessageEntity> selected = new ArrayList<>(lastOnes);
        // El mensaje reportado siempre se incluye, aunque sea antiguo.
        if (reportedMessageId != null && selected.stream().noneMatch(m -> reportedMessageId.equals(m.getMessageId()))) {
            fromReported.stream().filter(m -> reportedMessageId.equals(m.getMessageId())).findFirst()
                    .ifPresent(m -> selected.add(0, m));
        }
        if (selected.isEmpty()) {
            return "La persona reportada no ha enviado mensajes en este chat.";
        }
        return selected.stream()
                .map(message -> {
                    String photos = message.getImageUrls() == null || message.getImageUrls().isBlank()
                            ? "" : " [con fotos adjuntas]";
                    String mark = message.getMessageId().equals(reportedMessageId) ? "► " : "";
                    return mark + (message.getCreatedAt() != null ? message.getCreatedAt().format(EVIDENCE_DATE) : "")
                            + " · " + (message.getSenderName() == null ? "Usuario" : message.getSenderName())
                            + ": " + message.getMessage() + photos;
                })
                .collect(Collectors.joining("\n"));
    }

    private void notifyAdmins(ChatReportEntity report, Integer reporterId, Integer reportedId) {
        String reporterName = userRepository.findById(reporterId).map(UserEntity::getUsername).orElse("Un usuario");
        String reportedName = userRepository.findById(reportedId).map(UserEntity::getUsername).orElse("otro usuario");
        for (UserEntity admin : userRepository.findByRole(UserRole.ADMIN)) {
            if (Boolean.FALSE.equals(admin.getAccountActive()) || admin.getId().equals(reporterId)) {
                continue;
            }
            notificationService.notify(admin.getId(), "CHAT_REPORT",
                    "Reporte de mal uso en un chat",
                    reporterName + " reporto a " + reportedName + ": " + REASONS.get(report.getReason())
                            + " (" + report.getCaseTitle() + ")",
                    "/admin?chatReport=" + report.getChatReportId());
        }
    }

    // --- Panel del administrador ---------------------------------------------------------

    @GetMapping("/chat-reports")
    public List<ChatReportDTO> getChatReports() {
        requireAdmin();
        List<ChatReportEntity> reports = chatReportRepository.findAllByOrderByCreatedAtDesc();
        Set<Integer> userIds = new HashSet<>();
        reports.forEach(report -> {
            userIds.add(report.getReporterId());
            if (report.getReportedUserId() != null) userIds.add(report.getReportedUserId());
            if (report.getReviewedBy() != null) userIds.add(report.getReviewedBy());
        });
        Map<Integer, UserEntity> users = byId(userRepository.findAllById(userIds), UserEntity::getId);
        Map<Integer, CaseEntity> cases = byId(caseRepository.findAllById(
                reports.stream().map(ChatReportEntity::getCaseId).filter(Objects::nonNull).distinct().toList()), CaseEntity::getCaseId);
        Map<Integer, Long> reportCounts = reports.stream()
                .filter(report -> report.getReportedUserId() != null)
                .collect(Collectors.groupingBy(ChatReportEntity::getReportedUserId, Collectors.counting()));
        return reports.stream().map(report -> toReportDto(report, users, cases, reportCounts)).toList();
    }

    @PatchMapping("/chat-reports/{id}")
    public ChatReportDTO decide(@PathVariable Integer id, @RequestBody ChatReportDecisionDTO dto) {
        requireAdmin();
        ChatReportEntity report = chatReportRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reporte no encontrado"));
        String status = dto.status() == null ? "" : dto.status().trim().toUpperCase();
        if (!DECISIONS.contains(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Estado del reporte no valido");
        }
        String notes = dto.adminNotes() == null ? null : dto.adminNotes().trim();
        if (notes != null && notes.length() > MAX_NOTES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Las notas admiten como maximo " + MAX_NOTES + " caracteres");
        }
        String previous = report.getStatus();
        report.setStatus(status);
        report.setAdminNotes(notes == null || notes.isEmpty() ? null : notes);
        boolean decided = !"PENDING".equals(status);
        report.setReviewedBy(decided ? AuthUtils.currentUserId() : null);
        report.setReviewedAt(decided ? LocalDateTime.now() : null);
        report = chatReportRepository.save(report);

        // Se avisa a quien reporto cuando su reporte se resuelve (las notas son internas).
        if (decided && !status.equals(previous)) {
            String title = report.getCaseTitle() == null ? "un caso" : "\"" + report.getCaseTitle() + "\"";
            notificationService.notify(report.getReporterId(), "CHAT_REPORT_RESULT",
                    "Revisamos tu reporte",
                    "REVIEWED".equals(status)
                            ? "Gracias por avisar. El administrador reviso tu reporte del chat " + title + " y lo atendio."
                            : "El administrador reviso tu reporte del chat " + title + " y no encontro una falta a las reglas.",
                    "/casos");
        }

        Set<Integer> userIds = new HashSet<>();
        userIds.add(report.getReporterId());
        if (report.getReportedUserId() != null) userIds.add(report.getReportedUserId());
        if (report.getReviewedBy() != null) userIds.add(report.getReviewedBy());
        Map<Integer, UserEntity> users = byId(userRepository.findAllById(userIds), UserEntity::getId);
        Map<Integer, CaseEntity> cases = report.getCaseId() == null ? Map.of()
                : byId(caseRepository.findAllById(List.of(report.getCaseId())), CaseEntity::getCaseId);
        long count = report.getReportedUserId() == null ? 0 : chatReportRepository.countByReportedUserId(report.getReportedUserId());
        Map<Integer, Long> counts = report.getReportedUserId() == null ? Map.of() : Map.of(report.getReportedUserId(), count);
        return toReportDto(report, users, cases, counts);
    }

    private ChatReportDTO toReportDto(ChatReportEntity report, Map<Integer, UserEntity> users,
                                      Map<Integer, CaseEntity> cases, Map<Integer, Long> reportCounts) {
        UserEntity reporter = users.get(report.getReporterId());
        UserEntity reportedUser = report.getReportedUserId() == null ? null : users.get(report.getReportedUserId());
        UserEntity reviewer = report.getReviewedBy() == null ? null : users.get(report.getReviewedBy());
        CaseEntity caseEntity = report.getCaseId() == null ? null : cases.get(report.getCaseId());
        return new ChatReportDTO(
                report.getChatReportId(),
                report.getCaseId(),
                caseEntity != null ? caseEntity.getTitle() : report.getCaseTitle(),
                caseEntity != null ? caseEntity.getCaseType() : null,
                caseEntity != null,
                caseEntity != null && caseEntity.getBlockedBy() != null,
                report.getMessageId(),
                report.getReporterId(),
                reporter != null ? reporter.getUsername() : "Usuario eliminado",
                reporter != null ? reporter.getEmail() : null,
                report.getReportedUserId(),
                reportedUser != null ? reportedUser.getUsername() : "Usuario eliminado",
                reportedUser != null ? reportedUser.getEmail() : null,
                reportedUser != null ? reportedUser.getAccountActive() : null,
                report.getReportedUserId() == null ? 0 : reportCounts.getOrDefault(report.getReportedUserId(), 0L),
                report.getReason(),
                report.getDetails(),
                report.getEvidence(),
                report.getStatus(),
                report.getAdminNotes(),
                reviewer != null ? reviewer.getUsername() : null,
                report.getReviewedAt(),
                report.getCreatedAt()
        );
    }

    private static <T> Map<Integer, T> byId(Iterable<T> items, Function<T, Integer> id) {
        Map<Integer, T> map = new HashMap<>();
        items.forEach(item -> map.put(id.apply(item), item));
        return map;
    }
}
