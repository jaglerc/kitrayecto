import type { PoolClient } from "pg";
import { pool } from "../../database/database.js";
import type { CreateInspectionAnswer, CreateInspectionEvidence, CreatedInspection, InspectionOperation, InspectionStatus } from "./inspections.types.js";

interface VehicleRecord { id: number; tipo_vehiculo: string; }
interface TemplateRecord { id: number; titulo: string; }
interface InspectionRecord { id: number; estado: InspectionStatus; created_at: Date; }

export class InspectionsRepository {
    static async findVehicle(vehicleId: number): Promise<VehicleRecord | null> {
        const result = await pool.query<VehicleRecord>(
            `SELECT id, tipo_vehiculo::text AS tipo_vehiculo FROM vehiculo WHERE id = $1`,
            [vehicleId]
        );
        return result.rows[0] ?? null;
    }

    static async findTemplates(vehicleType: string): Promise<TemplateRecord[]> {
        const result = await pool.query<TemplateRecord>(
            `SELECT id, titulo FROM plantillas_check WHERE tipo_vehiculo::text = $1 ORDER BY id`,
            [vehicleType]
        );
        return result.rows;
    }

    static async create(
        conductorId: number,
        vehicleId: number,
        operation: InspectionOperation,
        status: InspectionStatus,
        answers: CreateInspectionAnswer[],
        templatesById: Map<number, TemplateRecord>
    ): Promise<CreatedInspection> {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            const result = await client.query<InspectionRecord>(
                `INSERT INTO inspecciones_vehiculares
                    (vehiculo_id, conductor_id, tipo_operacion, estado)
                 VALUES ($1, $2, $3, $4)
                 RETURNING id, estado, created_at`,
                [vehicleId, conductorId, operation, status]
            );
            const inspection = result.rows[0];
            if (!inspection) {
                throw new Error("La base de datos no devolvió la inspección creada");
            }

            for (const answer of answers) {
                const answerId = await this.insertAnswer(
                    client,
                    inspection.id,
                    templatesById.get(answer.templateId)!.titulo,
                    answer
                );

                for (const evidence of answer.evidences) {
                    await this.insertEvidence(client, answerId, evidence);
                }
            }

            await client.query("COMMIT");
            return {
                id: inspection.id,
                status: inspection.estado,
                createdAt: inspection.created_at.toISOString(),
            };
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    private static async insertAnswer(
        client: PoolClient,
        inspectionId: number,
        title: string,
        answer: CreateInspectionAnswer
    ): Promise<number> {
        const result = await client.query<{ id: number }>(
            `INSERT INTO respuesta_inspecciones
                (inspeccion_id, titulo, estado, observacion)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
            [inspectionId, title, answer.status, answer.observation || null]
        );

        const insertedAnswer = result.rows[0];
        if (!insertedAnswer) {
            throw new Error("La base de datos no devolvió la respuesta creada");
        }

        return insertedAnswer.id;
    }

    private static async insertEvidence(
        client: PoolClient,
        answerId: number,
        evidence: CreateInspectionEvidence
    ): Promise<void> {
        await client.query(
            `INSERT INTO evidencias_inspecciones
                (respuesta_inspeccion_id, object_key, mime_type, size_bytes)
             VALUES ($1, $2, $3, $4)`,
            [answerId, evidence.objectKey, evidence.contentType, evidence.size]
        );
    }
}
