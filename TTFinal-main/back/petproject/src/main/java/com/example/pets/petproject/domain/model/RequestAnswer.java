package com.example.pets.petproject.domain.model;

/**
 * Respuesta de quien quiere adoptar a una pregunta del formulario (cuidados del perro y de su
 * raza). Se guarda el texto de la pregunta tal como la vio, para que quien publico lea lo mismo.
 *
 * @param id       identificador de la pregunta (constants/adoptionQuestions.js en el front)
 * @param question texto de la pregunta
 * @param answer   opcion elegida
 * @param flag     true si la respuesta es un tema para platicar con el solicitante
 */
public record RequestAnswer(String id, String question, String answer, Boolean flag) {
}
