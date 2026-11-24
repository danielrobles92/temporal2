# Pagina web (React) compilada y servida por Caddy, que tambien da el HTTPS y reenvia la API
# al backend (deploy/nube/Caddyfile).
# Node 24 (npm 11), la misma version con la que se genero package-lock.json en la laptop.
FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY public ./public
COPY src ./src
# La API se llama en el mismo dominio de la pagina (ver src/config.js).
ENV REACT_APP_API_URL=same-origin
RUN npm run build

FROM caddy:2
COPY --from=build /app/build /srv
