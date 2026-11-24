package com.example.pets.petproject.domain.model;

import java.util.List;

/**
 * Lo que detectó la red en las fotos de un perro, para mostrarlo junto al de la coincidencia:
 * raza con su certeza (0-1), tamaño (pequeno | mediano | grande), etapa (cachorro | adulto) y colores.
 */
public record AiSummaryDTO(String breed, Float breedConfidence, String size, String stage, List<String> colors) {
}
