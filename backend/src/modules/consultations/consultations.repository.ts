import { pool } from "../../database/database.js";
import type {
    ConsultationCategory,
    ConsultationDetail,
    ConsultationListItem,
} from "./consultations.types.js";

type SupportedCategory = Exclude<ConsultationCategory, "maintenance">;

interface ListRow {
    id: number;
    occurred_at: Date;
    title: string;
    subtitle: string;
    status: string;
    vehicle_type: string;
    plate: string;
}

interface DetailRow extends ListRow {
    fields: Array<{ label: string; value: string }>;
    evidences: Array<{ fileName: string; objectKey: string }>;
}

const listItem = (
    category: ConsultationCategory,
    row: ListRow
): ConsultationListItem => ({
    id: row.id,
    category,
    occurredAt: row.occurred_at.toISOString(),
    title: row.title,
    subtitle: row.subtitle,
    status: row.status,
    vehicleType: row.vehicle_type.toLowerCase(),
    plate: row.plate,
});

const tripsListQuery = `
    SELECT
        t.id,
        t.fecha_inicio AS occurred_at,
        'Viaje' AS title,
        CONCAT_WS(
            ' · ',
            COALESCE(cargo.summary, 'Sin carga registrada'),
            COALESCE(origen.nombre, 'Origen anterior sin ubicación') || ' → ' ||
                COALESCE(ruta.locations, 'Sin paradas')
        ) AS subtitle,
        t.estado::text AS status,
        v.tipo_vehiculo::text AS vehicle_type,
        v.placa AS plate
    FROM trayectos t
    JOIN vehiculo v ON v.id = t.vehiculo_id
    LEFT JOIN ubicaciones origen ON origen.id = t.origen_id
    LEFT JOIN LATERAL (
        SELECT STRING_AGG(
            d.descripcion_producto || ': ' || d.cantidad || ' ' || d.unidad_medida,
            ' · '
        ) AS summary
        FROM detalle_carga_trayecto d
        WHERE d.trayecto_id = t.id
    ) cargo ON TRUE
    LEFT JOIN LATERAL (
        SELECT STRING_AGG(u.nombre, ' → ' ORDER BY p.orden) AS locations
        FROM paradas_trayecto p
        JOIN ubicaciones u ON u.id = p.ubicacion_id
        WHERE p.trayecto_id = t.id
    ) ruta ON TRUE
    WHERE t.conductor_id = $1
    ORDER BY t.fecha_inicio DESC
`;

const fuelListQuery = `
    SELECT
        r.id,
        r.created_at AS occurred_at,
        r.tipo_combustible::text AS title,
        r.cantidad_tanqueada || ' Galones · $' || r.valor_pagado AS subtitle,
        'Registrado' AS status,
        v.tipo_vehiculo::text AS vehicle_type,
        v.placa AS plate
    FROM registro_combustible r
    JOIN vehiculo v ON v.id = r.vehiculo_id
    WHERE r.conductor_id = $1
    ORDER BY r.created_at DESC
`;

const inspectionsListQuery = `
    SELECT
        i.id,
        i.created_at AS occurred_at,
        CASE
            WHEN i.tipo_operacion::text = 'Check_in' THEN 'Checklist de entrada'
            ELSE 'Checklist de salida'
        END AS title,
        'Kilometraje: ' || i.kilometraje || ' km' AS subtitle,
        i.estado::text AS status,
        v.tipo_vehiculo::text AS vehicle_type,
        v.placa AS plate
    FROM inspecciones_vehiculares i
    JOIN vehiculo v ON v.id = i.vehiculo_id
    WHERE i.conductor_id = $1
    ORDER BY i.created_at DESC
`;

const incidentsListQuery = `
    SELECT
        n.id,
        n.fecha_registro AS occurred_at,
        'Novedad de trayecto' AS title,
        n.descripcion AS subtitle,
        n.tipo_novedad::text AS status,
        v.tipo_vehiculo::text AS vehicle_type,
        v.placa AS plate
    FROM novedades_trayectos n
    JOIN trayectos t ON t.id = n.viaje_id
    JOIN vehiculo v ON v.id = t.vehiculo_id
    WHERE t.conductor_id = $1
    ORDER BY n.fecha_registro DESC
`;

const accidentsListQuery = `
    SELECT
        a.id,
        a.created_at AS occurred_at,
        'Accidente reportado' AS title,
        a.descripcion AS subtitle,
        'Completado' AS status,
        v.tipo_vehiculo::text AS vehicle_type,
        v.placa AS plate
    FROM accidentes_trayectos a
    JOIN trayectos t ON t.id = a.trayecto_id
    JOIN vehiculo v ON v.id = t.vehiculo_id
    WHERE t.conductor_id = $1
      AND a.formulario_completado = TRUE
    ORDER BY a.created_at DESC
`;

