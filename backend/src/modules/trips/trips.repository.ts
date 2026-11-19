import type { PoolClient } from "pg";
import { pool } from "../../database/database.js";
import type { ActiveTrip, CreateTripInput, TripLocation, TripStatus, TripVehicle } from "./trips.types.js";

interface CheckInRecord {
    vehiculo_id: number;
    tipo_vehiculo: string;
    placa: string;
    estado: string;
}

interface ActiveTripRecord {
    id: number;
    fecha_inicio: Date;
    vehiculo_id: number;
    tipo_vehiculo: string;
    placa: string;
    numero_dia: number;
}

const toVehicle = (record: { vehiculo_id: number; tipo_vehiculo: string; placa: string }): TripVehicle => ({
    id: record.vehiculo_id,
    type: record.tipo_vehiculo.toLowerCase(),
    plate: record.placa,
});

export class TripsRepository {
    static async findLocations(): Promise<TripLocation[]> {
        const result = await pool.query<{ id: number; nombre: string }>(
            "SELECT id, nombre FROM ubicaciones WHERE activo = TRUE ORDER BY id"
        );
        return result.rows.map((row) => ({ id: row.id, name: row.nombre }));
    }
    static async findStatus(conductorId: number): Promise<TripStatus> {
        const [checkInResult, activeResult, completedResult] = await Promise.all([
            pool.query<CheckInRecord>(
                `SELECT i.vehiculo_id, v.tipo_vehiculo::text AS tipo_vehiculo, v.placa, i.estado::text AS estado
                 FROM inspecciones_vehiculares i
                 JOIN vehiculo v ON v.id = i.vehiculo_id
                 WHERE i.conductor_id = $1
                   AND i.tipo_operacion::text = 'Check_in'
                   AND i.created_at::date = (CURRENT_TIMESTAMP AT TIME ZONE 'America/Bogota')::date
                   AND NOT EXISTS (
                       SELECT 1 FROM inspecciones_vehiculares checkout
                       WHERE checkout.conductor_id = i.conductor_id
                         AND checkout.vehiculo_id = i.vehiculo_id
                         AND checkout.tipo_operacion::text = 'Check_out'
                         AND checkout.created_at > i.created_at
                   )
                 ORDER BY i.created_at DESC
                 LIMIT 1`,
                [conductorId]
            ),
            pool.query<ActiveTripRecord>(
                `SELECT t.id, t.fecha_inicio, t.vehiculo_id,
                        v.tipo_vehiculo::text AS tipo_vehiculo, v.placa,
                        (
                            SELECT COUNT(*)::integer
                            FROM trayectos td
                            WHERE td.conductor_id = t.conductor_id
                              AND td.fecha_inicio::date = (t.fecha_inicio AT TIME ZONE 'America/Bogota')::date
                              AND td.id <= t.id
                        ) AS numero_dia
                 FROM trayectos t
                 JOIN vehiculo v ON v.id = t.vehiculo_id
                 WHERE t.conductor_id = $1 AND t.estado::text = 'En curso'
                 ORDER BY t.fecha_inicio DESC
                 LIMIT 1`,
                [conductorId]
            ),
            pool.query<{ total: number }>(
                `SELECT COUNT(*)::integer AS total
                 FROM trayectos
                 WHERE conductor_id = $1
                   AND estado::text = 'Finalizado'
                   AND fecha_inicio::date = (CURRENT_TIMESTAMP AT TIME ZONE 'America/Bogota')::date`,
                [conductorId]
            ),
        ]);

        const checkIn = checkInResult.rows[0] ?? null;
        const active = activeResult.rows[0] ?? null;
        const completedToday = completedResult.rows[0]?.total ?? 0;
        const activeTrip: ActiveTrip | null = active ? {
            id: active.id,
            numberOfDay: active.numero_dia,
            startedAt: active.fecha_inicio.toISOString(),
            vehicle: toVehicle(active),
        } : null;
        const checkInAuthorized = Boolean(checkIn && !checkIn.estado.toLowerCase().includes("cr"));
        const lastLocation = checkIn ? await pool.query<{ ubicacion_id: number }>(
            `SELECT COALESCE(
                (SELECT p.ubicacion_id FROM trayectos t JOIN paradas_trayecto p ON p.trayecto_id = t.id
                 WHERE t.vehiculo_id = $1 ORDER BY t.fecha_inicio DESC, p.orden DESC LIMIT 1),
                (SELECT t.origen_id FROM trayectos t WHERE t.vehiculo_id = $1 AND t.origen_id IS NOT NULL
                 ORDER BY t.fecha_inicio DESC LIMIT 1)
             ) AS ubicacion_id`, [checkIn.vehiculo_id]
        ) : null;

        return {
            hasCheckIn: Boolean(checkIn),
            checkInAuthorized,
            vehicle: checkIn ? toVehicle(checkIn) : null,
            activeTrip,
            completedToday,
            nextTripNumber: completedToday + (active ? 1 : 0) + 1,
            canStart: Boolean(checkIn && checkInAuthorized && !active),
            canCheckout: Boolean(checkIn && checkInAuthorized && completedToday > 0 && !active),
            suggestedOriginId: lastLocation?.rows[0]?.ubicacion_id ?? null,
        };
    }

