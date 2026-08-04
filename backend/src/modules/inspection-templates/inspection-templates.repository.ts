import { pool } from "../../database/database.js";

import type {
    DatabaseInspectionVehicleType,
    InspectionTemplateRecord,
} from "./inspection-templates.types.js";

export class InspectionTemplatesRepository {
    static async findByVehicleType(
        vehicleType: DatabaseInspectionVehicleType
    ): Promise<InspectionTemplateRecord[]> {
        const result = await pool.query<InspectionTemplateRecord>(
            `
            SELECT
                id,
                tipo_vehiculo,
                titulo,
                descripcion
            FROM plantillas_check
            WHERE tipo_vehiculo::text = $1
            ORDER BY id
            `,
            [vehicleType]
        );

        return result.rows;
    }
}
