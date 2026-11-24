package com.example.pets.petproject.domain.core;

import com.example.pets.petproject.domain.service.DogDescription;
import com.example.pets.petproject.domain.service.EmbeddingClient;
import com.example.pets.petproject.domain.service.ImageStorageService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

/**
 * Verifica con el ml-service las fotos subidas antes de guardarlas:
 * <ul>
 *   <li>publicar/editar un perro o un reporte ({@link #requireDogs}): cada foto debe ser de un
 *       perro (si no lo es lanza {@link NotADogException}, sin decir que se detecto en su lugar)
 *       y de UN solo perro (con 2 o mas lanza {@link MultipleDogsException});</li>
 *   <li>fotos de un aviso ({@link #requireSingleDog}): pueden no mostrar al perro (p. ej. el
 *       lugar donde se vio), pero si muestran perros debe ser uno solo.</li>
 * </ul>
 *
 * Degrada de forma segura: si el ml-service no responde, no se bloquea el flujo
 * (el reconocimiento es una herramienta de apoyo, no un requisito).
 */
@Service
@Slf4j
public class DogImageGuard {

    private final EmbeddingClient embeddingClient;

    public DogImageGuard(EmbeddingClient embeddingClient) {
        this.embeddingClient = embeddingClient;
    }

    /** Describe una foto (raza u Otro, tamano, etapa, color). Vacio si no se pudo analizar. */
    public Optional<DogDescription> describe(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return Optional.empty();
        }
        try {
            return embeddingClient.describe(file.getBytes(), file.getOriginalFilename(), file.getContentType());
        } catch (IOException e) {
            log.warn("No se pudo leer la imagen {}: {}", file.getOriginalFilename(), e.getMessage());
            return Optional.empty();
        }
    }

    /** Cada foto debe ser de un perro y de uno solo (publicar/editar perro o reporte). */
    public void requireDogs(List<MultipartFile> files) {
        check(files, true);
    }

    /** Fotos de un aviso: se aceptan sin perro, pero no con 2 o mas perros. */
    public void requireSingleDog(List<MultipartFile> files) {
        check(files, false);
    }

    private void check(List<MultipartFile> files, boolean mustBeDog) {
        if (files == null) {
            return;
        }
        long total = files.stream().filter(f -> f != null && !f.isEmpty()).count();
        int index = 0;
        for (MultipartFile file : files) {
            if (file == null || file.isEmpty()) {
                continue;
            }
            index++;
            // Un PDF u otro archivo no se manda a la red: 400 con el mensaje de tipos permitidos.
            ImageStorageService.requireAllowedType(file);
            String prefix = total > 1 ? "Foto " + index + ": " : "";
            Optional<DogDescription> found = describe(file);
            if (found.isEmpty()) {
                continue;   // ml-service sin responder: no se bloquea
            }
            DogDescription d = found.get();
            if (!d.isDog()) {
                if (mustBeDog) {
                    throw new NotADogException(prefix + DogDescription.NOT_A_DOG_MESSAGE);
                }
                continue;
            }
            if (d.dogCount() != null && d.dogCount() >= 2) {
                throw new MultipleDogsException(prefix + multipleDogsMessage(d.dogCount()), d.dogCount());
            }
        }
    }

    public static String multipleDogsMessage(int count) {
        return "La foto tiene " + count + " perros. Sube una foto donde aparezca un solo perro "
                + "(puedes recortarla).";
    }

    public void requireDog(MultipartFile file) {
        if (file != null) {
            requireDogs(List.of(file));
        }
    }

    /** La foto tiene 2 o mas perros: el sistema analiza un solo perro por foto. */
    public static class MultipleDogsException extends RuntimeException {
        private final int count;

        public MultipleDogsException(String message, int count) {
            super(message);
            this.count = count;
        }

        public int getCount() {
            return count;
        }
    }

    /** La foto no es de un perro: no se puede procesar. */
    public static class NotADogException extends RuntimeException {
        public NotADogException(String message) {
            super(message);
        }
    }
}
