# PostgreSQL 18 (la misma version de la laptop) con PostGIS, que usa el esquema
# (columnas location_point). Sirve en x86 y ARM.
FROM postgres:18
RUN apt-get update \
 && apt-get install -y --no-install-recommends postgresql-18-postgis-3 \
 && rm -rf /var/lib/apt/lists/*
