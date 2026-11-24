package com.example.pets.petproject.domain.core;

import com.example.pets.petproject.domain.port.LostPetReportRepositoryDB;
import com.example.pets.petproject.domain.port.PetImageEmbeddingRepositoryDB;
import com.example.pets.petproject.domain.port.PetsRepositoryDB;
import com.example.pets.petproject.domain.port.ReportImageEmbeddingRepositoryDB;
import com.example.pets.petproject.domain.service.DogDescription;
import com.example.pets.petproject.domain.service.EmbeddingClient;
import com.example.pets.petproject.domain.service.ImageAnalysis;
import com.example.pets.petproject.domain.service.ImageStorageService;
import com.example.pets.petproject.infraestructure.entity.ImageEntity;
import com.example.pets.petproject.infraestructure.entity.LostPetReportEntity;
import com.example.pets.petproject.infraestructure.entity.PetImageEmbeddingEntity;
import com.example.pets.petproject.infraestructure.entity.PetsEntity;
import com.example.pets.petproject.infraestructure.entity.ReportImageEmbeddingEntity;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

/**
 * Orquesta el analisis (embedding individual + raza) y su persistencia para las
 * imagenes de mascotas, y el analisis del lado reporte para el matching. El calculo
 * pesado vive en el ml-service; aqui solo se coordina lectura, llamada y guardado.
 *
 * Degrada de forma segura: si el ml-service no responde, no se interrumpe el flujo
 * principal (publicar/editar mascota).
 */
@Service
@Slf4j
public class ImageEmbeddingService {

    private static final String MODEL = "efficientnet_b0";

    private final EmbeddingClient embeddingClient;
    private final PetImageEmbeddingRepositoryDB embeddingRepository;
    private final ReportImageEmbeddingRepositoryDB reportEmbeddingRepository;
    private final ImageStorageService imageStorageService;
    private final PetsRepositoryDB petsRepository;
    private final LostPetReportRepositoryDB reportRepository;

    public ImageEmbeddingService(
            EmbeddingClient embeddingClient,
            PetImageEmbeddingRepositoryDB embeddingRepository,
            ReportImageEmbeddingRepositoryDB reportEmbeddingRepository,
            ImageStorageService imageStorageService,
            PetsRepositoryDB petsRepository,
            LostPetReportRepositoryDB reportRepository
    ) {
        this.embeddingClient = embeddingClient;
        this.embeddingRepository = embeddingRepository;
        this.reportEmbeddingRepository = reportEmbeddingRepository;
        this.imageStorageService = imageStorageService;
        this.petsRepository = petsRepository;
        this.reportRepository = reportRepository;
    }

    /** Analiza y guarda (embedding + raza) cada imagen de la mascota que falte. */
    @Transactional
    public void embedPetImages(PetsEntity pet) {
        if (pet == null || pet.getImages() == null) {
            return;
        }
        for (ImageEntity image : pet.getImages()) {
            processImage(image, false);
        }
        fillMissingSize(pet);
    }

    /** Procesa imagenes sin embedding o sin raza. Devuelve cuantas guardo/actualizo. */
    @Transactional
    public int backfillMissing() {
        return backfillMissing(false);
    }

    /**
     * Como backfillMissing; con force=true vuelve a analizar TODAS las imagenes
     * (p. ej. tras cambiar el modelo de raza: 20 razas + "Otro" + no-perro).
     */
    @Transactional
    public int backfillMissing(boolean force) {
        int processed = 0;
        for (PetsEntity pet : petsRepository.findAll()) {
            if (pet.getImages() == null) {
                continue;
            }
            for (ImageEntity image : pet.getImages()) {
                if (processImage(image, force)) {
                    processed++;
                }
            }
            fillMissingSize(pet);
        }
        return processed;
    }

    /** Analiza (sin persistir) la imagen de un reporte: embedding individual + raza. */
    public Optional<ImageAnalysis> analyzeReportImage(String imageUrl) {
        byte[] bytes = imageStorageService.readStoredImage(imageUrl);
        if (bytes == null) {
            return Optional.empty();
        }
        String filename = filenameFor(imageUrl);
        return embeddingClient.analyze(bytes, filename, contentTypeFor(filename));
    }

