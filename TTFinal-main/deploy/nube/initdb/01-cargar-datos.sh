#!/bin/bash
# Solo corre la primera vez que arranca la base de datos (volumen vacio).
#  - Si existe /datos/perreque.dump (copia de la base de la laptop), la carga completa.
#  - Si no, crea solo las tablas (esquema/esquema.sql) y la plataforma empieza vacia.
set -u
if [ -f /datos/perreque.dump ]; then
  echo "PERREQUE: cargando los datos de la laptop (perreque.dump)..."
  pg_restore --no-owner --no-privileges -U "$POSTGRES_USER" -d "$POSTGRES_DB" /datos/perreque.dump \
    || echo "PERREQUE: pg_restore termino con avisos (revisar arriba)."
else
  echo "PERREQUE: sin datos iniciales, se crean solo las tablas."
  psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
    -f /docker-entrypoint-initdb.d/esquema/esquema.sql
fi
