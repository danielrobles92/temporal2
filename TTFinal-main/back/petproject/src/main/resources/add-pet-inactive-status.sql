-- Estado INACTIVE para publicaciones de adopcion desactivadas por su responsable (CU-14).
-- Una publicacion inactiva no se muestra en Adopcion ni se usa como candidata en coincidencias.
ALTER TYPE status ADD VALUE IF NOT EXISTS 'INACTIVE';
