package com.example.pets.petproject.domain.service;

import java.util.List;

/**
 * Descripcion del perro de una foto generada por el ml-service (POST /describe,
 * modelo DogNet v2): si es un perro, la raza entre las 20 del catalogo u "Otro"
 * (otra raza o mestizo), tamano con peso orientativo, etapa de vida (cachorro: menos
 * de 1 año, o adulto) y los colores del pelaje. Si no es un perro solo se informa eso
 * (no se dice que es: gato, peluche, etc.).
 *
 * Es una sugerencia del modelo, no una identificacion definitiva.
 */
public record DogDescription(
        boolean isDog,
        String animal,
        Float dogProbability,
        String message,
        String breed,
        Float breedConfidence,
        boolean inCatalog,
        List<BreedScore> breedTop,
        String size,
        Float sizeConfidence,
        Float weightMinKg,
        Float weightMaxKg,
        String age,
        Float ageConfidence,
        Float puppyProbability,
        String color,
        String colorSecondary,
        String colorLabel,
        // Todos los colores detectados, del que mas pelaje cubre al que menos (share 0-1).
        List<ColorShare> colors,
        // Perros detectados en la foto (null si no se contaron). Con 2 o mas se rechaza.
        Integer dogCount,
        // Parte de la foto donde se vio al perro: el centro o una seccion (null si no es perro).
        ViewInfo view
) {

    /** Valor de raza para perros fuera del catalogo de 20 razas o mestizos. */
    public static final String OTHER_BREED = "Otro";

    /** Unica respuesta cuando la foto no es de un perro (no se dice si es gato, peluche, etc.). */
    public static final String NOT_A_DOG_MESSAGE = "La imagen no se identifica como un perro. No se puede procesar.";

    public record BreedScore(String breed, Float score) {
    }

    public record ColorShare(String name, Float share) {
    }

    /** kind: "centro" | "seccion"; index 0 = centro; box = [x1, y1, x2, y2] de 0 a 1. */
    public record ViewInfo(String kind, Integer index, Integer total, List<Float> box) {
    }

    /** true si la raza es una de las 20 del catalogo (no nula ni "Otro"). */
    public static boolean isCatalogBreed(String breed) {
        return breed != null && !breed.isBlank() && !OTHER_BREED.equalsIgnoreCase(breed.trim());
    }
}
