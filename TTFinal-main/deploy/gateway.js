// Gateway de PERREQUE para publicar la plataforma con un solo dominio.
//  - Sirve la version compilada del frontend (front/build) con respaldo a index.html (rutas de React).
//  - Reenvia las rutas de la API (/auth, /pets, /reports, ...) y /uploads al backend Spring Boot.
// Solo usa modulos de Node (sin dependencias). Uso: node deploy/gateway.js   (puerto 8090)
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.GATEWAY_PORT || 8090);
const BACKEND = { host: '127.0.0.1', port: Number(process.env.BACKEND_PORT || 8080) };
const BUILD = path.resolve(__dirname, '..', 'front', 'build');
const API = /^\/(auth|users|pets|reports|adoption-requests|publication-authorizations|cases|notifications|images|uploads|blocks|chat-reports)(\/|$|\?)/;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webp': 'image/webp', '.txt': 'text/plain',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.map': 'application/json',
};

function proxy(req, res) {
  const headers = { ...req.headers, host: `${BACKEND.host}:${BACKEND.port}` };
  delete headers.origin;   // misma pagina: no hace falta CORS en el backend
  delete headers.referer;
  const up = http.request({ ...BACKEND, method: req.method, path: req.url, headers }, (r) => {
    res.writeHead(r.statusCode, r.headers);
    r.pipe(res);
  });
  up.on('error', () => {
    if (!res.headersSent) res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'El servidor de PERREQUE no responde. Intenta en unos minutos.' }));
  });
  req.pipe(up);
}

function serveStatic(req, res) {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  let file = path.normalize(path.join(BUILD, urlPath));
  if (!file.startsWith(BUILD)) { res.writeHead(400); return res.end(); }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(BUILD, 'index.html');
  const ext = path.extname(file).toLowerCase();
  const cache = file.includes(`${path.sep}static${path.sep}`) ? 'public, max-age=31536000, immutable' : 'no-cache';
  res.writeHead(200, { 'Content-Type': TYPES[ext] || 'application/octet-stream', 'Cache-Control': cache,
    'X-Content-Type-Options': 'nosniff' });
  fs.createReadStream(file).pipe(res);
}

http.createServer((req, res) => {
  if (API.test(req.url)) return proxy(req, res);
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
  return serveStatic(req, res);
}).listen(PORT, () => {
  console.log(`Gateway PERREQUE en http://localhost:${PORT}  (frontend: ${BUILD}, API -> ${BACKEND.host}:${BACKEND.port})`);
});
