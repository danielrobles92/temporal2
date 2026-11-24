package com.example.pets.petproject.domain.model;

import java.util.List;

/**
 * Correccion de un aviso por quien lo envio. Con el caso ya abierto solo cuentan los datos de
 * contacto. {@code keepImageUrls} son las fotos actuales que se conservan; las nuevas llegan
 * como archivos aparte.
 */
public record UpdateReportSightingDTO(
        String contactName,
        String contactEmail,
        String contactPhone,
        String location,
        Double latitude,
        Double longitude,
        String message,
        List<String> keepImageUrls
) {
}
