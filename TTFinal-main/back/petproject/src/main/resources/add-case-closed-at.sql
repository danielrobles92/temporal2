-- Fecha en que un caso termino (adoptado, cancelado, resuelto o cerrado).
-- Se usa para mostrar cuando finalizo cada solicitud de adopcion y cada caso.
ALTER TABLE cases ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP;

-- Casos que ya estaban cerrados: se toma su ultima actualizacion como fecha de cierre.
UPDATE cases
   SET closed_at = updated_at
 WHERE closed_at IS NULL
   AND status IN ('ADOPTED', 'CANCELLED', 'RESOLVED', 'CLOSED');
