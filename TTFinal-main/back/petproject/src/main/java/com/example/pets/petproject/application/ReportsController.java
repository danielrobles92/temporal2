package com.example.pets.petproject.application;

import com.example.pets.petproject.domain.core.ContactData;
import com.example.pets.petproject.domain.core.DogImageGuard;
import com.example.pets.petproject.domain.core.ImageEmbeddingService;
import com.example.pets.petproject.domain.core.NotificationService;
import com.example.pets.petproject.domain.core.UserBlockService;
import com.example.pets.petproject.domain.core.MatchScoring;
import com.example.pets.petproject.domain.enums.MatchStatus;
import com.example.pets.petproject.domain.enums.PetSex;
import com.example.pets.petproject.domain.enums.PetStatus;
import com.example.pets.petproject.domain.enums.ReportStatus;
import com.example.pets.petproject.domain.enums.ReportType;
import com.example.pets.petproject.domain.model.LostPetReportDTO;
import com.example.pets.petproject.domain.model.MatchStatusUpdateDTO;
import com.example.pets.petproject.domain.model.ModerationDTO;
import com.example.pets.petproject.domain.model.AiSummaryDTO;
import com.example.pets.petproject.domain.model.PotentialMatchDTO;
import com.example.pets.petproject.domain.model.CreateReportSightingDTO;
import com.example.pets.petproject.domain.model.ReportSightingDTO;
import com.example.pets.petproject.domain.model.ReplyReportSightingDTO;
import com.example.pets.petproject.domain.model.SightingEntryDTO;
import com.example.pets.petproject.domain.model.UpdateReportSightingDTO;
import com.example.pets.petproject.domain.port.CaseMessageRepositoryDB;
import com.example.pets.petproject.domain.port.CaseRepositoryDB;
import com.example.pets.petproject.domain.port.ReportSightingEntryRepositoryDB;
import com.example.pets.petproject.domain.port.LostPetReportRepositoryDB;
import com.example.pets.petproject.domain.port.MatchRepositoryDB;
import com.example.pets.petproject.domain.port.PetImageEmbeddingRepositoryDB;
import com.example.pets.petproject.domain.port.PetsRepositoryDB;
import com.example.pets.petproject.domain.port.ReportImageEmbeddingRepositoryDB;
import com.example.pets.petproject.domain.port.ReportSightingRepositoryDB;
import com.example.pets.petproject.domain.port.UserRepositoryDB;
import com.example.pets.petproject.domain.service.DogDescription;
import com.example.pets.petproject.domain.service.ImageAnalysis;
import com.example.pets.petproject.domain.service.ImageStorageService;
import com.example.pets.petproject.infraestructure.entity.LostPetReportEntity;
import com.example.pets.petproject.infraestructure.entity.MatchEntity;
import com.example.pets.petproject.infraestructure.entity.PetImageEmbeddingEntity;
import com.example.pets.petproject.infraestructure.entity.PetsEntity;
import com.example.pets.petproject.infraestructure.entity.ReportImageEmbeddingEntity;
import com.example.pets.petproject.infraestructure.entity.ReportSightingEntity;
import com.example.pets.petproject.infraestructure.entity.ReportSightingEntryEntity;
import com.example.pets.petproject.infraestructure.entity.CaseEntity;
import com.example.pets.petproject.infraestructure.entity.CaseMessageEntity;
import com.example.pets.petproject.security.AuthUtils;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Stream;

@RestController
@RequestMapping("/reports")
@CrossOrigin
public class ReportsController {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(ReportsController.class);

    private final LostPetReportRepositoryDB repository;
    private final ReportSightingRepositoryDB sightingRepository;
    private final PetsRepositoryDB petsRepository;
    private final UserRepositoryDB userRepository;
    private final ImageStorageService imageStorageService;
    private final ImageEmbeddingService imageEmbeddingService;
    private final PetImageEmbeddingRepositoryDB petImageEmbeddingRepository;
    private final ReportImageEmbeddingRepositoryDB reportImageEmbeddingRepository;
    private final MatchRepositoryDB matchRepository;
    private final NotificationService notificationService;
    private final DogImageGuard dogImageGuard;
    private final UserBlockService userBlockService;
    private final ReportSightingEntryRepositoryDB sightingEntryRepository;
    private final CaseRepositoryDB caseRepository;
    private final CaseMessageRepositoryDB caseMessageRepository;

    /** Casos terminados que un nuevo avistamiento reabre ("No es mi perro" / cerrado). */
    private static final Set<String> REOPENABLE_CASE_STATUSES = Set.of("CANCELLED", "CLOSED");
    private static final Set<String> CLOSED_CASE_STATUSES = Set.of("ADOPTED", "CANCELLED", "RESOLVED", "CLOSED");
    private static final int MAX_SIGHTING_PHOTOS = 4;
    private static final String AUTOMATIC_SENDER = "Aviso automatico";

    public ReportsController(
            LostPetReportRepositoryDB repository,
            ReportSightingRepositoryDB sightingRepository,
            PetsRepositoryDB petsRepository,
            UserRepositoryDB userRepository,
            ImageStorageService imageStorageService,
            ImageEmbeddingService imageEmbeddingService,
            PetImageEmbeddingRepositoryDB petImageEmbeddingRepository,
            ReportImageEmbeddingRepositoryDB reportImageEmbeddingRepository,
            MatchRepositoryDB matchRepository,
            NotificationService notificationService,
            DogImageGuard dogImageGuard,
            UserBlockService userBlockService,
            ReportSightingEntryRepositoryDB sightingEntryRepository,
            CaseRepositoryDB caseRepository,
            CaseMessageRepositoryDB caseMessageRepository
    ) {
        this.repository = repository;
        this.sightingRepository = sightingRepository;
        this.petsRepository = petsRepository;
        this.userRepository = userRepository;
        this.imageStorageService = imageStorageService;
        this.imageEmbeddingService = imageEmbeddingService;
        this.petImageEmbeddingRepository = petImageEmbeddingRepository;
        this.reportImageEmbeddingRepository = reportImageEmbeddingRepository;
        this.matchRepository = matchRepository;
        this.notificationService = notificationService;
        this.dogImageGuard = dogImageGuard;
        this.userBlockService = userBlockService;
        this.sightingEntryRepository = sightingEntryRepository;
        this.caseRepository = caseRepository;
        this.caseMessageRepository = caseMessageRepository;
    }

