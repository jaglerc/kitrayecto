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
              AND EXISTS (
                  SELECT 1 FROM seguros_vehiculos s
                  JOIN documentos_seguros ds ON ds.seguro_id = s.id
                  WHERE s.carro_id = vehiculo.id
                    AND s.fecha_expiracion_poliza >= CURRENT_DATE
              )
              AND EXISTS (
                  SELECT 1 FROM revisiones_tecnicomecanicas r
                  JOIN documentos_tecnomecanica dt ON dt.tecnico_id = r.id
                  WHERE r.carro_id = vehiculo.id
                    AND r.fecha_expiracion_tecnomecanica >= CURRENT_DATE
              )
            ORDER BY placa
            `,
            [type]
        );

        return result.rows;
    }
}
