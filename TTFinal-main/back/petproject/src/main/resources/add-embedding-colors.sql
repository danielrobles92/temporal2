-- Colores del pelaje que detecta la red en cada foto (segmentacion + k-means del ml-service),
-- separados por coma; "" = foto analizada sin color (p. ej. no es perro), NULL = aun sin analizar.
-- Se usan en el porcentaje de coincidencia (domain/core/MatchScoring) junto al color capturado.
-- Idempotente. Ejecutar conectado a la base pet_adoption.

ALTER TABLE report_image_embeddings ADD COLUMN IF NOT EXISTS colors VARCHAR(120);
ALTER TABLE pet_image_embeddings ADD COLUMN IF NOT EXISTS colors VARCHAR(120);
