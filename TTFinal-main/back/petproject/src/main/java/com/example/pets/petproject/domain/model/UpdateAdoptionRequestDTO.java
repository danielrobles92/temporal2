package com.example.pets.petproject.domain.model;

import java.util.List;

/** Correccion de una solicitud de adopcion por quien la envio. */
public record UpdateAdoptionRequestDTO(
        String contactName,
        String contactEmail,
        String contactPhone,
        String message,
        // null = no se cambian; solo mientras la solicitud esta pendiente.
        List<RequestAnswer> answers
) {
}
