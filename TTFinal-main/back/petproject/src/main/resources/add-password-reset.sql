-- Codigos para "Olvidaste tu contrasena" (CU-43). Solo se guarda el hash del codigo.
CREATE TABLE IF NOT EXISTS password_reset_codes (
    reset_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    code_hash VARCHAR(100) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_user ON password_reset_codes(user_id);