    @GetMapping
    public List<LostPetReportDTO> getAll(@RequestParam(required = false) ReportType type) {
        List<LostPetReportEntity> reports = type == null ? repository.findAll() : repository.findByType(type);
        // Un solo SELECT para los autores (antes era uno por reporte; RNF-10).
        Map<Integer, com.example.pets.petproject.infraestructure.entity.UserEntity> reporters = new HashMap<>();
        userRepository.findAllById(reports.stream().map(LostPetReportEntity::getReporterId)
                        .filter(Objects::nonNull).distinct().toList())
                .forEach(u -> reporters.put(u.getId(), u));
        return reports.stream().map(r -> toDto(r, reporters.get(r.getReporterId()))).toList();
    }

    @GetMapping("/user/{userId}")
    public List<LostPetReportDTO> getByUser(@PathVariable Integer userId) {
        return repository.findByReporterId(userId).stream().map(this::toDto).toList();
    }

    @GetMapping("/{id}")
    public LostPetReportDTO getById(@PathVariable Integer id) {
        return repository.findById(id)
                .map(this::toDto)
                .orElseThrow(() -> new RuntimeException("Reporte no encontrado"));
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public LostPetReportDTO create(@RequestBody LostPetReportDTO dto) {
        String url = dto.imageUrl();
        return saveReport(dto, url == null || url.isBlank() ? List.of() : List.of(url));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public LostPetReportDTO createWithImage(
            @RequestPart("report") LostPetReportDTO dto,
            @RequestPart(value = "images", required = false) List<MultipartFile> images,
            @RequestPart(value = "image", required = false) MultipartFile image
    ) {
        List<MultipartFile> files = reportFiles(images, image);
        dogImageGuard.requireDogs(files); // no es perro o tiene 2+ perros -> 422
        return saveReport(dto, storeReportImages(files));
    }

    /** Fotos recibidas (1 a 4; la primera es la principal). Acepta el campo anterior "image". */
    private List<MultipartFile> reportFiles(List<MultipartFile> images, MultipartFile image) {
        List<MultipartFile> files = new ArrayList<>();
        if (images != null) {
            images.stream().filter(f -> f != null && !f.isEmpty()).forEach(files::add);
        }
        if (files.isEmpty() && image != null && !image.isEmpty()) {
            files.add(image);
        }
        return files.size() > 4 ? files.subList(0, 4) : files;
    }

    private List<String> storeReportImages(List<MultipartFile> files) {
        return files.stream()
                .map(imageStorageService::storeReportImage)
                .filter(path -> path != null && !path.isBlank())
                .toList();
    }

    @PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public LostPetReportDTO update(@PathVariable Integer id, @RequestBody LostPetReportDTO dto) {
        LostPetReportEntity entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reporte no encontrado"));
        requireOwnerOrAdmin(entity);
        applyReportData(entity, dto, null);
        LostPetReportEntity saved = repository.save(entity);
        computeMatchesSafely(saved);   // la raza, la ubicacion o el color pudieron cambiar
        return toDto(saved);
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public LostPetReportDTO updateWithImage(
            @PathVariable Integer id,
            @RequestPart("report") LostPetReportDTO dto,
            @RequestPart(value = "images", required = false) List<MultipartFile> images,
            @RequestPart(value = "image", required = false) MultipartFile image
    ) {
        LostPetReportEntity entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reporte no encontrado"));
        requireOwnerOrAdmin(entity);
        List<MultipartFile> files = reportFiles(images, image);
        dogImageGuard.requireDogs(files);
        // Fotos nuevas reemplazan a las anteriores; sin fotos nuevas se conservan.
        List<String> paths = files.isEmpty() ? null : storeReportImages(files);
        applyReportData(entity, dto, paths);
        LostPetReportEntity saved = repository.save(entity);
        if (paths != null) {
            imageEmbeddingService.embedReportSafely(saved);
        }
        computeMatchesSafely(saved);
        return toDto(saved);
    }

    private LostPetReportDTO saveReport(LostPetReportDTO dto, List<String> imageUrls) {
        LostPetReportEntity entity = new LostPetReportEntity();
        // RN-02: el reportero es el usuario autenticado (no se confia en el cliente).
        Integer reporterId = AuthUtils.currentUserId() != null ? AuthUtils.currentUserId() : dto.reporterId();
        entity.setReporterId(reporterId);
        entity.setType(dto.type());
        entity.setName(dto.name());
        entity.setSpecies(dto.species());
        entity.setBreed(dto.breed());
        entity.setSex(dto.sex());
        entity.setColor(dto.color());
        entity.setAge(dto.age());
        entity.setLocation(dto.location());
        entity.setLatitude(dto.latitude());
        entity.setLongitude(dto.longitude());
        entity.setDescription(dto.description());
        entity.setContactPhone(dto.contactPhone());
        setImages(entity, imageUrls);
        entity.setStatus(ReportStatus.OPEN);
        LostPetReportEntity saved = repository.save(entity);
        // Indexar las fotos y buscar coincidencias: avisa a quien publico un reporte que coincide (> 40 %).
        imageEmbeddingService.embedReportSafely(saved);
        computeMatchesSafely(saved);
        return toDto(saved);
    }

    /** imageUrls null conserva las fotos actuales. */
    private void applyReportData(LostPetReportEntity entity, LostPetReportDTO dto, List<String> imageUrls) {
        entity.setType(dto.type() != null ? dto.type() : entity.getType());
        entity.setName(dto.name());
        entity.setSpecies(dto.species());
        entity.setBreed(dto.breed());
        entity.setSex(dto.sex());
        entity.setColor(dto.color());
        entity.setAge(dto.age());
        entity.setLocation(dto.location());
        entity.setLatitude(dto.latitude());
        entity.setLongitude(dto.longitude());
        entity.setDescription(dto.description());
        entity.setContactPhone(dto.contactPhone());
        if (imageUrls != null) {
            setImages(entity, imageUrls);
        }
        entity.setStatus(dto.status() != null ? dto.status() : entity.getStatus());
        entity.setUpdatedAt(LocalDateTime.now());
    }

    private void setImages(LostPetReportEntity entity, List<String> imageUrls) {
        entity.setImageUrl(imageUrls.isEmpty() ? null : imageUrls.get(0));
        entity.setImageUrls(imageUrls.isEmpty() ? null : String.join(",", imageUrls));
    }

    @PatchMapping("/{id}/moderation")
    public LostPetReportDTO moderate(@PathVariable Integer id, @RequestBody ModerationDTO dto) {
        // RN-12: la moderacion es exclusiva del administrador.
        if (!AuthUtils.isAdmin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo un administrador puede moderar");
        }
        LostPetReportEntity entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reporte no encontrado"));
        entity.setStatus(com.example.pets.petproject.domain.core.EnumParser.parse(
                ReportStatus.class, dto.status(), "Estado"));
        entity.setModerationNotes(dto.notes());
        entity.setUpdatedAt(LocalDateTime.now());
        return toDto(repository.save(entity));
    }

    /** El autor del reporte (o un admin) lo desactiva: deja de listarse y de buscar coincidencias. */
    @PatchMapping("/{id}/deactivate")
    public LostPetReportDTO deactivate(@PathVariable Integer id) {
        LostPetReportEntity entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reporte no encontrado"));
        requireOwnerOrAdmin(entity);
        entity.setStatus(ReportStatus.INACTIVE);
        entity.setModerationNotes("Reporte desactivado por el publicador.");
        entity.setUpdatedAt(LocalDateTime.now());
        return toDto(repository.save(entity));
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Integer id) {
        LostPetReportEntity entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reporte no encontrado"));
        requireOwnerOrAdmin(entity);
        repository.deleteById(id);
    }

    /** RN-09/RN-13: solo el responsable del reporte o un admin puede modificarlo/cerrarlo. */
    private void requireOwnerOrAdmin(LostPetReportEntity report) {
        if (!AuthUtils.isSelfOrAdmin(report.getReporterId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No autorizado");
        }
    }

    /**
     * La raza predicha solo cuenta si la red la da con al menos esta certeza. Con fotos del mismo perro,
     * una prediccion insegura (p. ej. Maltes al 47 %) daba el bono a otro perro (PF-27).
     */
    public static final float BREED_MIN_CONFIDENCE = 0.6f;

    /** Orden de las coincidencias: porcentaje de coincidencia y, a igualdad, parecido de las fotos. */
    public static final Comparator<PotentialMatchDTO> BY_SCORE = Comparator
            .comparing(PotentialMatchDTO::score, Comparator.reverseOrder())
            .thenComparing((PotentialMatchDTO m) -> m.visualScore() == null ? -1f : m.visualScore(), Comparator.reverseOrder());

    /**
     * Coincidencias potenciales de un reporte: porcentaje de coincidencia por foto, raza, ubicacion,
     * sexo y color (domain/core/MatchScoring). Se guardan en matches conservando las decisiones del usuario.
     */
    @Transactional
    @GetMapping("/{id}/matches")
    public List<PotentialMatchDTO> getMatches(@PathVariable Integer id) {
        LostPetReportEntity report = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reporte no encontrado"));
        return computeMatches(report, false);
    }

    /**
     * "Volver a comparar": analiza de nuevo las fotos del reporte (raza y colores con el modelo actual)
     * y recalcula sus coincidencias; avisa a quien publico un reporte que ahora coincide (> 40 %).
     */
    @Transactional
    @PostMapping("/{id}/matches/refresh")
    public List<PotentialMatchDTO> refreshMatches(@PathVariable Integer id) {
        LostPetReportEntity report = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reporte no encontrado"));
        requireOwnerOrAdmin(report);
        try {
            imageEmbeddingService.embedReport(report, true);
        } catch (Exception e) {
            log.warn("No se pudieron re-analizar las fotos del reporte {}: {}", id, e.getMessage());
        }
        return computeMatches(report, true);
    }

    /** Como computeMatches con aviso, pero nunca interrumpe publicar o editar. */
    private void computeMatchesSafely(LostPetReportEntity report) {
        try {
            computeMatches(report, true);
        } catch (Exception e) {
            log.warn("No se calcularon las coincidencias del reporte {}: {}", report.getReportId(), e.getMessage());
        }
    }

    private List<PotentialMatchDTO> computeMatches(LostPetReportEntity report, boolean notify) {
        // Vectores, raza y colores de todas las fotos del reporte (se analizan si aun no lo estan).
        imageEmbeddingService.embedReportSafely(report);
        ReportVisual visual = reportVisual(reportImageEmbeddingRepository.findByReportId(report.getReportId()));
        MatchScoring.Side me = new MatchScoring.Side(visual.embeddings(), visual.ai(), report.getBreed(),
                report.getColor(), report.getLatitude(), report.getLongitude(), report.getLocation(), report.getSex());

        // Candidatos: mascotas del catalogo + reportes del tipo opuesto (perdido<->encontrado).
        List<Candidate> candidates = new ArrayList<>();
        candidates.addAll(buildPetCandidates());
        candidates.addAll(buildReportCandidates(report));

        List<PotentialMatchDTO> results = new ArrayList<>();
        for (Candidate candidate : candidates) {
            MatchScoring.Result scored = MatchScoring.score(me, candidate.side());
            if (!MatchScoring.isShown(scored)) {
                continue;   // baja (40 % o menos) o sin ningún rasgo en común
            }
            Upserted up = upsertMatch(report, candidate, scored);
            MatchStatus status = up.match().getStatus();
            if (status == MatchStatus.DISCARDED || status == MatchStatus.REJECTED) {
                continue;   // quien publicó la descartó: no se vuelve a mostrar
            }
            results.add(toMatchDto(up.match(), candidate, me));
            if (notify) {
                notifyMatch(report, candidate, up);
            }
        }

        results.sort(BY_SCORE);
        return results.stream().limit(10).toList();
    }


    /**
     * Avisa a quien publico el reporte candidato cuando la coincidencia pasa de 40 % por primera vez
     * (no repite el aviso al recalcular, ni avisa si la descarto o si es su propio reporte).
     */
    private void notifyMatch(LostPetReportEntity report, Candidate c, Upserted up) {
        if (c.reportId() == null || c.reporterId() == null || c.reporterId().equals(report.getReporterId())) {
            return;
        }
        MatchEntity match = up.match();
        int score = Math.round(match.getScore());
        boolean alreadyAbove = up.previousScore() != null && up.previousScore() > MatchScoring.NOTIFY_ABOVE;
        if (score <= MatchScoring.NOTIFY_ABOVE || alreadyAbove
                || match.getStatus() == MatchStatus.REJECTED || match.getStatus() == MatchStatus.DISCARDED) {
            return;
        }
        String kind = report.getType() == ReportType.LOST ? "perdido" : "encontrado";
        String where = report.getLocation() != null && !report.getLocation().isBlank() ? " en " + report.getLocation() : "";
        String message = "Se publicó un perro " + kind + where + " con " + score + " % de coincidencia con tu reporte. "
                + "Revísalo en las coincidencias de tu reporte.";
        notificationService.notify(c.reporterId(), "MATCH_FOUND",
                trimTo("Posible coincidencia (" + score + " %) con tu reporte " + c.name(), 200),
                trimTo(message, 500),
                "/reporte/" + c.reportId());
    }

    /** Genera los embeddings faltantes de las imagenes de reportes ya existentes. */
    @PostMapping("/embeddings/backfill")
    public Map<String, Integer> backfillReportEmbeddings(@RequestParam(defaultValue = "false") boolean force) {
        if (force && !AuthUtils.isAdmin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo un administrador puede re-analizar todo");
        }
        return Map.of("processed", imageEmbeddingService.backfillReports(force));
    }

    /** Validar / rechazar / descartar una coincidencia (RF-34). */
    @PatchMapping("/matches/{matchId}/status")
    public PotentialMatchDTO updateMatchStatus(
            @PathVariable Integer matchId,
            @RequestBody MatchStatusUpdateDTO dto
    ) {
        MatchEntity match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Coincidencia no encontrada"));
        // Solo el autor del reporte (o un admin) valida o rechaza sus coincidencias.
        LostPetReportEntity report = repository.findById(match.getReportId())
                .orElseThrow(() -> new RuntimeException("Reporte no encontrado"));
        requireOwnerOrAdmin(report);
        MatchStatus status = com.example.pets.petproject.domain.core.EnumParser.parse(
                MatchStatus.class, dto.status(), "Estado");
        match.setStatus(status);
        match.setUpdatedAt(LocalDateTime.now());
        MatchEntity saved = matchRepository.save(match);
        return toMatchDtoResolved(saved);
    }

    /** Candidato unificado: una mascota del catalogo o un reporte del tipo opuesto. */
    private record Candidate(Integer petId, Integer reportId, Integer reporterId, String name, String imageUrl,
                             MatchScoring.Side side) {}

    private List<Candidate> buildPetCandidates() {
        List<PetsEntity> pets = petsRepository.findAll().stream()
                .filter(p -> p.getStatus() == PetStatus.LOST || p.getStatus() == PetStatus.AVAILABLE)
                .toList();
        Map<Integer, PetVisual> data = loadCandidateData(pets);
        List<Candidate> out = new ArrayList<>();
        for (PetsEntity p : pets) {
            PetVisual pv = data.get(p.getPetId());
            String imageUrl = p.getImages() != null && !p.getImages().isEmpty()
                    ? p.getImages().get(0).getUrlImage() : null;
            out.add(new Candidate(p.getPetId(), null, null, p.getName(), imageUrl,
                    new MatchScoring.Side(pv != null ? pv.embeddings() : List.of(),
                            pv != null ? pv.ai() : MatchScoring.Ai.NONE, p.getBreed(), p.getColor(),
                            p.getLatitude(), p.getLongitude(), p.getLocation(), p.getSex())));
        }
        return out;
    }

    /** Reportes del tipo OPUESTO (un perdido busca encontrados y viceversa). */
    private List<Candidate> buildReportCandidates(LostPetReportEntity report) {
        ReportType opposite = report.getType() == ReportType.LOST ? ReportType.FOUND : ReportType.LOST;
        List<LostPetReportEntity> reports = repository.findByType(opposite).stream()
                .filter(r -> !r.getReportId().equals(report.getReportId()))
                .filter(r -> r.getStatus() != ReportStatus.INACTIVE)
                .toList();
        if (reports.isEmpty()) {
            return List.of();
        }
        List<Integer> ids = reports.stream().map(LostPetReportEntity::getReportId).toList();
        Map<Integer, List<ReportImageEmbeddingEntity>> embByReport = new HashMap<>();
        for (ReportImageEmbeddingEntity e : reportImageEmbeddingRepository.findByReportIdIn(ids)) {
            embByReport.computeIfAbsent(e.getReportId(), k -> new ArrayList<>()).add(e);
        }
        List<Candidate> out = new ArrayList<>();
        for (LostPetReportEntity r : reports) {
            ReportVisual rv = reportVisual(embByReport.getOrDefault(r.getReportId(), List.of()));
            out.add(new Candidate(null, r.getReportId(), r.getReporterId(), r.getName(), r.getImageUrl(),
                    new MatchScoring.Side(rv.embeddings(), rv.ai(), r.getBreed(), r.getColor(), r.getLatitude(),
                            r.getLongitude(), r.getLocation(), r.getSex())));
        }
        return out;
    }

    /** Vectores de todas las fotos de un reporte y lo que detectó la red en ellas (raza, tamaño, etapa, colores). */
    public record ReportVisual(List<float[]> embeddings, MatchScoring.Ai ai) {}

    /** Colores guardados ("Blanco,Crema") como conjunto. */
    public static java.util.Set<String> splitColors(String colors) {
        java.util.Set<String> out = new java.util.LinkedHashSet<>();
        if (colors != null) {
            for (String c : colors.split(",")) {
                if (!c.isBlank()) {
                    out.add(c.trim());
                }
            }
        }
        return out;
    }

    public static ReportVisual reportVisual(List<ReportImageEmbeddingEntity> rows) {
        List<float[]> vectors = new ArrayList<>();
        MatchScoring.AiBuilder ai = new MatchScoring.AiBuilder();
        for (ReportImageEmbeddingEntity e : rows) {
            if (e.getEmbedding() != null) {
                vectors.add(e.getEmbedding());
            }
            ai.add(e.getBreed(), e.getBreedConfidence(), e.getSize(), e.getStage(), e.getColors());
        }
        // La certeza de la raza la evalúa MatchScoring (desde 0.4 cuenta; desde 0.6 dos razas distintas penalizan).
        return new ReportVisual(vectors, ai.build());
    }

    /** Datos visuales de un candidato: sus embeddings individuales + lo que detectó la red. */
    private record PetVisual(List<float[]> embeddings, MatchScoring.Ai ai) {}

    private Map<Integer, PetVisual> loadCandidateData(List<PetsEntity> candidates) {
        if (candidates.isEmpty()) {
            return Map.of();
        }
        List<Integer> petIds = candidates.stream().map(PetsEntity::getPetId).toList();

        Map<Integer, List<float[]>> vectors = new HashMap<>();
        Map<Integer, MatchScoring.AiBuilder> aiByPet = new HashMap<>();

        for (PetImageEmbeddingEntity e : petImageEmbeddingRepository.findByImage_Pet_PetIdIn(petIds)) {
            Integer petId = e.getImage().getPet().getPetId();
            if (e.getEmbedding() != null) {
                vectors.computeIfAbsent(petId, k -> new ArrayList<>()).add(e.getEmbedding());
            }
            aiByPet.computeIfAbsent(petId, k -> new MatchScoring.AiBuilder())
                    .add(e.getBreed(), e.getBreedConfidence(), e.getSize(), e.getStage(), e.getColors());
        }

        Map<Integer, PetVisual> out = new HashMap<>();
        for (Integer petId : petIds) {
            MatchScoring.AiBuilder ai = aiByPet.get(petId);
            out.put(petId, new PetVisual(vectors.getOrDefault(petId, List.of()),
                    ai != null ? ai.build() : MatchScoring.Ai.NONE));
        }
        return out;
    }

    /** Match guardado y su porcentaje antes de este calculo (null si es nuevo). */
    private record Upserted(MatchEntity match, Float previousScore) {}

    private Upserted upsertMatch(LostPetReportEntity report, Candidate c, MatchScoring.Result scored) {
        java.util.Optional<MatchEntity> existing = c.petId() != null
                ? matchRepository.findByReportIdAndPetId(report.getReportId(), c.petId())
                : matchRepository.findByReportIdAndMatchedReportId(report.getReportId(), c.reportId());
        MatchEntity match = existing.orElseGet(MatchEntity::new);
        boolean isNew = match.getMatchId() == null;
        Float previousScore = isNew ? null : match.getScore();
        if (isNew) {
            match.setReportId(report.getReportId());
            match.setPetId(c.petId());
            match.setMatchedReportId(c.reportId());
            match.setStatus(MatchStatus.SUGGESTED);
            match.setCreatedAt(LocalDateTime.now());
        }
        // El aviso a quien publico el otro reporte lo manda notifyMatch (porcentaje > 40).
        match.setVisualScore(scored.visual());
        match.setAttributeScore(scored.total() - scored.photoPoints());   // parte que no es la foto
        match.setScore((float) scored.total());
        match.setConfidence(scored.sameDogProbability());
        match.setReason(trimTo(scored.reason(), 500));
        match.setUpdatedAt(LocalDateTime.now());
        return new Upserted(matchRepository.save(match), previousScore);
    }

    private PotentialMatchDTO toMatchDto(MatchEntity match, Candidate c, MatchScoring.Side me) {
        return new PotentialMatchDTO(
                match.getMatchId(),
                match.getReportId(),
                c.petId(),
                c.name(),
                c.imageUrl(),
                Math.round(match.getScore()),
                match.getVisualScore(),
                match.getConfidence(),
                match.getReason(),
                match.getStatus().name(),
                displayBreed(c.side()),
                c.reportId(),
                aiDto(me.ai()),
                aiDto(c.side().ai())
        );
    }

    /** Raza que se muestra del candidato: la de la red si está segura; si no, la capturada. */
    public static String displayBreed(MatchScoring.Side side) {
        MatchScoring.Ai ai = side.ai();
        if (ai != null && DogDescription.isCatalogBreed(ai.breed()) && ai.breedConfidence() != null
                && ai.breedConfidence() >= BREED_MIN_CONFIDENCE) {
            return ai.breed();
        }
        return side.userBreed();
    }

    /** Resumen de lo que detectó la red, para mostrarlo lado a lado en la coincidencia. */
    public static AiSummaryDTO aiDto(MatchScoring.Ai ai) {
        if (ai == null) {
            return null;
        }
        return new AiSummaryDTO(ai.breed(), ai.breedConfidence(), ai.size(), ai.stage(),
                ai.colors() != null ? List.copyOf(ai.colors()) : List.of());
    }

    /** Reconstruye el DTO de un match desde la BD (para el cambio de estado). */
    private PotentialMatchDTO toMatchDtoResolved(MatchEntity m) {
        String name = null;
        String imageUrl = null;
        String breed = null;
        MatchScoring.Ai candAi = MatchScoring.Ai.NONE;
        if (m.getPetId() != null) {
            PetsEntity pet = petsRepository.findById(m.getPetId()).orElse(null);
            if (pet != null) {
                name = pet.getName();
                imageUrl = pet.getImages() != null && !pet.getImages().isEmpty()
                        ? pet.getImages().get(0).getUrlImage() : null;
                breed = pet.getBreed();
            }
            MatchScoring.AiBuilder ai = new MatchScoring.AiBuilder();
            petImageEmbeddingRepository.findByImage_Pet_PetIdIn(List.of(m.getPetId()))
                    .forEach(e -> ai.add(e.getBreed(), e.getBreedConfidence(), e.getSize(), e.getStage(), e.getColors()));
            candAi = ai.build();
        } else if (m.getMatchedReportId() != null) {
            LostPetReportEntity r = repository.findById(m.getMatchedReportId()).orElse(null);
            if (r != null) {
                name = r.getName();
                imageUrl = r.getImageUrl();
                breed = r.getBreed();
            }
            candAi = reportVisual(reportImageEmbeddingRepository.findByReportIdIn(List.of(m.getMatchedReportId()))).ai();
        }
        MatchScoring.Ai mineAi = reportVisual(reportImageEmbeddingRepository.findByReportId(m.getReportId())).ai();
        return new PotentialMatchDTO(m.getMatchId(), m.getReportId(), m.getPetId(), name, imageUrl,
                Math.round(m.getScore()), m.getVisualScore(), m.getConfidence(), m.getReason(),
                m.getStatus().name(), displayBreed(new MatchScoring.Side(List.of(), candAi, breed, null, null, null,
                        null, null)), m.getMatchedReportId(), aiDto(mineAi), aiDto(candAi));
    }

    @PostMapping(value = "/{id}/sightings", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ReportSightingDTO createSighting(
            @PathVariable Integer id,
            @RequestPart("sighting") CreateReportSightingDTO dto,
            @RequestPart(value = "images", required = false) List<MultipartFile> images
    ) {
        LostPetReportEntity reported = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reporte no encontrado"));
        // Si alguno de los dos bloqueo al otro, no se pueden mandar avisos.
        Integer senderId = AuthUtils.currentUserId() != null ? AuthUtils.currentUserId() : dto.userId();
        userBlockService.requireCanContact(senderId, reported.getReporterId(),
                "No puedes enviar avisos a este reporte.");
        if (dto.message() == null || dto.message().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Escribe la informacion del avistamiento");
        }
        if (dto.message().trim().length() > 2000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La informacion admite como maximo 2000 caracteres");
        }
        // Las fotos del aviso pueden no mostrar al perro (p. ej. el lugar), pero no varios perros.
        dogImageGuard.requireSingleDog(images);

        // Una persona tiene un solo aviso por reporte: si ya envio uno, lo nuevo se agrega a ese
        // aviso como "otro avistamiento" (o al chat de su caso) en vez de salir como otra persona.
        Optional<ReportSightingEntity> existing = senderId == null
                ? Optional.empty()
                : sightingRepository.findFirstByReportIdAndUserIdOrderByCreatedAtAsc(id, senderId);
        if (existing.isPresent()) {
            return addAnotherSighting(existing.get(), reported, dto, images);
        }

        if (dto.contactName() == null || dto.contactName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Escribe tu nombre");
        }

        List<String> imageUrls = storeSightingImages(images, MAX_SIGHTING_PHOTOS);

        ReportSightingEntity entity = new ReportSightingEntity();
        entity.setReportId(id);
        // Quien avisa es el usuario autenticado (no se confia en el cliente).
        entity.setUserId(senderId);
        entity.setContactName(dto.contactName());
        entity.setContactEmail(dto.contactEmail());
        entity.setContactPhone(dto.contactPhone());
        entity.setLocation(dto.location());
        // Punto del mapa donde se vio al perro (opcional; se ignora si no es una coordenada valida).
        if (validCoordinate(dto.latitude(), 90) && validCoordinate(dto.longitude(), 180)) {
            entity.setLatitude(dto.latitude());
            entity.setLongitude(dto.longitude());
        }
        entity.setMessage(dto.message());
        entity.setImageUrls(String.join(",", imageUrls));
        ReportSightingDTO saved = toSightingDto(sightingRepository.save(entity));

        // Notificar al duenio del reporte que alguien vio a su perro.
        repository.findById(id).ifPresent(report ->
                notificationService.notify(report.getReporterId(), "SIGHTING",
                        "Nuevo aviso sobre " + report.getName(),
                        dto.contactName() + ": " + dto.message(),
                        "/mis-anuncios"));
        return saved;
    }

    private List<String> storeSightingImages(List<MultipartFile> images, int max) {
        return images == null ? List.of() : images.stream()
                .filter(file -> file != null && !file.isEmpty())
                .limit(max)
                .map(imageStorageService::storeSightingImage)
                .filter(Objects::nonNull)
                .toList();
    }

    /**
     * La misma persona vuelve a ver al perro: se guarda como otro avistamiento de su aviso.
     * Si ya hay caso, ademas llega como mensaje al chat (y un caso cerrado como "No es mi perro"
     * se reabre). Si no hay caso y el aviso estaba descartado, vuelve a quedar como nuevo.
     */
    private ReportSightingDTO addAnotherSighting(ReportSightingEntity sighting, LostPetReportEntity report,
                                                 CreateReportSightingDTO dto, List<MultipartFile> images) {
        CaseEntity contactCase = caseRepository.findByReportSightingId(sighting.getSightingId()).orElse(null);
        if (contactCase != null && contactCase.getBlockedBy() != null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "El chat de tu caso sobre este perro esta bloqueado; no se pueden agregar avistamientos.");
        }

        ReportSightingEntryEntity entry = new ReportSightingEntryEntity();
        entry.setSightingId(sighting.getSightingId());
        entry.setLocation(trimTo(dto.location(), 255));
        if (validCoordinate(dto.latitude(), 90) && validCoordinate(dto.longitude(), 180)) {
            entry.setLatitude(dto.latitude());
            entry.setLongitude(dto.longitude());
        }
        entry.setMessage(dto.message().trim());
        List<String> imageUrls = storeSightingImages(images, MAX_SIGHTING_PHOTOS);
        entry.setImageUrls(imageUrls.isEmpty() ? null : String.join(",", imageUrls));
        entry = sightingEntryRepository.save(entry);

        LocalDateTime now = LocalDateTime.now();
        String who = sighting.getContactName() == null ? "Quien aviso" : sighting.getContactName();
        String summary = describeEntry(entry);
        if (contactCase != null) {
            if (REOPENABLE_CASE_STATUSES.contains(contactCase.getStatus())) {
                contactCase.setStatus("OPEN");
                contactCase.setClosedAt(null);
                sighting.setStatus("CASE_OPENED");
                saveCaseMessage(contactCase.getCaseId(), null, AUTOMATIC_SENDER,
                        "El caso se reabrio porque " + who + " envio otro avistamiento.", null);
            }
            saveCaseMessage(contactCase.getCaseId(), sighting.getUserId(),
                    userRepository.findById(sighting.getUserId()).map(u -> u.getUsername()).orElse(who),
                    summary, imageUrls.isEmpty() ? null : String.join("\n", imageUrls));
            contactCase.setLastMessage(trimTo(summary, 2000));
            contactCase.setUpdatedAt(now);
            caseRepository.save(contactCase);
        } else if ("DISMISSED".equals(sighting.getStatus())) {
            sighting.setStatus("NEW");
        }
        sightingRepository.save(sighting);

        notificationService.notify(report.getReporterId(), "SIGHTING",
                "Otro avistamiento de " + report.getName(),
                who + ": " + entry.getMessage(),
                contactCase != null ? "/casos?case=" + contactCase.getCaseId() : "/mis-anuncios");
        return toSightingDto(sighting);
    }

    private void saveCaseMessage(Integer caseId, Integer senderId, String senderName, String text, String imageUrls) {
        CaseMessageEntity message = new CaseMessageEntity();
        message.setCaseId(caseId);
        message.setSenderId(senderId);
        message.setSenderName(senderName);
        message.setMessage(trimTo(text, 2000));
        message.setImageUrls(imageUrls);
        caseMessageRepository.save(message);
    }

    /** Texto del avistamiento para el chat del caso. */
    static String describeEntry(ReportSightingEntryEntity entry) {
        StringBuilder text = new StringBuilder("Otro avistamiento");
        if (entry.getLocation() != null) {
            text.append(" en ").append(entry.getLocation());
        }
        text.append(":\n").append(entry.getMessage());
        if (entry.getLatitude() != null && entry.getLongitude() != null) {
            text.append("\nMapa: https://www.openstreetmap.org/?mlat=").append(entry.getLatitude())
                    .append("&mlon=").append(entry.getLongitude())
                    .append("#map=17/").append(entry.getLatitude()).append("/").append(entry.getLongitude());
        }
        return text.toString();
    }

    private static String trimTo(String value, int max) {
        String clean = ContactData.clean(value);
        return clean == null ? null : clean.length() > max ? clean.substring(0, max) : clean;
    }

    /** Avisos que envio quien consulta ("Avisos enviados" en Solicitudes). */
    @GetMapping("/sightings/mine")
    public List<ReportSightingDTO> getMySightings() {
        Integer me = AuthUtils.currentUserId();
        if (me == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Inicia sesion");
        }
        return sightingRepository.findByUserIdOrderByCreatedAtDesc(me).stream()
                .map(this::toSightingDto)
                .toList();
    }

    /**
     * Quien envio el aviso lo corrige. Sin caso abierto puede cambiar todo (datos, punto del
     * mapa, informacion y fotos); con caso, solo sus datos de contacto. Un aviso marcado como
     * "No es mi perro" ya no se edita: si volvio a ver al perro, envia otro avistamiento.
     */
    @PutMapping(value = "/sightings/{sightingId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ReportSightingDTO updateSighting(
            @PathVariable Integer sightingId,
            @RequestPart("sighting") UpdateReportSightingDTO dto,
            @RequestPart(value = "images", required = false) List<MultipartFile> images
    ) {
        ReportSightingEntity entity = sightingRepository.findById(sightingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Aviso no encontrado"));
        Integer me = AuthUtils.currentUserId();
        if (me == null || !me.equals(entity.getUserId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo quien envio el aviso puede editarlo");
        }
        LostPetReportEntity report = repository.findById(entity.getReportId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reporte no encontrado"));
        userBlockService.requireCanContact(me, report.getReporterId(), "No puedes editar avisos de este reporte.");

        CaseEntity contactCase = caseRepository.findByReportSightingId(sightingId).orElse(null);
        String mode = sightingEditMode(entity, contactCase);
        if ("NONE".equals(mode)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Este aviso ya se cerro y no se puede editar. Si volviste a ver al perro, envia otro avistamiento.");
        }

        String name = ContactData.requireName(dto.contactName());
        String email = ContactData.email(dto.contactEmail(), false);
        String phone = ContactData.phone(dto.contactPhone());
        List<String> changed = ContactData.changedFields(entity.getContactName(), entity.getContactEmail(),
                entity.getContactPhone(), name, email, phone);
        boolean newPhotos = images != null && images.stream().anyMatch(file -> file != null && !file.isEmpty());
        if (newPhotos) {
            dogImageGuard.requireSingleDog(images);
        }

        if ("CONTACT".equals(mode)) {
            boolean messageChanged = dto.message() != null
                    && !Objects.equals(ContactData.clean(dto.message()), ContactData.clean(entity.getMessage()));
            if (messageChanged || newPhotos) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "El caso ya esta abierto: la informacion y las fotos ya no se cambian, mandalas en el chat del caso");
            }
        } else {
            String message = ContactData.clean(dto.message());
            if (message == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Escribe la informacion del avistamiento");
            }
            if (message.length() > 2000) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La informacion admite como maximo 2000 caracteres");
            }
            // Fotos: las actuales que se conservan (en su orden) mas las nuevas, hasta 4.
            List<String> current = splitUrls(entity.getImageUrls());
            List<String> keep = dto.keepImageUrls() == null ? current : current.stream()
                    .filter(url -> dto.keepImageUrls().stream().anyMatch(kept -> kept != null && kept.endsWith(url)))
                    .toList();
            long incoming = newPhotos ? images.stream().filter(file -> file != null && !file.isEmpty()).count() : 0;
            if (keep.size() + incoming > MAX_SIGHTING_PHOTOS) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El aviso admite como maximo 4 fotos");
            }
            List<String> stored = storeSightingImages(images, MAX_SIGHTING_PHOTOS - keep.size());
            List<String> photos = Stream.concat(keep.stream(), stored.stream()).toList();

            entity.setLocation(trimTo(dto.location(), 255));
            boolean validPoint = validCoordinate(dto.latitude(), 90) && validCoordinate(dto.longitude(), 180);
            entity.setLatitude(validPoint ? dto.latitude() : null);
            entity.setLongitude(validPoint ? dto.longitude() : null);
            entity.setMessage(message);
            entity.setImageUrls(String.join(",", photos));
        }

        LocalDateTime now = LocalDateTime.now();
        entity.setContactName(name);
        entity.setContactEmail(email);
        entity.setContactPhone(phone);
        entity.setEditedAt(now);
        sightingRepository.save(entity);

        // Con caso abierto, el cambio de datos queda a la vista en el chat.
        if (contactCase != null && !changed.isEmpty()) {
            String text = name + " actualizo sus datos de contacto (" + ContactData.joinSpanish(changed) + ").";
            saveCaseMessage(contactCase.getCaseId(), null, AUTOMATIC_SENDER, text, null);
            contactCase.setLastMessage(text);
            contactCase.setUpdatedAt(now);
            caseRepository.save(contactCase);
        }

        notificationService.notify(report.getReporterId(), "SIGHTING_EDITED",
                name + " corrigio su aviso",
                "Actualizo su aviso sobre " + report.getName() + ".",
                contactCase != null ? "/casos?case=" + contactCase.getCaseId() : "/mis-anuncios");
        return toSightingDto(entity);
    }

    /** FULL sin caso, CONTACT con caso de contacto abierto, NONE si se descarto o el caso termino. */
    private String sightingEditMode(ReportSightingEntity sighting, CaseEntity contactCase) {
        if (contactCase != null) {
            return CLOSED_CASE_STATUSES.contains(contactCase.getStatus()) ? "NONE" : "CONTACT";
        }
        if ("DISMISSED".equals(sighting.getStatus())) {
            return "NONE";
        }
        return "CASE_OPENED".equals(sighting.getStatus()) ? "CONTACT" : "FULL";
    }

    private static List<String> splitUrls(String urls) {
        return urls == null || urls.isBlank()
                ? List.of()
                : Arrays.stream(urls.split(",")).map(String::trim).filter(value -> !value.isBlank()).toList();
    }

    @GetMapping("/{id}/sightings")
    public List<ReportSightingDTO> getSightings(@PathVariable Integer id) {
        LostPetReportEntity report = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reporte no encontrado"));
        requireOwnerOrAdmin(report); // los avisos traen datos de contacto
        return sightingRepository.findByReportIdOrderByCreatedAtDesc(id).stream()
                .map(this::toSightingDto)
                .toList();
    }

    @GetMapping("/sightings/owner/{ownerId}")
    public List<ReportSightingDTO> getSightingsByOwner(@PathVariable Integer ownerId) {
        if (!AuthUtils.isSelfOrAdmin(ownerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No autorizado");
        }
        return repository.findByReporterId(ownerId).stream()
                .flatMap(report -> sightingRepository.findByReportIdOrderByCreatedAtDesc(report.getReportId()).stream())
                .map(this::toSightingDto)
                .toList();
    }

    @GetMapping("/sightings")
    public List<ReportSightingDTO> getAllSightings() {
        if (!AuthUtils.isAdmin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo un administrador puede ver todos los avisos");
        }
        return sightingRepository.findAll().stream()
                .map(this::toSightingDto)
                .toList();
    }

    @PatchMapping("/sightings/{sightingId}/reply")
    public ReportSightingDTO replySighting(
            @PathVariable Integer sightingId,
            @RequestBody ReplyReportSightingDTO dto
    ) {
        ReportSightingEntity entity = sightingRepository.findById(sightingId)
                .orElseThrow(() -> new RuntimeException("Aviso no encontrado"));
        requireSightingOwnerOrAdmin(entity);
        if (dto.reply() == null || dto.reply().isBlank()) {
            throw new IllegalArgumentException("La respuesta es requerida");
        }
        entity.setOwnerReply(dto.reply());
        entity.setRepliedAt(LocalDateTime.now());
        entity.setStatus(dto.status() == null || dto.status().isBlank() ? "REPLIED" : dto.status());
        ReportSightingDTO saved = toSightingDto(sightingRepository.save(entity));

        // Notificar a quien dio el aviso que el duenio respondio.
        notificationService.notify(entity.getUserId(), "SIGHTING_REPLY",
                "Respondieron tu aviso", dto.reply(), "/casos");
        return saved;
    }

    @PatchMapping("/sightings/{sightingId}/case")
    public ReportSightingDTO updateSightingCase(
            @PathVariable Integer sightingId,
            @RequestBody ReplyReportSightingDTO dto
    ) {
        ReportSightingEntity entity = sightingRepository.findById(sightingId)
                .orElseThrow(() -> new RuntimeException("Aviso no encontrado"));
        requireSightingOwnerOrAdmin(entity);
        String status = dto.status() == null || dto.status().isBlank() ? "CASE_OPENED" : dto.status();
        entity.setStatus(status);
        if ("CASE_OPENED".equals(status) && entity.getCaseOpenedAt() == null) {
            entity.setCaseOpenedAt(LocalDateTime.now());
        }
        if (dto.reply() != null && !dto.reply().isBlank()) {
            entity.setOwnerReply(dto.reply());
            entity.setRepliedAt(LocalDateTime.now());
        }
        return toSightingDto(sightingRepository.save(entity));
    }

    private static boolean validCoordinate(Double value, double limit) {
        return value != null && !value.isNaN() && Math.abs(value) <= limit;
    }

    /** Solo el duenio del reporte avisado (o un admin) puede responder o abrir el caso de un aviso. */
    private void requireSightingOwnerOrAdmin(ReportSightingEntity sighting) {
        LostPetReportEntity report = repository.findById(sighting.getReportId()).orElse(null);
        boolean allowed = report == null ? AuthUtils.isAdmin() : AuthUtils.isSelfOrAdmin(report.getReporterId());
        if (!allowed) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo el responsable del reporte puede gestionar sus avisos");
        }
    }

    private ReportSightingDTO toSightingDto(ReportSightingEntity e) {
        List<String> imageUrls = splitUrls(e.getImageUrls());

        var report = repository.findById(e.getReportId()).orElse(null);
        var owner = report != null ? userRepository.findById(report.getReporterId()).orElse(null) : null;
        CaseEntity contactCase = e.getSightingId() == null ? null
                : caseRepository.findByReportSightingId(e.getSightingId()).orElse(null);
        List<SightingEntryDTO> entries = e.getSightingId() == null ? List.of()
                : sightingEntryRepository.findBySightingIdOrderByCreatedAtAsc(e.getSightingId()).stream()
                .map(entry -> new SightingEntryDTO(entry.getEntryId(), entry.getLocation(), entry.getLatitude(),
                        entry.getLongitude(), entry.getMessage(), splitUrls(entry.getImageUrls()), entry.getCreatedAt()))
                .toList();

        return new ReportSightingDTO(
                e.getSightingId(),
                e.getReportId(),
                e.getUserId(),
                e.getContactName(),
                e.getContactEmail(),
                e.getContactPhone(),
                e.getLocation(),
                e.getLatitude(),
                e.getLongitude(),
                e.getMessage(),
                imageUrls,
                e.getStatus(),
                e.getOwnerReply(),
                report != null ? report.getName() : null,
                report != null ? report.getReporterId() : null,
                owner != null ? owner.getUsername() : null,
                e.getCaseOpenedAt(),
                e.getRepliedAt(),
                e.getCreatedAt(),
                e.getEditedAt(),
                sightingEditMode(e, contactCase),
                contactCase != null ? contactCase.getCaseId() : null,
                contactCase != null ? contactCase.getStatus() : null,
                report != null && report.getType() != null ? report.getType().name() : null,
                report != null ? report.getImageUrl() : null,
                entries
        );
    }

    private LostPetReportDTO toDto(LostPetReportEntity e) {
        return toDto(e, e.getReporterId() == null ? null : userRepository.findById(e.getReporterId()).orElse(null));
    }

    private LostPetReportDTO toDto(LostPetReportEntity e, com.example.pets.petproject.infraestructure.entity.UserEntity reporter) {
        // El correo del autor solo lo ven él mismo y el administrador; GET /reports es público.
        boolean puedeVerCorreo = reporter != null && AuthUtils.isSelfOrAdmin(e.getReporterId());
        return new LostPetReportDTO(
                e.getReportId(),
                e.getReporterId(),
                reporter != null ? reporter.getUsername() : null,
                puedeVerCorreo ? reporter.getEmail() : null,
                e.getType(),
                e.getName(),
                e.getSpecies(),
                e.getBreed(),
                e.getSex(),
                e.getColor(),
                e.getAge(),
                e.getLocation(),
                e.getLatitude(),
                e.getLongitude(),
                e.getDescription(),
                e.getContactPhone(),
                e.getImageUrl(),
                e.imageList(),
                e.getStatus(),
                e.getModerationNotes(),
                e.getCreatedAt(),
                e.getUpdatedAt()
        );
    }
}
