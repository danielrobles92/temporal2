-- Editar solicitudes de adopcion y avisos en vez de mandar otros nuevos.
-- Una sola solicitud por persona y perro, y un solo aviso por persona y reporte; si la persona
-- vuelve a ver al perro, se agrega como "otro avistamiento" de su mismo aviso.
-- Idempotente. Ejecutar conectado a la base pet_adoption.

BEGIN;

-- Fecha de la ultima correccion (se muestra como "Editada el ...").
ALTER TABLE adoption_requests ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP;
ALTER TABLE report_sightings ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP;

-- Avistamientos adicionales de la misma persona sobre el mismo reporte.
CREATE TABLE IF NOT EXISTS report_sighting_entries (
    entry_id SERIAL PRIMARY KEY,
    sighting_id INTEGER NOT NULL REFERENCES report_sightings(sighting_id) ON DELETE CASCADE,
    location VARCHAR(255),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    message VARCHAR(2000) NOT NULL,
    image_urls VARCHAR(4000),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_report_sighting_entries_sighting
    ON report_sighting_entries(sighting_id, created_at);

-- Unir los avisos repetidos que ya existen (misma persona y mismo reporte): se conserva el que
-- tiene caso (o el mas antiguo) y los demas pasan a ser "otros avistamientos" de ese aviso.
-- Un repetido que tiene su propio caso no se toca.
CREATE TEMP TABLE sighting_merge ON COMMIT DROP AS
WITH ranked AS (
    SELECT s.sighting_id, s.report_id, s.user_id, c.case_id IS NOT NULL AS has_case,
           ROW_NUMBER() OVER (PARTITION BY s.report_id, s.user_id
                              ORDER BY (c.case_id IS NULL), s.created_at, s.sighting_id) AS rn
      FROM report_sightings s
      LEFT JOIN cases c ON c.report_sighting_id = s.sighting_id
     WHERE s.user_id IS NOT NULL
)
SELECT dup.sighting_id AS dup_id, keep.sighting_id AS keep_id
  FROM ranked dup
  JOIN ranked keep ON keep.report_id = dup.report_id AND keep.user_id = dup.user_id AND keep.rn = 1
 WHERE dup.rn > 1 AND NOT dup.has_case;

INSERT INTO report_sighting_entries (sighting_id, location, latitude, longitude, message, image_urls, created_at)
SELECT m.keep_id, s.location, s.latitude, s.longitude, s.message, s.image_urls, s.created_at
  FROM sighting_merge m
  JOIN report_sightings s ON s.sighting_id = m.dup_id;

DELETE FROM report_sightings s USING sighting_merge m WHERE s.sighting_id = m.dup_id;

-- Una solicitud por persona y perro (el backend ya lo validaba; ahora tambien la base).
CREATE UNIQUE INDEX IF NOT EXISTS ux_adoption_requests_pet_user
    ON adoption_requests(pet_id, user_id);

-- Un aviso por persona y reporte (solo si ya no quedan repetidos con caso propio).
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM report_sightings WHERE user_id IS NOT NULL
         GROUP BY report_id, user_id HAVING COUNT(*) > 1
    ) THEN
        CREATE UNIQUE INDEX IF NOT EXISTS ux_report_sightings_report_user
            ON report_sightings(report_id, user_id) WHERE user_id IS NOT NULL;
    ELSE
        RAISE NOTICE 'Quedan avisos repetidos con caso propio; no se creo ux_report_sightings_report_user';
    END IF;
END $$;

COMMIT;
