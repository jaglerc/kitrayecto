CREATE TABLE IF NOT EXISTS evidencias_inspecciones (
    id SERIAL PRIMARY KEY,
    respuesta_inspeccion_id INTEGER NOT NULL
        REFERENCES respuesta_inspecciones(id)
        ON DELETE CASCADE,
    object_key VARCHAR(1024) NOT NULL UNIQUE,
    mime_type VARCHAR(100) NOT NULL,
    size_bytes INTEGER NOT NULL CHECK (size_bytes > 0),
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_evidencias_inspecciones_respuesta
    ON evidencias_inspecciones(respuesta_inspeccion_id);
