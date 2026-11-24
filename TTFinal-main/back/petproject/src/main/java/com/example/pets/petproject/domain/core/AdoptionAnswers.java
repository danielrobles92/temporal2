package com.example.pets.petproject.domain.core;

import com.example.pets.petproject.domain.model.RequestAnswer;
import tools.jackson.core.JacksonException;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.json.JsonMapper;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Respuestas de una solicitud de adopcion (columna adoption_requests.applicant_answers, JSON).
 * Limpia lo que manda el cliente (largos, repetidas, vacias) y da el texto para el chat del caso.
 */
public final class AdoptionAnswers {

    private static final JsonMapper JSON = JsonMapper.builder().build();
    private static final TypeReference<List<RequestAnswer>> LIST = new TypeReference<>() {};
    private static final int MAX_ANSWERS = 25;
    private static final int MAX_ID = 40;
    private static final int MAX_QUESTION = 300;
    private static final int MAX_ANSWER = 200;

    private AdoptionAnswers() {}

    /** Respuestas validas (sin vacias ni repetidas). null si no se mandaron. */
    public static List<RequestAnswer> clean(List<RequestAnswer> answers) {
        if (answers == null) {
            return null;
        }
        if (answers.size() > MAX_ANSWERS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Demasiadas respuestas en la solicitud");
        }
        List<RequestAnswer> out = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        for (RequestAnswer a : answers) {
            if (a == null) {
                continue;
            }
            String id = trim(a.id(), MAX_ID);
            String question = trim(a.question(), MAX_QUESTION);
            String answer = trim(a.answer(), MAX_ANSWER);
            if (id == null || question == null || answer == null || !seen.add(id)) {
                continue;
            }
            out.add(new RequestAnswer(id, question, answer, Boolean.TRUE.equals(a.flag())));
        }
        return out;
    }

    public static String toJson(List<RequestAnswer> answers) {
        if (answers == null || answers.isEmpty()) {
            return null;
        }
        try {
            return JSON.writeValueAsString(answers);
        } catch (JacksonException e) {
            throw new IllegalStateException("No se pudieron guardar las respuestas", e);
        }
    }

    /** Lista guardada (vacia si no hay o si el JSON no se puede leer). */
    public static List<RequestAnswer> fromJson(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            return JSON.readValue(json, LIST);
        } catch (JacksonException e) {
            return List.of();
        }
    }

    /** "Respuestas a las preguntas:\n- Pregunta: respuesta" para el chat del caso (null si no hay). */
    public static String toText(String json) {
        List<RequestAnswer> answers = fromJson(json);
        if (answers.isEmpty()) {
            return null;
        }
        StringBuilder text = new StringBuilder("Respuestas a las preguntas:");
        for (RequestAnswer a : answers) {
            text.append("\n- ").append(a.question()).append(" ").append(a.answer());
            if (Boolean.TRUE.equals(a.flag())) {
                text.append(" (para platicar)");
            }
        }
        return text.toString();
    }

    private static String trim(String value, int max) {
        if (value == null) {
            return null;
        }
        String t = value.trim();
        if (t.isEmpty()) {
            return null;
        }
        return t.length() > max ? t.substring(0, max) : t;
    }
}
