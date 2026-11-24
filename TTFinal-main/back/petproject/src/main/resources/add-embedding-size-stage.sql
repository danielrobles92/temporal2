-- Tamano (pequeno | mediano | grande) y etapa de vida (cachorro | adulto) que detecta la red en
-- cada foto; "" = foto analizada sin el dato (p. ej. no es perro), NULL = aun sin analizar.
-- Se usan en el bloque «Lo que dice la foto» del porcentaje de coincidencia (domain/core/MatchScoring).
-- Idempotente. Ejecutar conectado a la base pet_adoption.

ALTER TABLE report_image_embeddings ADD COLUMN IF NOT EXISTS size VARCHAR(16);
ALTER TABLE report_image_embeddings ADD COLUMN IF NOT EXISTS stage VARCHAR(16);
ALTER TABLE pet_image_embeddings ADD COLUMN IF NOT EXISTS size VARCHAR(16);
ALTER TABLE pet_image_embeddings ADD COLUMN IF NOT EXISTS stage VARCHAR(16);
