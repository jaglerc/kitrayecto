import { pool } from "../../database/database.js";
import type {
    SupervisorCostsQuery,
    SupervisorExpense,
    VehicleCostDocuments,
} from "./supervisor-costs.types.js";

interface ExpenseRow {
    id: string;
    vehicle_id: number;
    plate: string;
    occurred_at: string;
    category: SupervisorExpense["category"];
    description: string;
    amount: string | number;
}

interface DocumentRow {
    vehicle_id: number;
    plate: string;
    soat_number: string | null;
    soat_valid_from: string | null;
    soat_expires_at: string | null;
    soat_amount: string | number | null;
    technical_number: string | null;
    technical_valid_from: string | null;
    technical_expires_at: string | null;
    technical_amount: string | number | null;
}

const expensesQuery = `
    SELECT
        'fuel-' || r.id::text AS id,
        r.vehiculo_id AS vehicle_id,
        v.placa AS plate,
        r.created_at::date::text AS occurred_at,
        'Combustible'::text AS category,
        CONCAT_WS(' · ', r.tipo_combustible::text, r.estacion_servicio) AS description,
        r.valor_pagado AS amount
    FROM registro_combustible r
    JOIN vehiculo v ON v.id = r.vehiculo_id
    WHERE r.created_at >= $1::date
      AND r.created_at < ($1::date + INTERVAL '1 month')
      AND ($2::integer IS NULL OR r.vehiculo_id = $2)

    UNION ALL

    SELECT
        'maintenance-' || m.id::text AS id,
        m.vehiculo_id AS vehicle_id,
        v.placa AS plate,
        m.fecha_servicio::text AS occurred_at,
        'Mantenimiento'::text AS category,
        CONCAT_WS(' · ', m.tipo_servicio, m.categoria, m.descripcion) AS description,
        m.costo AS amount
    FROM mantenimientos_vehiculo m
    JOIN vehiculo v ON v.id = m.vehiculo_id
    WHERE m.fecha_servicio >= $1::date
      AND m.fecha_servicio < ($1::date + INTERVAL '1 month')
      AND m.estado = 'Realizado'
      AND ($2::integer IS NULL OR m.vehiculo_id = $2)

    ORDER BY occurred_at DESC, id DESC
`;

const documentsQuery = `
    SELECT
        v.id AS vehicle_id,
        v.placa AS plate,
        soat.numero_poliza AS soat_number,
        soat.fecha_vigencia_poliza::text AS soat_valid_from,
        soat.fecha_expiracion_poliza::text AS soat_expires_at,
        soat.precio_poliza AS soat_amount,
        tecnico.numero_tecnomecanica AS technical_number,
        tecnico.fecha_vigencia_tecnomecanica::text AS technical_valid_from,
        tecnico.fecha_expiracion_tecnomecanica::text AS technical_expires_at,
        tecnico.precio_tecnicomecanica AS technical_amount
    FROM vehiculo v
    LEFT JOIN LATERAL (
        SELECT
            s.numero_poliza,
            s.fecha_vigencia_poliza,
            s.fecha_expiracion_poliza,
            s.precio_poliza
        FROM seguros_vehiculos s
        WHERE s.carro_id = v.id
          AND (
              UPPER(BTRIM(COALESCE(s.tipo_poliza, ''))) = 'SOAT'
              OR (
                  BTRIM(COALESCE(s.tipo_poliza, '')) = ''
                  AND NOT EXISTS (
                      SELECT 1
                      FROM seguros_vehiculos soat_existente
                      WHERE soat_existente.carro_id = v.id
                        AND UPPER(BTRIM(COALESCE(soat_existente.tipo_poliza, ''))) = 'SOAT'
                  )
              )
          )
        ORDER BY s.fecha_expiracion_poliza DESC NULLS LAST, s.id DESC
        LIMIT 1
    ) soat ON TRUE
    LEFT JOIN LATERAL (
        SELECT
            r.numero_tecnomecanica,
            r.fecha_vigencia_tecnomecanica,
            r.fecha_expiracion_tecnomecanica,
            r.precio_tecnicomecanica
        FROM revisiones_tecnicomecanicas r
        WHERE r.carro_id = v.id
        ORDER BY r.fecha_expiracion_tecnomecanica DESC NULLS LAST, r.id DESC
        LIMIT 1
    ) tecnico ON TRUE
    ORDER BY v.placa
`;

const mapDocumentRow = (row: DocumentRow): VehicleCostDocuments => ({
    vehicleId: row.vehicle_id,
    plate: row.plate,
    soat: row.soat_number === null
        ? null
        : {
            number: row.soat_number,
            validFrom: row.soat_valid_from,
            expiresAt: row.soat_expires_at,
            amount: row.soat_amount === null ? null : Number(row.soat_amount),
        },
    technicalInspection: row.technical_number === null
        ? null
        : {
            number: row.technical_number,
            validFrom: row.technical_valid_from,
            expiresAt: row.technical_expires_at,
            amount: row.technical_amount === null ? null : Number(row.technical_amount),
        },
});

export class SupervisorCostsRepository {
    static async find(query: SupervisorCostsQuery): Promise<{
        expenses: SupervisorExpense[];
        documents: VehicleCostDocuments[];
    }> {
        const [expenseResult, documentResult] = await Promise.all([
            pool.query<ExpenseRow>(expensesQuery, [`${query.month}-01`, query.vehicleId]),
            pool.query<DocumentRow>(documentsQuery),
        ]);

        return {
            expenses: expenseResult.rows.map((row) => ({
                id: row.id,
                vehicleId: row.vehicle_id,
                plate: row.plate,
                occurredAt: row.occurred_at,
                category: row.category,
                description: row.description,
                amount: Number(row.amount),
            })),
            documents: documentResult.rows.map(mapDocumentRow),
        };
    }
}