const tripDetailQuery = `
    SELECT
        t.id,
        t.fecha_inicio AS occurred_at,
        'Viaje' AS title,
        COALESCE(t.observaciones, 'Sin observaciones') AS subtitle,
        t.estado::text AS status,
        v.tipo_vehiculo::text AS vehicle_type,
        v.placa AS plate,
        json_build_array(
            json_build_object(
                'label', 'Fecha de inicio',
                'value', to_char(t.fecha_inicio, 'DD/MM/YYYY HH24:MI')
            ),
            json_build_object(
                'label', 'Fecha de finalización',
                'value', COALESCE(to_char(t.fecha_fin, 'DD/MM/YYYY HH24:MI'), 'En curso')
            ),
            json_build_object(
                'label', 'Origen',
                'value', COALESCE(origen.nombre, 'Sin dato')
            ),
            json_build_object(
                'label', 'Paradas',
                'value', COALESCE(ruta.locations, 'Sin paradas')
            ),
            json_build_object(
                'label', 'Carga inicial',
                'value', COALESCE(cargo.summary, 'Sin carga')
            ),
            json_build_object(
                'label', 'Movimientos en paradas',
                'value', COALESCE(movimientos.summary, 'Sin movimientos')
            )
        ) AS fields,
        '[]'::json AS evidences
    FROM trayectos t
    JOIN vehiculo v ON v.id = t.vehiculo_id
    LEFT JOIN ubicaciones origen ON origen.id = t.origen_id
    LEFT JOIN LATERAL (
        SELECT STRING_AGG(
            p.orden || '. ' || u.nombre,
            ' → ' ORDER BY p.orden
        ) AS locations
        FROM paradas_trayecto p
        JOIN ubicaciones u ON u.id = p.ubicacion_id
        WHERE p.trayecto_id = t.id
    ) ruta ON TRUE
    LEFT JOIN LATERAL (
        SELECT STRING_AGG(
            d.descripcion_producto || ': ' || d.cantidad || ' ' || d.unidad_medida,
            ' · '
        ) AS summary
        FROM detalle_carga_trayecto d
        WHERE d.trayecto_id = t.id
    ) cargo ON TRUE
    LEFT JOIN LATERAL (
        SELECT STRING_AGG(
            u.nombre || ': ' || m.tipo || ' ' || m.cantidad || ' ' ||
                m.unidad_medida || ' de ' || m.descripcion_producto,
            ' · ' ORDER BY p.orden, m.id
        ) AS summary
        FROM movimientos_carga_trayecto m
        JOIN paradas_trayecto p ON p.id = m.parada_id
        JOIN ubicaciones u ON u.id = p.ubicacion_id
        WHERE p.trayecto_id = t.id
    ) movimientos ON TRUE
    WHERE t.id = $1
      AND t.conductor_id = $2
`;

const fuelDetailQuery = `
    SELECT
        r.id,
        r.created_at AS occurred_at,
        r.tipo_combustible::text AS title,
        COALESCE(r.observaciones, 'Sin observaciones') AS subtitle,
        'Registrado' AS status,
        v.tipo_vehiculo::text AS vehicle_type,
        v.placa AS plate,
        json_build_array(
            json_build_object(
                'label', 'Fecha y hora',
                'value', to_char(r.created_at, 'DD/MM/YYYY HH24:MI')
            ),
            json_build_object('label', 'Kilometraje', 'value', r.kilometraje_actual || ' km'),
            json_build_object('label', 'Cantidad', 'value', r.cantidad_tanqueada || ' Galones'),
            json_build_object('label', 'Valor pagado', 'value', '$' || r.valor_pagado),
            json_build_object('label', 'Estación', 'value', r.estacion_servicio),
            json_build_object('label', 'Combustible', 'value', r.tipo_combustible::text)
        ) AS fields,
        COALESCE(
            (
                SELECT json_agg(
                    json_build_object(
                        'fileName', d.nombre_archivo,
                        'objectKey', d.s3_ruta
                    )
                )
                FROM documentos_combustible d
                WHERE d.combustible_id = r.id
            ),
            '[]'::json
        ) AS evidences
    FROM registro_combustible r
    JOIN vehiculo v ON v.id = r.vehiculo_id
    WHERE r.id = $1
      AND r.conductor_id = $2
`;

const inspectionsDetailQuery = `
    SELECT
        i.id,
        i.created_at AS occurred_at,
        CASE
            WHEN i.tipo_operacion::text = 'Check_in' THEN 'Checklist de entrada'
            ELSE 'Checklist de salida'
        END AS title,
        'Inspección vehicular' AS subtitle,
        i.estado::text AS status,
        v.tipo_vehiculo::text AS vehicle_type,
        v.placa AS plate,
        json_build_array(
            json_build_object(
                'label', 'Fecha y hora',
                'value', to_char(i.created_at, 'DD/MM/YYYY HH24:MI')
            ),
            json_build_object('label', 'Operación', 'value', i.tipo_operacion::text),
            json_build_object('label', 'Kilometraje', 'value', i.kilometraje || ' km'),
            json_build_object('label', 'Resultado', 'value', i.estado::text)
        ) AS fields,
        '[]'::json AS evidences
    FROM inspecciones_vehiculares i
    JOIN vehiculo v ON v.id = i.vehiculo_id
    WHERE i.id = $1
      AND i.conductor_id = $2
`;

