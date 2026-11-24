-- Punto del mapa donde se vio al perro en un aviso (el mismo selector que al crear un reporte).
-- La columna location sigue guardando la direccion en texto.
-- Idempotente y aditiva. Ejecutar conectado a la base pet_adoption.
ALTER TABLE report_sightings ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE report_sightings ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
