import { pool } from "../../database/database.js";
import type { ExpiringDocument, SupervisorDashboard } from "./supervisor-dashboard.types.js";

interface CountRow { total: number; }
interface DocumentRow { id: string; document_type: string; plate: string; expires_at: Date | string; days_remaining: number; }

export class SupervisorDashboardRepository {
    static async find(): Promise<SupervisorDashboard> {
        const [users, vehicles, alerts, documents] = await Promise.all([
            pool.query<CountRow>(`SELECT COUNT(*)::integer AS total FROM usuario`),
            pool.query<CountRow>(`SELECT COUNT(*)::integer AS total FROM vehiculo`),
            pool.query<CountRow>(`SELECT COUNT(*)::integer AS total FROM accidentes_trayectos WHERE formulario_completado = FALSE`),
            pool.query<DocumentRow>(
                `SELECT * FROM (
                    SELECT 'seguro-' || s.id AS id, 'Seguro obligatorio' AS document_type,
                           v.placa AS plate, s.fecha_expiracion_poliza AS expires_at,
                           (s.fecha_expiracion_poliza::date - CURRENT_DATE)::integer AS days_remaining
                    FROM vehiculo v
                    JOIN LATERAL (
                        SELECT * FROM seguros_vehiculos
                        WHERE carro_id = v.id
                        ORDER BY fecha_expiracion_poliza DESC NULLS LAST, id DESC LIMIT 1
                    ) s ON TRUE
                    WHERE s.fecha_expiracion_poliza::date BETWEEN CURRENT_DATE AND CURRENT_DATE + 30
                    UNION ALL
                    SELECT 'tecnomecanica-' || r.id AS id, 'Revisión técnico-mecánica' AS document_type,
                           v.placa AS plate, r.fecha_expiracion_tecnomecanica AS expires_at,
                           (r.fecha_expiracion_tecnomecanica::date - CURRENT_DATE)::integer AS days_remaining
                    FROM vehiculo v
                    JOIN LATERAL (
                        SELECT * FROM revisiones_tecnicomecanicas
                        WHERE carro_id = v.id
                        ORDER BY fecha_expiracion_tecnomecanica DESC NULLS LAST, id DESC LIMIT 1
                    ) r ON TRUE
                    WHERE r.fecha_expiracion_tecnomecanica::date BETWEEN CURRENT_DATE AND CURRENT_DATE + 30
                 ) expiring ORDER BY expires_at ASC LIMIT 8`
            ),
        ]);
        const mappedDocuments: ExpiringDocument[] = documents.rows.map((row) => ({
            id: row.id,
            documentType: row.document_type,
            plate: row.plate,
            expiresAt: row.expires_at instanceof Date
                ? row.expires_at.toISOString()
                : new Date(`${row.expires_at}T00:00:00`).toISOString(),
            daysRemaining: row.days_remaining,
        }));
        return { activeUsers: users.rows[0]?.total ?? 0, registeredVehicles: vehicles.rows[0]?.total ?? 0, expiringDocuments: mappedDocuments.length, pendingAlerts: alerts.rows[0]?.total ?? 0, documents: mappedDocuments };
    }
}
