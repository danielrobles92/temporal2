#!/bin/bash
# Instala y arranca PERREQUE en el servidor (Ubuntu). Se puede correr las veces que haga falta:
# la primera vez instala Docker, abre los puertos y crea las claves; las siguientes solo
# reconstruye y reinicia con el codigo nuevo. Uso: bash instalar.sh [dominio]
set -euo pipefail
cd "$(dirname "$0")"

# 1. Puertos 80 y 443 (las imagenes de Ubuntu de Oracle traen un firewall que solo deja el 22).
#    Va antes de instalar Docker para no guardar sus reglas junto con estas.
if command -v iptables >/dev/null 2>&1 && ! sudo iptables -C INPUT -p tcp --dport 80 -j ACCEPT 2>/dev/null; then
  echo "== Abriendo los puertos 80 y 443..."
  sudo iptables -I INPUT 1 -p tcp --dport 80 -j ACCEPT
  sudo iptables -I INPUT 1 -p tcp --dport 443 -j ACCEPT
  sudo iptables -I INPUT 1 -p udp --dport 443 -j ACCEPT
  if command -v netfilter-persistent >/dev/null 2>&1; then sudo netfilter-persistent save; fi
fi

# 1b. Memoria de respaldo (swap): con 4 GB de RAM el servicio de IA y la compilacion se quedan cortos
if [ ! -f /swapfile ] && [ "$(awk '/MemTotal/ {print $2}' /proc/meminfo)" -lt 7000000 ]; then
  echo "== Creando 4 GB de memoria de respaldo (swap)..."
  sudo fallocate -l 4G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile >/dev/null
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
fi

# 2. Docker
if ! command -v docker >/dev/null 2>&1; then
  echo "== Instalando Docker..."
  curl -fsSL https://get.docker.com | sudo sh
  sudo usermod -aG docker "$USER"
fi

# 3. Claves y dominio (solo la primera vez; quedan en .env, que no se sube a GitHub)
if [ ! -f .env ]; then
  IP=$(curl -fsS https://api.ipify.org)
  DOMINIO="${1:-$(echo "$IP" | tr . -).sslip.io}"
  cat > .env <<EOF
DOMINIO=$DOMINIO
DB_PASSWORD=$(openssl rand -hex 24)
JWT_SECRET=$(openssl rand -hex 48)
DATOS_DIR=$HOME/perreque-datos
# Correo para "Olvidaste tu contrasena" (opcional). Sin esto, el codigo sale en el log del backend.
MAIL_USERNAME=
MAIL_PASSWORD=
EOF
  echo "== Claves nuevas en $(pwd)/.env"
fi
DATOS_DIR=$(grep '^DATOS_DIR=' .env | cut -d= -f2-)
mkdir -p "$DATOS_DIR/uploads" "$DATOS_DIR/inicial"

# 4. Construir y arrancar (la primera vez tarda de 10 a 20 minutos)
#    Se construye una imagen a la vez para no agotar la memoria.
echo "== Construyendo PERREQUE..."
for s in db ml backend web; do
  echo "-- $s"
  sudo docker compose build "$s"
done
echo "== Arrancando..."
sudo docker compose up -d
sudo docker image prune -f >/dev/null

echo
echo "Listo. PERREQUE queda en: https://$(grep '^DOMINIO=' .env | cut -d= -f2-)"
echo "El servicio de IA tarda 1 o 2 minutos mas en cargar los modelos."
