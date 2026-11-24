/**
 * URL base de la API.
 *  - Desarrollo (npm start): backend local http://localhost:8080.
 *  - Version publicada (publicar-perreque.bat): se compila con REACT_APP_API_URL=same-origin y la API se
 *    llama en el mismo dominio de la pagina; deploy/gateway.js reenvia /auth, /pets, /reports... al backend.
 */
const raw = process.env.REACT_APP_API_URL;
export const API_BASE_URL = raw === undefined ? 'http://localhost:8080' : raw === 'same-origin' ? '' : raw;
