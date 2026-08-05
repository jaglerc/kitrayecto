import type { PoolClient } from "pg";
import { pool } from "../../database/database.js";
import type { CreateInspectionAnswer, CreateInspectionEvidence, CreatedInspection, InspectionOperation, InspectionStatus, TodayInspection, TodayInspectionAnswer } from "./inspections.types.js";

interface VehicleRecord { id: number; tipo_vehiculo: string; }
interface TemplateRecord { id: number; titulo: string; }
interface InspectionRecord { id: number; estado: InspectionStatus; kilometraje: number; created_at: Date; }
interface TodayInspectionRecord {
    id: number;
    kilometraje: number | null;
    created_at: Date;
    vehiculo_id: number;
    tipo_vehiculo: string;
    placa: string;
    respuestas: TodayInspectionAnswer[];
}

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

    static async findTodayByConductor(
        conductorId: number
    ): Promise<TodayInspection | null> {
        const result = await pool.query<TodayInspectionRecord>(
            `SELECT
                i.id,
                i.kilometraje,
                i.created_at,
                v.id AS vehiculo_id,
                v.tipo_vehiculo::text AS tipo_vehiculo,
                v.placa,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', r.id,
                            'title', r.titulo,
                            'status', r.estado,
                            'observation', r.observacion
                        ) ORDER BY r.id
                    ) FILTER (WHERE r.id IS NOT NULL),
                    '[]'::json
                ) AS respuestas
             FROM inspecciones_vehiculares i
             JOIN vehiculo v ON v.id = i.vehiculo_id
             LEFT JOIN respuesta_inspecciones r ON r.inspeccion_id = i.id
             WHERE i.conductor_id = $1
               AND i.tipo_operacion::text = 'Check_in'
               AND i.created_at::date = (CURRENT_TIMESTAMP AT TIME ZONE 'America/Bogota')::date
             GROUP BY i.id, v.id, v.tipo_vehiculo, v.placa
             ORDER BY i.created_at DESC
             LIMIT 1`,
            [conductorId]
        );

        const inspection = result.rows[0];
        if (!inspection) return null;

        return {
            id: inspection.id,
            mileage: inspection.kilometraje,
            createdAt: inspection.created_at.toISOString(),
            vehicle: {
                id: inspection.vehiculo_id,
                type: inspection.tipo_vehiculo.toLowerCase(),
                plate: inspection.placa,
            },
            answers: inspection.respuestas,
        };
    }

    static async create(
        conductorId: number,
        vehicleId: number,
        operation: InspectionOperation,
        status: InspectionStatus,
        mileage: number,
        answers: CreateInspectionAnswer[],
        templatesById: Map<number, TemplateRecord>
    ): Promise<CreatedInspection> {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            const result = await client.query<InspectionRecord>(
                `INSERT INTO inspecciones_vehiculares
                    (vehiculo_id, conductor_id, tipo_operacion, estado, kilometraje)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING id, estado, kilometraje, created_at`,
                [vehicleId, conductorId, operation, status, mileage]
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
                mileage: inspection.kilometraje,
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
        const fileName = evidence.objectKey.split("/").at(-1);
        if (!fileName) {
            throw new Error("La evidencia no contiene un nombre de archivo válido");
        }

        await client.query(
            `INSERT INTO evidencia_respuestas
                (respuesta_id, s3_ruta, nombre_archivo)
             VALUES ($1, $2, $3)`,
            [answerId, evidence.objectKey, fileName]
        );
    }
}
