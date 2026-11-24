package com.example.pets.petproject.application;

import com.example.pets.petproject.domain.core.MatchScoring;
import com.example.pets.petproject.domain.core.DogImageGuard;
import com.example.pets.petproject.domain.core.ImageEmbeddingService;
import com.example.pets.petproject.domain.enums.PetStatus;
import com.example.pets.petproject.domain.enums.ReportType;
import com.example.pets.petproject.domain.model.CreatedPetsDTO;
import com.example.pets.petproject.domain.model.PetsDTO;
import com.example.pets.petproject.domain.model.PotentialMatchDTO;
import com.example.pets.petproject.domain.port.LostPetReportRepositoryDB;
import com.example.pets.petproject.domain.port.PetImageEmbeddingRepositoryDB;
import com.example.pets.petproject.domain.port.ReportImageEmbeddingRepositoryDB;
import com.example.pets.petproject.domain.service.DogDescription;
import com.example.pets.petproject.domain.service.ImageStorageService;
import com.example.pets.petproject.domain.service.PetsService;
import com.example.pets.petproject.infraestructure.entity.LostPetReportEntity;
import com.example.pets.petproject.infraestructure.entity.PetImageEmbeddingEntity;
import com.example.pets.petproject.infraestructure.entity.ReportImageEmbeddingEntity;
import com.example.pets.petproject.security.AuthUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@RestController
@RequestMapping("/pets")
@CrossOrigin
public class PetsController {

    @Autowired
    private PetsService petsService;

    @Autowired
    private ImageStorageService imageStorageService;

    @Autowired
    private ImageEmbeddingService imageEmbeddingService;

    @Autowired
    private DogImageGuard dogImageGuard;

    @Autowired
    private PetImageEmbeddingRepositoryDB petImageEmbeddingRepository;

    @Autowired
    private ReportImageEmbeddingRepositoryDB reportImageEmbeddingRepository;

    @Autowired
    private LostPetReportRepositoryDB reportRepository;

    @Autowired
    private com.example.pets.petproject.domain.port.PetsRepositoryDB petsRepository;