    static async create(
        conductorId: number,
        vehicleId: number,
        input: CreateTripInput
    ): Promise<ActiveTrip> {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            await client.query("SELECT pg_advisory_xact_lock($1)", [conductorId]);

            const active = await client.query(
                `SELECT id FROM trayectos WHERE conductor_id = $1 AND estado::text = 'En curso' LIMIT 1`,
                [conductorId]
            );
            if (active.rowCount) throw new Error("ACTIVE_TRIP_EXISTS");

            const countResult = await client.query<{ total: number }>(
                `SELECT COUNT(*)::integer AS total FROM trayectos
                 WHERE conductor_id = $1
                   AND fecha_inicio::date = (CURRENT_TIMESTAMP AT TIME ZONE 'America/Bogota')::date`,
                [conductorId]
            );
            const numberOfDay = (countResult.rows[0]?.total ?? 0) + 1;
            const tripResult = await client.query<{ id: number; fecha_inicio: Date }>(
                `INSERT INTO trayectos (conductor_id, vehiculo_id, estado, observaciones, origen_id)
                 VALUES ($1, $2, 'En curso', $3, $4)
                 RETURNING id, fecha_inicio`,
                [conductorId, vehicleId, input.observations?.trim() || null, input.originId]
            );
            const trip = tripResult.rows[0];
            if (!trip) throw new Error("TRIP_NOT_CREATED");

            for (const product of input.products) {
                await this.insertProduct(client, trip.id, product.productName, product.unit, product.quantity);
            }

            for (const [index, stop] of input.stops.entries()) {
                const stopResult = await client.query<{ id: number }>(
                    `INSERT INTO paradas_trayecto (trayecto_id, ubicacion_id, orden)
                     VALUES ($1, $2, $3) RETURNING id`,
                    [trip.id, stop.locationId, index + 1]
                );
                const stopId = stopResult.rows[0]?.id;
                if (!stopId) throw new Error("TRIP_STOP_NOT_CREATED");
                for (const movement of stop.movements) {
                    await client.query(
                        `INSERT INTO movimientos_carga_trayecto
                            (parada_id, descripcion_producto, unidad_medida, tipo, cantidad)
                         VALUES ($1, $2, $3, $4, $5)`,
                        [stopId, movement.productName, movement.unit, movement.type, movement.quantity]
                    );
                }
            }

            const vehicleResult = await client.query<{ id: number; tipo_vehiculo: string; placa: string }>(
                `SELECT id, tipo_vehiculo::text AS tipo_vehiculo, placa FROM vehiculo WHERE id = $1`,
                [vehicleId]
            );
            const vehicle = vehicleResult.rows[0];
            if (!vehicle) throw new Error("VEHICLE_NOT_FOUND");

            await client.query("COMMIT");
            return {
                id: trip.id,
                numberOfDay,
                startedAt: trip.fecha_inicio.toISOString(),
                vehicle: { id: vehicle.id, type: vehicle.tipo_vehiculo.toLowerCase(), plate: vehicle.placa },
            };
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    static async finish(conductorId: number, tripId: number): Promise<void> {
        const result = await pool.query(
            `UPDATE trayectos
             SET estado = 'Finalizado', fecha_fin = CURRENT_TIMESTAMP
             WHERE id = $1 AND conductor_id = $2 AND estado::text = 'En curso'
             RETURNING id`,
            [tripId, conductorId]
        );
        if (!result.rowCount) throw new Error("ACTIVE_TRIP_NOT_FOUND");
    }

    private static async insertProduct(client: PoolClient, tripId: number, name: string, unit: string, quantity: number): Promise<void> {
        await client.query(
            `INSERT INTO detalle_carga_trayecto (trayecto_id, descripcion_producto, unidad_medida, cantidad)
             VALUES ($1, $2, $3, $4)`,
            [tripId, name, unit, quantity]
        );
    }
}