    /**
     * Guarda embedding + raza de cada foto del reporte. Si ya estan todas analizadas
     * no hace nada, salvo con force=true (re-analiza). Al cambiar las fotos se
     * reemplazan las filas anteriores. true si guardo al menos una.
     */
    @Transactional
    public boolean embedReport(LostPetReportEntity report, boolean force) {
        if (report == null || report.getReportId() == null) {
            return false;
        }
        List<String> urls = report.imageList();
        List<ReportImageEmbeddingEntity> existing = reportEmbeddingRepository.findByReportId(report.getReportId());
        // Filas sin colores, tamano o etapa (analizadas antes de que se guardaran) cuentan como desactualizadas.
        boolean upToDate = !existing.isEmpty() && existing.size() == urls.size()
                && existing.stream().allMatch(e -> urls.contains(e.getImageUrl()) && e.getColors() != null
                        && e.getSize() != null && e.getStage() != null);
        if (upToDate && !force) {
            return false;
        }
        // Las filas viejas se borran solo cuando su foto ya no está en el reporte o cuando la red
        // devolvió el análisis nuevo: si ml-service no responde, el reporte conserva sus vectores.
        Map<String, ImageAnalysis> fresh = new LinkedHashMap<>();
        for (String url : urls) {
            analyzeReportImage(url).ifPresent(a -> fresh.put(url, a));
        }
        reportEmbeddingRepository.deleteAll(existing.stream()
                .filter(e -> !urls.contains(e.getImageUrl()) || fresh.containsKey(e.getImageUrl()))
                .toList());

        boolean saved = false;
        for (Map.Entry<String, ImageAnalysis> item : fresh.entrySet()) {
            String url = item.getKey();
            ImageAnalysis a = item.getValue();
            if (!a.isDog()) {
                log.warn("Reporte {}: la imagen {} no parece un perro (animal={}); no se asigna raza",
                        report.getReportId(), url, a.animal());
            }
            ReportImageEmbeddingEntity entity = new ReportImageEmbeddingEntity();
            entity.setReportId(report.getReportId());
            entity.setImageUrl(url);
            entity.setEmbedding(a.embedding());
            entity.setDim(a.embedding().length);
            entity.setModel(MODEL);
            entity.setBreed(a.isDog() ? a.breed() : null);
            entity.setBreedConfidence(a.isDog() ? a.breedConfidence() : null);
            entity.setColors(a.isDog() ? a.colorsText() : "");
            entity.setSize(a.isDog() && a.size() != null ? a.size() : "");
            entity.setStage(a.isDog() && a.stage() != null ? a.stage() : "");
            entity.setCreatedAt(LocalDateTime.now());
            reportEmbeddingRepository.save(entity);
            saved = true;
        }
        return saved;
    }

    /** Como embedReport, pero no interrumpe el flujo principal si falla. */
    public void embedReportSafely(LostPetReportEntity report) {
        try {
            embedReport(report, false);
        } catch (Exception e) {
            log.warn("No se pudo generar embedding del reporte {}: {}", report.getReportId(), e.getMessage());
        }
    }

    /** Procesa los reportes con fotos que aun no tienen embedding. */
    @Transactional
    public int backfillReports() {
        return backfillReports(false);
    }

    @Transactional
    public int backfillReports(boolean force) {
        int processed = 0;
        for (LostPetReportEntity report : reportRepository.findAll()) {
            if (report.imageList().isEmpty()) {
                continue;
            }
            if (embedReport(report, force)) {
                processed++;
            }
        }
        return processed;
    }

    /**
     * Llena el tamano de una mascota que no lo tiene con lo que detecta la red
     * en su foto principal (pequeno, mediano o grande). true si lo asigno.
     */
    private boolean fillMissingSize(PetsEntity pet) {
        if (pet.getSize() != null || pet.getImages() == null || pet.getImages().isEmpty()) {
            return false;
        }
        String url = pet.getImages().get(0).getUrlImage();
        byte[] bytes = imageStorageService.readStoredImage(url);
        if (bytes == null) {
            return false;
        }
        String filename = filenameFor(url);
        Optional<String> size = embeddingClient.describe(bytes, filename, contentTypeFor(filename))
                .filter(DogDescription::isDog)
                .map(DogDescription::size);
        if (size.isEmpty()) {
            return false;
        }
        pet.setSize(size.get());
        petsRepository.save(pet);
        return true;
    }

