import type { PoolClient } from "pg";
import { pool } from "../../database/database.js";
import type { CreateFuelRecordInput, CreatedFuelRecord } from "./fuel.types.js";
import { VehicleMileageRepository } from "../vehicles/vehicle-mileage.repository.js";

export class FuelRepository {
    static async create(
        tripId: number,
        vehicleId: number,
        conductorId: number,
        input: CreateFuelRecordInput
    ): Promise<CreatedFuelRecord> {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            const result = await client.query<{ id: number; created_at: Date }>(
                `INSERT INTO registro_combustible
                    (trayecto_id, vehiculo_id, conductor_id, kilometraje_actual,
                     cantidad_tanqueada, unidad, valor_pagado, estacion_servicio,
                     tipo_combustible, observaciones)
                 VALUES ($1, $2, $3, $4, $5, 'Galones', $6, $7, $8, $9)
                 RETURNING id, created_at`,
                [tripId, vehicleId, conductorId, input.currentMileage, input.gallons,
                    input.amountPaid, input.serviceStation.trim(), input.fuelType,
                    input.observations?.trim() || null]
            );
            const fuelRecord = result.rows[0];
            if (!fuelRecord) throw new Error("FUEL_RECORD_NOT_CREATED");

            await VehicleMileageRepository.register(client, {
                vehicleId,
                mileage: input.currentMileage,
                origin: "Combustible",
                referenceId: fuelRecord.id,
                registeredBy: conductorId,
            });

            await this.insertEvidence(client, fuelRecord.id, input.evidence.objectKey);
            await client.query("COMMIT");
            return { id: fuelRecord.id, tripId, createdAt: fuelRecord.created_at.toISOString() };
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    private static async insertEvidence(client: PoolClient, fuelId: number, objectKey: string): Promise<void> {
        const fileName = objectKey.split("/").at(-1);
        if (!fileName) throw new Error("INVALID_FUEL_EVIDENCE_NAME");
        await client.query(
            `INSERT INTO documentos_combustible (combustible_id, s3_ruta, nombre_archivo)
             VALUES ($1, $2, $3)`,
            [fuelId, objectKey, fileName]
        );
    }
}
