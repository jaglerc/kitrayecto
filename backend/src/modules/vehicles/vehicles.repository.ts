import { pool } from "../../database/database.js";

import type {
    DatabaseVehicleType,
    VehicleRecord,
} from "./vehicles.types.js";

export class VehiclesRepository {
    static async findByType(
        type: DatabaseVehicleType
    ): Promise<VehicleRecord[]> {
        const result = await pool.query<VehicleRecord>(
            `
            SELECT
                id,
                placa
            FROM vehiculo
            WHERE tipo_vehiculo::text = $1
              AND estado = TRUE
            ORDER BY placa
            `,
            [type]
        );

        return result.rows;
    }
}