    /** Inserta o completa el embedding+raza de una imagen. true si hizo trabajo. */
    private boolean processImage(ImageEntity image, boolean force) {
        if (image == null || image.getImageId() == null) {
            return false;
        }
        PetImageEmbeddingEntity existing = embeddingRepository
                .findByImage_ImageId(image.getImageId())
                .orElse(null);
        if (existing != null && existing.getBreed() != null && existing.getColors() != null
                && existing.getSize() != null && existing.getStage() != null && !force) {
            return false; // ya tiene embedding, raza, colores, tamano y etapa
        }

        byte[] bytes = imageStorageService.readStoredImage(image.getUrlImage());
        if (bytes == null) {
            return false;
        }
        String filename = filenameFor(image.getUrlImage());
        Optional<ImageAnalysis> analysis = embeddingClient.analyze(bytes, filename, contentTypeFor(filename));
        if (analysis.isEmpty()) {
            return false;
        }

        ImageAnalysis a = analysis.get();
        if (!a.isDog()) {
            log.warn("Imagen {} no parece un perro (animal={}); no se asigna raza", filename, a.animal());
        }
        PetImageEmbeddingEntity entity = existing != null ? existing : new PetImageEmbeddingEntity();
        if (existing == null) {
            entity.setImage(image);
            entity.setCreatedAt(LocalDateTime.now());
        }
        entity.setEmbedding(a.embedding());
        entity.setDim(a.embedding().length);
        entity.setModel(MODEL);
        // Si no es un perro (lobo/otro), no se asigna raza: nunca pasara el filtro de raza.
        entity.setBreed(a.isDog() ? a.breed() : null);
        entity.setBreedConfidence(a.isDog() ? a.breedConfidence() : null);
        entity.setColors(a.isDog() ? a.colorsText() : "");
        entity.setSize(a.isDog() && a.size() != null ? a.size() : "");
        entity.setStage(a.isDog() && a.stage() != null ? a.stage() : "");
        embeddingRepository.save(entity);
        return true;
    }

    private String filenameFor(String url) {
        if (url == null || url.isBlank()) {
            return "imagen.jpg";
        }
        int slash = url.lastIndexOf('/');
        return slash >= 0 ? url.substring(slash + 1) : url;
    }

    private String contentTypeFor(String filename) {
        String lower = filename.toLowerCase(Locale.ROOT);
        if (lower.endsWith(".png")) {
            return "image/png";
        }
        if (lower.endsWith(".webp")) {
            return "image/webp";
        }
        return "image/jpeg";
    }

    // Calibracion P(mismo perro) = sigmoid(W*cos + B), ajustada sobre el dataset MX
    // (ml-service/experiments/calibrate.py): positivos mismo-perro vs negativos
    // misma-raza. Frontera 50% en cos=0.75; "muy probable" (>=70%) en cos>=0.77.
    private static final double CALIB_W = 30.9448;
    private static final double CALIB_B = -23.0951;

    /** Probabilidad calibrada [0,1] de que dos fotos sean del mismo perro, dado el coseno. */
    public static double sameDogProbability(double cosine) {
        double z = CALIB_W * cosine + CALIB_B;
        return 1.0 / (1.0 + Math.exp(-z));
    }

    /**
     * Similitud del coseno entre dos vectores. Los embeddings vienen normalizados
     * (norma L2 = 1) desde el ml-service, asi que equivale al producto punto.
     */
    public static double cosine(float[] a, float[] b) {
        if (a == null || b == null || a.length != b.length) {
            return 0.0;
        }
        double dot = 0.0, normA = 0.0, normB = 0.0;
        for (int i = 0; i < a.length; i++) {
            dot += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        if (normA == 0.0 || normB == 0.0) {
            return 0.0;
        }
        return dot / (Math.sqrt(normA) * Math.sqrt(normB));
    }
}
