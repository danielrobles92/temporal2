package com.example.pets.petproject.domain.core;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.Locale;

/**
 * Convierte el texto de un estado o rol recibido en la API. Si el valor no existe responde
 * 400 con los valores permitidos, en lugar del 500 de Enum.valueOf (RNF-04).
 */
public final class EnumParser {

    private EnumParser() {
    }

    /** Valor de un enum; no distingue mayusculas y minusculas. */
    public static <E extends Enum<E>> E parse(Class<E> type, String value, String campo) {
        if (value != null && !value.isBlank()) {
            String normalized = value.trim().toUpperCase(Locale.ROOT);
            for (E constant : type.getEnumConstants()) {
                if (constant.name().equals(normalized)) {
                    return constant;
                }
            }
        }
        List<String> allowed = Arrays.stream(type.getEnumConstants()).map(Enum::name).toList();
        throw invalid(campo, value, allowed);
    }

    /** Valor que debe ser exactamente uno de los permitidos (estados guardados como texto). */
    public static String requireOneOf(String value, Collection<String> allowed, String campo) {
        if (value != null && allowed.contains(value.trim())) {
            return value.trim();
        }
        throw invalid(campo, value, allowed);
    }

    private static ResponseStatusException invalid(String campo, String value, Collection<String> allowed) {
        String detail = value == null || value.isBlank()
                ? campo + " es requerido"
                : campo + " no válido: «" + value + "»";
        return new ResponseStatusException(HttpStatus.BAD_REQUEST,
                detail + ". Valores permitidos: " + String.join(", ", allowed));
    }
}
