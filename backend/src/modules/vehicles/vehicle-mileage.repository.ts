import type { PoolClient } from "pg";

export type MileageOrigin = "Check_in" | "Check_out" | "Combustible" | "Cambio_aceite" | "Ajuste_supervisor";

export class VehicleMileageRepository {
    static async register(
        client: PoolClient,
        input: {
            vehicleId: number;
            mileage: number;
            origin: MileageOrigin;
            referenceId: number;
            registeredBy: number;
        }
    ): Promise<void> {
        const current = await client.query<{ kilometraje_actual: string | number }>(
            "SELECT kilometraje_actual FROM vehiculo WHERE id = $1 FOR UPDATE",
            [input.vehicleId]
        );
        const row = current.rows[0];
        if (!row) throw new Error("VEHICLE_NOT_FOUND");
        const previous = Number(row.kilometraje_actual ?? 0);
        if (input.mileage < previous) throw new Error("MILEAGE_LOWER_THAN_CURRENT");
        if (input.mileage === previous) return;

        await client.query(
            "UPDATE vehiculo SET kilometraje_actual = $2 WHERE id = $1",
            [input.vehicleId, input.mileage]
        );
        await client.query(
            `INSERT INTO lecturas_kilometraje
                (vehiculo_id, kilometraje, origen, referencia_id, registrado_por, created_at)
             VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
            [input.vehicleId, input.mileage, input.origin, input.referenceId, input.registeredBy]
        );
    }
}
