-- Reportes con 1 a 4 fotos (antes solo la principal) y un embedding por foto.
ALTER TABLE lost_pets ADD COLUMN IF NOT EXISTS image_urls VARCHAR(4000);
UPDATE lost_pets SET image_urls = image_url
WHERE image_urls IS NULL AND image_url IS NOT NULL AND image_url <> '';

ALTER TABLE report_image_embeddings DROP CONSTRAINT IF EXISTS ux_report_image_embeddings_report;
ALTER TABLE report_image_embeddings ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);
UPDATE report_image_embeddings e SET image_url = r.image_url
FROM lost_pets r
WHERE e.report_id = r.report_id AND e.image_url IS NULL;
