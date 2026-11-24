CREATE TABLE IF NOT EXISTS seguimiento_novedades (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tipo text NOT NULL CHECK (tipo IN ('trayecto', 'accidente', 'inspeccion')),
    registro_id integer NOT NULL,
    estado text NOT NULL CHECK (estado IN ('Reportado', 'En revisión', 'En seguimiento', 'Cerrado')),
    nota text NOT NULL,
    autor_id integer NOT NULL REFERENCES usuario(id),
    responsable_id integer REFERENCES usuario(id),
    creado_en timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS seguimiento_novedades_caso_idx
    ON seguimiento_novedades (tipo, registro_id, id DESC);

CREATE OR REPLACE VIEW casos_supervisor AS
SELECT 'trayecto'::text AS categoria, n.id, t.id AS viaje_id, t.vehiculo_id, t.conductor_id,
       n.tipo_novedad::text AS tipo, n.descripcion, n.fecha_registro AS fecha,
       NULL::boolean AS formulario_completado, NULL::text AS ubicacion, NULL::text AS hora,
       NULL::boolean AS conductor_lesionado, NULL::boolean AS danos_vehiculo, NULL::boolean AS terceros
FROM novedades_trayectos n JOIN trayectos t ON t.id = n.viaje_id
UNION ALL
SELECT 'accidente', a.id, t.id, t.vehiculo_id, t.conductor_id,
       'Accidente', a.descripcion, a.created_at, a.formulario_completado, a.ubicacion_referencia, a.hora_accidente::text,
       a.sufrio_daños, a.vehiculo_sufrio_daños, a.hay_terceros
FROM accidentes_trayectos a JOIN trayectos t ON t.id = a.trayecto_id
UNION ALL
SELECT 'inspeccion', r.id, NULL, i.vehiculo_id, i.conductor_id,
       concat('Inspección · ', r.estado::text), concat_ws(' · ', r.titulo, NULLIF(r.observacion, '')), i.created_at, NULL,
       NULL, NULL, NULL, NULL, NULL
FROM respuesta_inspecciones r JOIN inspecciones_vehiculares i ON i.id = r.inspeccion_id
WHERE r.estado::text IN ('Con novedad', 'Crítica');

CREATE OR REPLACE VIEW evidencias_casos_supervisor AS
SELECT 'trayecto'::text AS categoria, novedades_id AS registro_id, id, nombre_archivo, s3_ruta FROM evidencias_novedades
UNION ALL
SELECT 'accidente', accidente_id, id, nombre_archivo, s3_ruta FROM evidencias_accidente
UNION ALL
SELECT 'inspeccion', respuesta_id, id, nombre_archivo, s3_ruta FROM evidencia_respuestas;
