package com.example.pets.petproject.domain.service;

import java.util.List;

/**
 * Resultado del analisis de una imagen por el ml-service: embedding individual
 * (EfficientNetB0 crudo) + raza predicha (20 razas u "Otro") con su confianza,
 * y la compuerta de animal: "dog" o "not_dog" (en el modelo v1 "wild_canid" u "other").
 */
public record ImageAnalysis(float[] embedding, String breed, Float breedConfidence, String animal,
                            List<String> colors, String size, String stage) {

    /** Colores separados por coma para guardar ("" si la foto no tiene colores detectados). */
    public String colorsText() {
        return colors == null ? "" : String.join(",", colors);
    }

    public boolean isDog() {
        return animal == null || "dog".equals(animal);
    }
}
