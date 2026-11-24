-- Seguridad en los chats de los casos: reportes al administrador y bloqueos.
-- Idempotente y aditiva. Ejecutar conectado a la base pet_adoption.

-- 1) Bloquear un chat: nadie puede escribir en ese caso hasta que quien lo bloqueo
--    (o un administrador) lo desbloquee.
ALTER TABLE cases ADD COLUMN IF NOT EXISTS blocked_by INTEGER REFERENCES users(user_id) ON DELETE SET NULL;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMP;

-- 2) Bloquear a un usuario: ninguno de los dos puede escribirle al otro en ningun caso,
--    ni mandarle solicitudes de adopcion o avisos de perro perdido. Se consulta en el perfil.
CREATE TABLE IF NOT EXISTS user_blocks (
    block_id SERIAL PRIMARY KEY,
    blocker_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    blocked_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    -- Caso desde el que se bloqueo (solo informativo).
    case_id INTEGER REFERENCES cases(case_id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ux_user_blocks UNIQUE (blocker_id, blocked_id),
    CONSTRAINT ck_user_blocks_self CHECK (blocker_id <> blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON user_blocks(blocked_id);

-- 3) Reportes de mal uso en un chat (malas palabras, piden dinero, perro inexistente...).
--    "evidence" guarda una copia de los mensajes de la persona reportada al momento del
--    reporte, para que el administrador los vea aunque despues se borre el caso.
CREATE TABLE IF NOT EXISTS chat_reports (
    chat_report_id SERIAL PRIMARY KEY,
    case_id INTEGER REFERENCES cases(case_id) ON DELETE SET NULL,
    message_id INTEGER REFERENCES case_messages(message_id) ON DELETE SET NULL,
    reporter_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    reported_user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    case_title VARCHAR(180),
    reason VARCHAR(30) NOT NULL,
    details VARCHAR(1000),
    evidence TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    admin_notes VARCHAR(1000),
    reviewed_by INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_reports_status ON chat_reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_reports_reported ON chat_reports(reported_user_id);
