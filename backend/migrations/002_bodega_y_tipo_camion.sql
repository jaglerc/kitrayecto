BEGIN;

ALTER TYPE tipo_vehiculo ADD VALUE IF NOT EXISTS 'Camión';

LOCK TABLE ubicaciones IN SHARE ROW EXCLUSIVE MODE;

UPDATE ubicaciones
SET activo = TRUE
WHERE lower(btrim(nombre)) = 'bodega' AND activo IS DISTINCT FROM TRUE;

INSERT INTO ubicaciones (nombre, activo)
SELECT 'Bodega', TRUE
WHERE NOT EXISTS (SELECT 1 FROM ubicaciones WHERE lower(btrim(nombre)) = 'bodega');

COMMIT;
