ALTER TABLE usuario
ADD COLUMN IF NOT EXISTS requiere_manipulacion_alimentos BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE documentos_usuarios
ADD COLUMN IF NOT EXISTS fecha_vigencia DATE,
ADD COLUMN IF NOT EXISTS fecha_vencimiento DATE;

CREATE UNIQUE INDEX IF NOT EXISTS usuario_cedula_unique
ON usuario (cedula);
