-- Respuestas de quien quiere adoptar a las preguntas de cuidados y de la raza del perro
-- (JSON: [{id, question, answer, flag}]). Las ve quien publico en Solicitudes y en el chat del caso.
-- Las solicitudes anteriores quedan sin respuestas (NULL).
-- Idempotente. Ejecutar conectado a la base pet_adoption.

ALTER TABLE adoption_requests ADD COLUMN IF NOT EXISTS applicant_answers TEXT;