const incidentsDetailQuery = `
    SELECT
        n.id,
        n.fecha_registro AS occurred_at,
        'Novedad de trayecto' AS title,
        n.descripcion AS subtitle,
        n.tipo_novedad::text AS status,
        v.tipo_vehiculo::text AS vehicle_type,
        v.placa AS plate,
        json_build_array(
            json_build_object(
                'label', 'Fecha y hora',
                'value', to_char(n.fecha_registro, 'DD/MM/YYYY HH24:MI')
            ),
            json_build_object('label', 'Tipo', 'value', n.tipo_novedad::text),
            json_build_object('label', 'Descripción', 'value', n.descripcion)
        ) AS fields,
        COALESCE(
            (
                SELECT json_agg(
                    json_build_object(
                        'fileName', e.nombre_archivo,
                        'objectKey', e.s3_ruta
                    )
                )
                FROM evidencias_novedades e
                WHERE e.novedades_id = n.id
            ),
            '[]'::json
        ) AS evidences
    FROM novedades_trayectos n
    JOIN trayectos t ON t.id = n.viaje_id
    JOIN vehiculo v ON v.id = t.vehiculo_id
    WHERE n.id = $1
      AND t.conductor_id = $2
`;

const accidentsDetailQuery = `
    SELECT
        a.id,
        a.created_at AS occurred_at,
        'Accidente reportado' AS title,
        COALESCE(a.descripcion, 'Formulario pendiente') AS subtitle,
        CASE
            WHEN a.formulario_completado THEN 'Completado'
            ELSE 'Pendiente'
        END AS status,
        v.tipo_vehiculo::text AS vehicle_type,
        v.placa AS plate,
        json_build_array(
            json_build_object(
                'label', 'Fecha del reporte',
                'value', to_char(a.created_at, 'DD/MM/YYYY HH24:MI')
            ),
            json_build_object(
                'label', 'Hora del accidente',
                'value', COALESCE(a.hora_accidente::text, 'Pendiente')
            ),
            json_build_object(
                'label', 'Ubicación',
                'value', COALESCE(a.ubicacion_referencia, 'Pendiente')
            ),
            json_build_object(
                'label', 'Descripción',
                'value', COALESCE(a.descripcion, 'Pendiente')
            ),
            json_build_object(
                'label', 'Conductor lesionado',
                'value', CASE WHEN a.sufrio_daños THEN 'Sí' ELSE 'No' END
            ),
            json_build_object(
                'label', 'Vehículo con daños',
                'value', CASE WHEN a.vehiculo_sufrio_daños THEN 'Sí' ELSE 'No' END
            ),
            json_build_object(
                'label', 'Terceros involucrados',
                'value', CASE WHEN a.hay_terceros THEN 'Sí' ELSE 'No' END
            )
        ) AS fields,
        COALESCE(
            (
                SELECT json_agg(
                    json_build_object(
                        'fileName', e.nombre_archivo,
                        'objectKey', e.s3_ruta
                    )
                )
                FROM evidencias_accidente e
                WHERE e.accidente_id = a.id
            ),
            '[]'::json
        ) AS evidences
    FROM accidentes_trayectos a
    JOIN trayectos t ON t.id = a.trayecto_id
    JOIN vehiculo v ON v.id = t.vehiculo_id
    WHERE a.id = $1
      AND t.conductor_id = $2
`;

const listQueries: Record<SupportedCategory, string> = {
    trips: tripsListQuery,
    fuel: fuelListQuery,
    inspections: inspectionsListQuery,
    incidents: incidentsListQuery,
    accidents: accidentsListQuery,
};

const detailQueries: Record<SupportedCategory, string> = {
    trips: tripDetailQuery,
    fuel: fuelDetailQuery,
    inspections: inspectionsDetailQuery,
    incidents: incidentsDetailQuery,
    accidents: accidentsDetailQuery,
};

export class ConsultationsRepository {
    static async findAll(
        conductorId: number,
        category: ConsultationCategory
    ): Promise<ConsultationListItem[]> {
        if (category === "maintenance") return [];

        const result = await pool.query<ListRow>(listQueries[category], [conductorId]);
        return result.rows.map((row) => listItem(category, row));
    }

    static async findById(
        conductorId: number,
        category: ConsultationCategory,
        id: number
    ): Promise<ConsultationDetail | null> {
        if (category === "maintenance") return null;

        const result = await pool.query<DetailRow>(detailQueries[category], [id, conductorId]);
        const row = result.rows[0];

        if (!row) return null;

        return {
            ...listItem(category, row),
            fields: row.fields,
            evidences: row.evidences,
        };
    }
}
