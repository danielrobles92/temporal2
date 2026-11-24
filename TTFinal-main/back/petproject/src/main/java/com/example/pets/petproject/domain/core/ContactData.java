package com.example.pets.petproject.domain.core;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.regex.Pattern;

/** Validacion y comparacion de los datos de contacto al corregir una solicitud o un aviso. */
public final class ContactData {

    private static final Pattern EMAIL = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");
    private static final Pattern PHONE = Pattern.compile("^\\d{10}$");

    private ContactData() {}

    /** Texto sin espacios de mas; null si queda vacio. */
    public static String clean(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    public static String requireName(String name) {
        String value = clean(name);
        if (value == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Escribe tu nombre");
        }
        if (value.length() > 150) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El nombre admite como maximo 150 caracteres");
        }
        return value;
    }

    /** Correo opcional (o requerido) con formato valido. */
    public static String email(String email, boolean required) {
        String value = clean(email);
        if (value == null) {
            if (required) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Escribe tu correo");
            }
            return null;
        }
        if (!EMAIL.matcher(value).matches() || value.length() > 180) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El correo no es valido");
        }
        return value;
    }

    /** Telefono opcional: si se escribe, 10 digitos (igual que en el formulario). */
    public static String phone(String phone) {
        String value = clean(phone);
        if (value == null) return null;
        if (!PHONE.matcher(value).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El telefono debe tener 10 digitos");
        }
        return value;
    }

    /** Nombres de los datos de contacto que cambiaron, para avisar en el caso. */
    public static List<String> changedFields(String oldName, String oldEmail, String oldPhone,
                                             String newName, String newEmail, String newPhone) {
        List<String> changed = new ArrayList<>();
        if (!Objects.equals(clean(oldName), clean(newName))) changed.add("nombre");
        if (!Objects.equals(clean(oldEmail), clean(newEmail))) changed.add("correo");
        if (!Objects.equals(clean(oldPhone), clean(newPhone))) changed.add("telefono");
        return changed;
    }

    /** "nombre, correo y telefono" */
    public static String joinSpanish(List<String> items) {
        if (items.size() <= 1) return String.join("", items);
        return String.join(", ", items.subList(0, items.size() - 1)) + " y " + items.get(items.size() - 1);
    }
}
