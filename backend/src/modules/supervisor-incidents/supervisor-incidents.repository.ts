import { pool } from "../../database/database.js";
import type { SupervisorIncident, SupervisorIncidentList } from "./supervisor-incidents.types.js";

export const caseCategories = ["trayecto", "accidente", "inspeccion"] as const;
export const caseStatuses = ["Reportado", "En revisión", "En seguimiento", "Cerrado"] as const;

export class SupervisorIncidentsRepository {
    static async findMany(page: number, pageSize: number, search: string, category: string, status: string): Promise<SupervisorIncidentList> {
        const result = await pool.query<{ total: number; items: SupervisorIncident[]; assignees: SupervisorIncidentList['assignees'] }>(`
            WITH matching AS (
                SELECT c.*, v.placa, v.tipo_vehiculo, concat_ws(' ', u.nombre, u.segundo_nombre, u.apellido) AS conductor,
                       latest.id AS revision, latest.responsable_id,
                       COALESCE(latest.estado, 'Reportado') AS estado
                FROM casos_supervisor c
                JOIN vehiculo v ON v.id = c.vehiculo_id
                JOIN usuario u ON u.id = c.conductor_id
                LEFT JOIN LATERAL (
                    SELECT id, estado, responsable_id FROM seguimiento_novedades
                    WHERE tipo = c.categoria AND registro_id = c.id ORDER BY id DESC LIMIT 1
                ) latest ON true
                WHERE ($1 = '' OR concat_ws(' ', v.placa, u.nombre, u.segundo_nombre, u.apellido, c.descripcion) ILIKE '%' || $1 || '%')
                  AND ($2 = '' OR c.categoria = $2)
                  AND ($3 = '' OR ($3 = 'abiertos' AND COALESCE(latest.estado, 'Reportado') <> 'Cerrado')
                               OR COALESCE(latest.estado, 'Reportado') = $3)
            ), paged AS (
                SELECT * FROM matching ORDER BY fecha DESC, categoria, id DESC LIMIT $4 OFFSET $5
            )
            SELECT (SELECT count(*)::int FROM matching) AS total,
                COALESCE((SELECT json_agg(json_build_object('id', id, 'name', concat_ws(' ', nombre, apellido)) ORDER BY nombre, apellido, id)
                          FROM usuario WHERE estado AND role::text IN ('Supervisor', 'Administrador')), '[]'::json) AS assignees,
                COALESCE(json_agg(json_build_object(
                'id', c.id, 'category', c.categoria, 'tripId', c.viaje_id, 'type', c.tipo,
                'description', COALESCE(c.descripcion, ''), 'registeredAt', c.fecha AT TIME ZONE 'UTC',
                'status', c.estado, 'revision', COALESCE(c.revision::text, '0'),
                'assigneeId', c.responsable_id, 'assignee', NULLIF(concat_ws(' ', assigned.nombre, assigned.apellido), ''),
                'formCompleted', c.formulario_completado,
                'accidentDetails', json_build_object('location', c.ubicacion, 'time', c.hora,
                    'driverInjured', c.conductor_lesionado, 'vehicleDamaged', c.danos_vehiculo, 'thirdParties', c.terceros),
                'driver', json_build_object('id', c.conductor_id, 'name', c.conductor),
                'vehicle', json_build_object('id', c.vehiculo_id, 'type', c.tipo_vehiculo, 'plate', c.placa),
                'evidences', COALESCE((SELECT json_agg(json_build_object(
                    'id', e.id, 'fileName', e.nombre_archivo, 'objectKey', e.s3_ruta) ORDER BY e.id)
                    FROM evidencias_casos_supervisor e WHERE e.categoria = c.categoria AND e.registro_id = c.id), '[]'::json),
                'history', COALESCE((SELECT json_agg(json_build_object('id', h.id::text, 'status', h.estado,
                    'note', h.nota, 'createdAt', h.creado_en, 'author', concat_ws(' ', a.nombre, a.apellido),
                    'assignee', NULLIF(concat_ws(' ', r.nombre, r.apellido), '')) ORDER BY h.id DESC)
                    FROM seguimiento_novedades h JOIN usuario a ON a.id = h.autor_id
                    LEFT JOIN usuario r ON r.id = h.responsable_id
                    WHERE h.tipo = c.categoria AND h.registro_id = c.id), '[]'::json)
            ) ORDER BY c.fecha DESC, c.categoria, c.id DESC), '[]'::json) AS items
            FROM paged c LEFT JOIN usuario assigned ON assigned.id = c.responsable_id
        `, [search, category, status, pageSize, (page - 1) * pageSize]);
        return { ...result.rows[0]!, page, pageSize };
    }

    static async record(category: string, id: number, actorId: number, status: string, note: string, revision: string, assigneeId: number | null) {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            await client.query("SELECT pg_advisory_xact_lock(hashtext($1), $2::int)", [category, id]);
            const current = await client.query<{ revision: string; responsable_id: number | null }>(`
                SELECT COALESCE(h.id::text, '0') AS revision, h.responsable_id
                FROM casos_supervisor c LEFT JOIN LATERAL (
                    SELECT id, responsable_id FROM seguimiento_novedades
                    WHERE tipo = c.categoria AND registro_id = c.id ORDER BY id DESC LIMIT 1
                ) h ON true WHERE c.categoria = $1 AND c.id = $2
            `, [category, id]);
            const row = current.rows[0];
            if (!row || row.revision !== revision) {
                await client.query("ROLLBACK");
                return row ? "conflict" : "missing";
            }
            if (assigneeId !== null && assigneeId !== row.responsable_id) {
                const assignee = await client.query("SELECT id FROM usuario WHERE id = $1 AND estado AND role::text IN ('Supervisor', 'Administrador') FOR SHARE", [assigneeId]);
                if (!assignee.rowCount) {
                    await client.query("ROLLBACK");
                    return "invalid-assignee";
                }
            }
            await client.query(`
                INSERT INTO seguimiento_novedades (tipo, registro_id, autor_id, estado, nota, responsable_id)
                VALUES ($1, $2, $3, $4, $5, $6)
            `, [category, id, actorId, status, note, assigneeId]);
            await client.query("COMMIT");
            return "saved";
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }
}
