-- Tamano del perro en adopcion: pequeno, mediano o grande (claves de la red neuronal).
-- Los perros ya publicados se llenan con "Re-analizar fotos" del panel de administracion.
ALTER TABLE pets ADD COLUMN IF NOT EXISTS size VARCHAR(20);
