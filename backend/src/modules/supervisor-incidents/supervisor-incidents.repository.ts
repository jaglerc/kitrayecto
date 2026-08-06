import { pool } from "../../database/database.js";
import type { SupervisorIncident, SupervisorIncidentList } from "./supervisor-incidents.types.js";

interface IncidentRow {
    id: number;
    viaje_id: number;
    tipo_novedad: string;
    descripcion: string;
    fecha_registro: Date;
    conductor_id: number;
    conductor_nombre: string;
    vehiculo_id: number;
    tipo_vehiculo: string;
    placa: string;
    evidencias: Array<{ id: number; fileName: string; objectKey: string }> | null;
}

export class SupervisorIncidentsRepository {
    static async findMany(page: number, pageSize: number, search: string): Promise<SupervisorIncidentList> {
        const filter = search
            ? `WHERE n.descripcion ILIKE $1 OR v.placa ILIKE $1 OR
                     CONCAT_WS(' ', u.nombre, u.segundo_nombre, u.apellido) ILIKE $1`
            : "";
        const values: unknown[] = search ? [`%${search}%`] : [];
        const count = await pool.query<{ total: string }>(
            `SELECT COUNT(*)::text AS total
             FROM novedades_trayectos n
             JOIN trayectos t ON t.id = n.viaje_id
             JOIN usuario u ON u.id = t.conductor_id
             JOIN vehiculo v ON v.id = t.vehiculo_id
             ${filter}`,
            values
        );
        const offset = (page - 1) * pageSize;
        const limitPosition = values.length + 1;
        const offsetPosition = values.length + 2;
        const result = await pool.query<IncidentRow>(
            `SELECT n.id, n.viaje_id, n.tipo_novedad::text, n.descripcion,
                    n.fecha_registro, u.id AS conductor_id,
                    CONCAT_WS(' ', u.nombre, u.segundo_nombre, u.apellido) AS conductor_nombre,
                    v.id AS vehiculo_id, v.tipo_vehiculo::text, v.placa,
                    COALESCE(
                        json_agg(json_build_object(
                            'id', e.id,
                            'fileName', e.nombre_archivo,
                            'objectKey', e.s3_ruta
                        ) ORDER BY e.id) FILTER (WHERE e.id IS NOT NULL),
                        '[]'::json
                    ) AS evidencias
             FROM novedades_trayectos n
             JOIN trayectos t ON t.id = n.viaje_id
             JOIN usuario u ON u.id = t.conductor_id
             JOIN vehiculo v ON v.id = t.vehiculo_id
             LEFT JOIN evidencias_novedades e ON e.novedades_id = n.id
             ${filter}
             GROUP BY n.id, n.viaje_id, n.tipo_novedad, n.descripcion,
                      n.fecha_registro, u.id, u.nombre, u.segundo_nombre,
                      u.apellido, v.id, v.tipo_vehiculo, v.placa
             ORDER BY n.fecha_registro DESC, n.id DESC
             LIMIT $${limitPosition} OFFSET $${offsetPosition}`,
            [...values, pageSize, offset]
        );
        const items: SupervisorIncident[] = result.rows.map((row) => ({
            id: row.id,
            tripId: row.viaje_id,
            type: row.tipo_novedad,
            description: row.descripcion,
            registeredAt: row.fecha_registro.toISOString(),
            driver: { id: row.conductor_id, name: row.conductor_nombre },
            vehicle: { id: row.vehiculo_id, type: row.tipo_vehiculo, plate: row.placa },
            evidences: row.evidencias ?? [],
        }));
        return { items, total: Number(count.rows[0]?.total ?? 0), page, pageSize };
    }
}