    @GetMapping
    public Page<PetsDTO> getAllPets(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) PetStatus status
    ) {
        return petsService.getAllPets(page, size, status);
    }

    @GetMapping("/details/{id}")
    public PetsDTO getPetById(@PathVariable Integer id) {
        return petsService.getPetById(id);
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public PetsDTO createPet(@RequestBody CreatedPetsDTO dto) {
        return petsService.createPet(dto);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public PetsDTO createPetWithImages(
            @RequestPart("pet") CreatedPetsDTO dto,
            @RequestPart(value = "images", required = false) List<MultipartFile> images
    ) {
        dogImageGuard.requireDogs(images); // no es perro o tiene 2+ perros -> 422
        List<String> imagePaths = List.of();
        if (images != null) {
            imagePaths = images.stream()
                    .map(imageStorageService::storePetImage)
                    .filter(path -> path != null && !path.isBlank())
                    .toList();
        }

        CreatedPetsDTO dtoWithPaths = new CreatedPetsDTO(
                dto.ownerId(),
                dto.name(),
                dto.species(),
                dto.breed(),
                dto.sex(),
                dto.color(),
                dto.size(),
                dto.age(),
                dto.description(),
                dto.location(),
                dto.latitude(),
                dto.longitude(),
                dto.status(),
                imagePaths,
                dto.birthDate(),
                dto.weightKg(),
                dto.sterilized(),
                dto.microchip(),
                dto.dewormedAt(),
                dto.vetName(),
                dto.medicalNotes(),
                dto.vaccines()
        );

        return petsService.createPet(dtoWithPaths);
    }

    @PutMapping("/updatePet/{id}")
    public PetsDTO updateData(@PathVariable Integer id, @RequestBody PetsDTO dto) {
        requireOwnerOrAdmin(id);
        return petsService.updatePet(id, dto);
    }

    @PutMapping(value = "/updatePet/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public PetsDTO updateDataWithImages(
            @PathVariable Integer id,
            @RequestPart("pet") PetsDTO dto,
            @RequestPart(value = "images", required = false) List<MultipartFile> images
    ) {
        requireOwnerOrAdmin(id);
        dogImageGuard.requireDogs(images);
        List<String> imagePaths = List.of();
        if (images != null) {
            imagePaths = images.stream()
                    .map(imageStorageService::storePetImage)
                    .filter(path -> path != null && !path.isBlank())
                    .toList();
        }

        return petsService.updatePetWithImages(id, dto, imagePaths);
    }

    @DeleteMapping("/{id}")
    public void deletePet(@PathVariable Integer id) {
        requireOwnerOrAdmin(id);
        petsService.deleteById(id);
    }

    @PatchMapping("/{id}/deactivate")
    public PetsDTO deactivatePet(@PathVariable Integer id) {
        requireOwnerOrAdmin(id);
        return petsService.deactivatePet(id);
    }

    /** RN-09: solo el duenio de la publicacion o un admin puede editarla/eliminarla. */
    private void requireOwnerOrAdmin(Integer petId) {
        PetsDTO pet = petsService.getPetById(petId);
        if (!AuthUtils.isSelfOrAdmin(pet.ownerId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No autorizado");
        }
    }

    @GetMapping("/owner/{ownerId}")
    public List<PetsDTO> getPetsByOwner(@PathVariable Integer ownerId) {
        return petsService.getPetsByOwner(ownerId);
    }

    /**
     * Genera los embeddings faltantes de las imagenes de mascotas ya existentes
     * (utilidad para poblar el indice visual con el catalogo actual).
     */
    @PostMapping("/embeddings/backfill")
    public Map<String, Integer> backfillEmbeddings(@RequestParam(defaultValue = "false") boolean force) {
        if (force && !AuthUtils.isAdmin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo un administrador puede re-analizar todo");
        }
        return Map.of("processed", imageEmbeddingService.backfillMissing(force));
    }

    /**
     * Sugerencias para una publicacion de perro PERDIDO: compara sus fotos contra
     * los reportes de tipo ENCONTRADO (raza + similitud individual + % calibrado).
     * Solo lectura (no se persisten como coincidencias).
     */
    @GetMapping("/{id}/matches")
    public List<PotentialMatchDTO> getPetMatches(@PathVariable Integer id) {
        var pet = petsRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mascota no encontrada"));
        if (pet.getStatus() != PetStatus.LOST) {
            return List.of();
        }

        // Embeddings y lo que detectó la red en las fotos de la mascota.
        List<float[]> petVectors = new ArrayList<>();
        MatchScoring.AiBuilder petAi = new MatchScoring.AiBuilder();
        for (PetImageEmbeddingEntity e : petImageEmbeddingRepository.findByImage_Pet_PetIdIn(List.of(id))) {
            if (e.getEmbedding() != null) {
                petVectors.add(e.getEmbedding());
            }
            petAi.add(e.getBreed(), e.getBreedConfidence(), e.getSize(), e.getStage(), e.getColors());
        }

        // Candidatos: reportes ENCONTRADO con su embedding/raza.
        List<LostPetReportEntity> found = reportRepository.findByType(ReportType.FOUND);
        Map<Integer, List<ReportImageEmbeddingEntity>> embByReport = new java.util.HashMap<>();
        if (!found.isEmpty()) {
            List<Integer> ids = found.stream().map(LostPetReportEntity::getReportId).toList();
            for (ReportImageEmbeddingEntity e : reportImageEmbeddingRepository.findByReportIdIn(ids)) {
                embByReport.computeIfAbsent(e.getReportId(), k -> new ArrayList<>()).add(e);
            }
        }

        // Mismo porcentaje de coincidencia que entre reportes (domain/core/MatchScoring).
        MatchScoring.Side me = new MatchScoring.Side(petVectors, petAi.build(), pet.getBreed(), pet.getColor(),
                pet.getLatitude(), pet.getLongitude(), pet.getLocation(), pet.getSex());
        List<PotentialMatchDTO> results = new ArrayList<>();
        for (LostPetReportEntity r : found) {
            ReportsController.ReportVisual rv =
                    ReportsController.reportVisual(embByReport.getOrDefault(r.getReportId(), List.of()));
            MatchScoring.Side other = new MatchScoring.Side(rv.embeddings(), rv.ai(), r.getBreed(), r.getColor(),
                    r.getLatitude(), r.getLongitude(), r.getLocation(), r.getSex());
            MatchScoring.Result scored = MatchScoring.score(me, other);
            if (!MatchScoring.isShown(scored)) {
                continue;   // baja (40 % o menos) o sin ningún rasgo en común
            }
            results.add(new PotentialMatchDTO(null, null, null, r.getName(), r.getImageUrl(),
                    scored.total(), scored.visual(), scored.sameDogProbability(), scored.reason(), "SUGGESTED",
                    ReportsController.displayBreed(other), r.getReportId(), ReportsController.aiDto(me.ai()),
                    ReportsController.aiDto(other.ai())));
        }

        results.sort(ReportsController.BY_SCORE);
        return results.stream().limit(10).toList();
    }
}
