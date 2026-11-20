import type { PoolClient } from "pg";

import { pool } from "../../database/database.js";
import { VehicleMileageRepository } from "../vehicles/vehicle-mileage.repository.js";
import type {
    CreateMaintenanceInput,
    CreatedMaintenance,
    MaintenanceEvidenceInput,
} from "./maintenance.types.js";

export class MaintenanceRepository {
    static async create(
        conductorId: number,
        vehicleId: number,
        input: CreateMaintenanceInput
    ): Promise<CreatedMaintenance> {
        const client = await pool.connect();

        try {
            await client.query("BEGIN");

            const result = await client.query<{ id: number; created_at: Date }>(
                `INSERT INTO mantenimientos_vehiculo (
                    vehiculo_id, registrado_por, tipo_servicio, clase_servicio,
                    categoria, fecha_servicio, kilometraje, proveedor, descripcion,
                    costo, proxima_fecha, proximo_kilometraje, estado, observaciones
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9,
                    $10, $11, $12, $13, $14
                )
                RETURNING id, created_at`,
                [
                    vehicleId,
                    conductorId,
                    input.serviceType,
                    input.serviceClass,
                    input.category,
                    input.serviceDate,
                    input.mileage,
                    input.provider || null,
                    input.description,
                    input.cost,
                    input.nextServiceDate,
                    input.nextServiceMileage,
                    input.status,
                    input.observations || null,
                ]
            );

            const maintenance = result.rows[0];
            if (!maintenance) throw new Error("MAINTENANCE_NOT_CREATED");

            if (input.status === "Realizado" && input.serviceType === "Cambio de aceite") {
                if (input.mileage === null) throw new Error("OIL_MILEAGE_REQUIRED");

                await VehicleMileageRepository.register(client, {
                    vehicleId,
                    mileage: input.mileage,
                    origin: "Cambio_aceite",
                    referenceId: maintenance.id,
                    registeredBy: conductorId,
                });

                await client.query(
                    `UPDATE configuracion_cambio_aceite
                     SET kilometraje_referencia = $2,
                         proximo_cambio_km = CASE
                             WHEN intervalo_km IS NULL THEN proximo_cambio_km
                             ELSE $2 + intervalo_km
                         END,
                         updated_at = CURRENT_TIMESTAMP
                     WHERE vehiculo_id = $1 AND activo = TRUE`,
                    [vehicleId, input.mileage]
                );
            }

            if (input.status === "Realizado" && input.serviceType === "Fumigación") {
                await client.query(
                    `UPDATE configuracion_fumigacion
                     SET ultima_fumigacion = $2,
                         proxima_fumigacion = CASE
                             WHEN frecuencia_dias IS NULL THEN proxima_fumigacion
                             ELSE $2::date + frecuencia_dias
                         END,
                         updated_at = CURRENT_TIMESTAMP
                     WHERE vehiculo_id = $1 AND requiere_fumigacion = TRUE`,
                    [vehicleId, input.serviceDate]
                );
            }

            await client.query("COMMIT");

            return {
                id: maintenance.id,
                vehicleId,
                createdAt: maintenance.created_at.toISOString(),
            };
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    static async attachEvidence(
        conductorId: number,
        input: MaintenanceEvidenceInput
    ): Promise<boolean> {
        const fileName = input.objectKey.split("/").at(-1);
        if (!fileName) return false;

        const result = await pool.query(
            `UPDATE mantenimientos_vehiculo
             SET comprobante_s3_ruta = $3,
                 comprobante_nombre_archivo = $4
             WHERE id = $1 AND registrado_por = $2`,
            [input.maintenanceId, conductorId, input.objectKey, fileName]
        );

        return Boolean(result.rowCount);
    }
}
