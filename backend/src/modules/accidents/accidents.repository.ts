import type { PoolClient } from "pg";
import { pool } from "../../database/database.js";
import type { AccidentDetail, AccidentEvidenceInput, CompleteAccidentInput, PendingAccident } from "./accidents.types.js";

interface AccidentRecord {
    id: number;
    created_at: Date;
    vehiculo_id: number;
    tipo_vehiculo: string;
    placa: string;
    conductor_nombre?: string;
    conductor_cedula?: string;
    conductor_telefono?: string | null;
    conductor_eps?: string | null;
}

const toPending = (row: AccidentRecord): PendingAccident => ({
    id: row.id,
    reportedAt: row.created_at.toISOString(),
    vehicle: { id: row.vehiculo_id, type: row.tipo_vehiculo.toLowerCase(), plate: row.placa },
});

export class AccidentsRepository {
    static async findPendingByTrip(tripId: number): Promise<PendingAccident | null> {
        const result = await pool.query<AccidentRecord>(
            `SELECT a.id, a.created_at, t.vehiculo_id, v.tipo_vehiculo::text AS tipo_vehiculo, v.placa
             FROM accidentes_trayectos a
             JOIN trayectos t ON t.id = a.trayecto_id
             JOIN vehiculo v ON v.id = t.vehiculo_id
             WHERE a.trayecto_id = $1 AND a.formulario_completado = FALSE
             ORDER BY a.created_at DESC LIMIT 1`,
            [tripId]
        );
        const row = result.rows[0];
        return row ? toPending(row) : null;
    }

    static async createPending(tripId: number): Promise<PendingAccident> {
        const result = await pool.query<AccidentRecord>(
            `WITH created AS (
                INSERT INTO accidentes_trayectos (trayecto_id, formulario_completado)
                VALUES ($1, FALSE)
                RETURNING id, trayecto_id, created_at
             )
             SELECT c.id, c.created_at, t.vehiculo_id, v.tipo_vehiculo::text AS tipo_vehiculo, v.placa
             FROM created c
             JOIN trayectos t ON t.id = c.trayecto_id
             JOIN vehiculo v ON v.id = t.vehiculo_id`,
            [tripId]
        );
        const row = result.rows[0];
        if (!row) throw new Error("ACCIDENT_NOT_CREATED");
        return toPending(row);
    }

    static async findPending(conductorId: number): Promise<PendingAccident[]> {
        const result = await pool.query<AccidentRecord>(
            `SELECT a.id, a.created_at, t.vehiculo_id, v.tipo_vehiculo::text AS tipo_vehiculo, v.placa
             FROM accidentes_trayectos a
             JOIN trayectos t ON t.id = a.trayecto_id
             JOIN vehiculo v ON v.id = t.vehiculo_id
             WHERE t.conductor_id = $1 AND a.formulario_completado = FALSE
             ORDER BY a.created_at DESC`,
            [conductorId]
        );
        return result.rows.map(toPending);
    }

    static async findById(conductorId: number, accidentId: number): Promise<AccidentDetail | null> {
        const result = await pool.query<AccidentRecord>(
            `SELECT a.id, a.created_at, t.vehiculo_id, v.tipo_vehiculo::text AS tipo_vehiculo,
                    v.placa, u.nombre AS conductor_nombre, u.cedula AS conductor_cedula,
                    u.telefono AS conductor_telefono, u.eps AS conductor_eps
             FROM accidentes_trayectos a
             JOIN trayectos t ON t.id = a.trayecto_id
             JOIN vehiculo v ON v.id = t.vehiculo_id
             JOIN usuario u ON u.id = t.conductor_id
             WHERE a.id = $1 AND t.conductor_id = $2 AND a.formulario_completado = FALSE`,
            [accidentId, conductorId]
        );
        const row = result.rows[0];
        return row ? {
            ...toPending(row),
            driverName: row.conductor_nombre ?? "Conductor",
            driverDocument: row.conductor_cedula ?? "",
            driverPhone: row.conductor_telefono ?? null,
            driverEps: row.conductor_eps ?? null,
        } : null;
    }

    static async complete(conductorId: number, accidentId: number, input: CompleteAccidentInput): Promise<void> {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            const updated = await client.query(
                `UPDATE accidentes_trayectos a
                 SET hora_accidente = $1, ubicacion_referencia = $2, descripcion = $3,
                     sufrio_daños = $4, vehiculo_sufrio_daños = $5, hay_terceros = $6,
                     formulario_completado = TRUE
                 FROM trayectos t
                 WHERE a.id = $7 AND a.trayecto_id = t.id AND t.conductor_id = $8
                   AND a.formulario_completado = FALSE
                 RETURNING a.id`,
                [input.accidentTime, input.location.trim(), input.description.trim(), input.driverInjured,
                    input.vehicleDamaged, input.thirdPartiesInvolved, accidentId, conductorId]
            );
            if (!updated.rowCount) throw new Error("PENDING_ACCIDENT_NOT_FOUND");
            for (const evidence of input.evidences) await this.insertEvidence(client, accidentId, evidence);
            await client.query("COMMIT");
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    private static async insertEvidence(client: PoolClient, accidentId: number, evidence: AccidentEvidenceInput): Promise<void> {
        const fileName = evidence.objectKey.split("/").at(-1);
        if (!fileName) throw new Error("INVALID_ACCIDENT_EVIDENCE_NAME");
        await client.query(
            `INSERT INTO evidencias_accidente (accidente_id, s3_ruta, nombre_archivo) VALUES ($1, $2, $3)`,
            [accidentId, evidence.objectKey, fileName]
        );
    }
}
