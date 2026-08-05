import type { PoolClient } from "pg";
import { pool } from "../../database/database.js";
import type { CreateTripIncidentInput, CreatedTripIncident, TripIncidentEvidenceInput } from "./trip-incidents.types.js";

const databaseTypes = { Novedad: "Con novedad", Critica: "Crítica" } as const;

export class TripIncidentsRepository {
    static async create(tripId: number, input: CreateTripIncidentInput): Promise<CreatedTripIncident> {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            const result = await client.query<{ id: number; fecha_registro: Date }>(
                `INSERT INTO novedades_trayectos (viaje_id, tipo_novedad, descripcion, fecha_registro)
                 VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
                 RETURNING id, fecha_registro`,
                [tripId, databaseTypes[input.type], input.description.trim()]
            );
            const incident = result.rows[0];
            if (!incident) throw new Error("TRIP_INCIDENT_NOT_CREATED");

            for (const evidence of input.evidences) {
                await this.insertEvidence(client, incident.id, evidence);
            }
            await client.query("COMMIT");
            return { id: incident.id, tripId, type: input.type, registeredAt: incident.fecha_registro.toISOString() };
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    private static async insertEvidence(client: PoolClient, incidentId: number, evidence: TripIncidentEvidenceInput): Promise<void> {
        const fileName = evidence.objectKey.split("/").at(-1);
        if (!fileName) throw new Error("INVALID_INCIDENT_EVIDENCE_NAME");
        await client.query(
            `INSERT INTO evidencias_novedades (novedades_id, s3_ruta, nombre_archivo)
             VALUES ($1, $2, $3)`,
            [incidentId, evidence.objectKey, fileName]
        );
    }
}
