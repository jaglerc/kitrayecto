import type { PoolClient } from "pg";

import { pool } from "../../database/database.js";
import type { AuthenticatedUser } from "../auth/auth.types.js";
import type {
    SupervisorVehicleDetail,
    SupervisorVehicleInput,
    SupervisorVehicleListInput,
    SupervisorVehicleListResult,
    SupervisorVehicleSummary,
    VehicleInsuranceRecord,
    VehicleLegalDocumentInput,
    VehicleTechnicalInspectionRecord,
} from "./supervisor-vehicles.types.js";

interface VehicleRow {
    id: number;
    tipo_vehiculo: string;
    placa: string;
    licencia_transito: string | null;
    marca: string | null;
    propietario: string | null;
    kilometraje_actual: string | number | null;
    estado: boolean;
    created_at: string | null;
    control_aceite_activo: boolean | null;
    intervalo_aceite_km: number | null;
    margen_alerta_aceite_km: number | null;
    kilometraje_referencia_aceite: string | number | null;
    proximo_cambio_aceite_km: string | number | null;
    requiere_fumigacion: boolean | null;
    frecuencia_fumigacion_dias: number | null;
    ultima_fumigacion: string | null;
    proxima_fumigacion: string | null;
    seguro_expira: string | null;
    seguro_documentado: boolean;
    tecnico_expira: string | null;
    tecnico_documentado: boolean;
}

interface InsuranceRow { id: number; numero_poliza: string; tipo_poliza: string | null; fecha_vigencia_poliza: string | null; fecha_expiracion_poliza: string | null; precio_poliza: string | number | null; aseguradora: string | null; documento_id: number | null; s3_ruta: string | null; nombre_archivo: string | null; documento_created_at: string | null; }
interface TechnicalRow { id: number; numero_tecnomecanica: string; fecha_vigencia_tecnomecanica: string | null; fecha_expiracion_tecnomecanica: string | null; precio_tecnicomecanica: string | number | null; documento_id: number | null; s3_ruta: string | null; nombre_archivo: string | null; documento_created_at: string | null; }

const apiType = (value: string): SupervisorVehicleSummary["type"] => {
    const normalized = value.toLowerCase();
    return normalized === "motocicleta" || normalized === "motocarguero" || normalized === "carro"
        ? normalized
        : "camioneta";
};

const mapRow = (row: VehicleRow): SupervisorVehicleDetail => {
    const mileage = row.kilometraje_actual === null ? null : Number(row.kilometraje_actual);
    const nextOil = row.proximo_cambio_aceite_km === null ? null : Number(row.proximo_cambio_aceite_km);
    const remaining = nextOil === null || mileage === null ? null : nextOil - mileage;
    const margin = row.margen_alerta_aceite_km ?? 0;
    const oilEnabled = Boolean(row.control_aceite_activo);
    const oilStatus = !oilEnabled ? "disabled" : nextOil === null || remaining === null ? "pending" : remaining <= 0 ? "overdue" : remaining <= margin ? "upcoming" : "ok";
    const today = new Date().toISOString().slice(0, 10);
    const nextFumigation = row.proxima_fumigacion;
    const days = nextFumigation
        ? Math.ceil((new Date(`${nextFumigation}T00:00:00Z`).getTime() - new Date(`${today}T00:00:00Z`).getTime()) / 86400000)
        : null;
    const fumigationRequired = Boolean(row.requiere_fumigacion);
    const fumigationStatus = !fumigationRequired ? "not_required" : days === null ? "pending" : days <= 0 ? "overdue" : days <= 15 ? "upcoming" : "ok";
    const expiryStatus = (expiresAt: string | null, documented: boolean) => {
        if (!expiresAt || !documented) return "incomplete" as const;
        const remainingDays = Math.ceil((new Date(`${expiresAt}T00:00:00Z`).getTime() - new Date(`${today}T00:00:00Z`).getTime()) / 86400000);
        return remainingDays < 0 ? "expired" as const : remainingDays <= 30 ? "upcoming" as const : "valid" as const;
    };
    const insuranceStatus = expiryStatus(row.seguro_expira, row.seguro_documentado);
    const technicalStatus = expiryStatus(row.tecnico_expira, row.tecnico_documentado);
    const documentationStatus = insuranceStatus === "expired" || technicalStatus === "expired" ? "expired"
        : insuranceStatus === "incomplete" || technicalStatus === "incomplete" ? "incomplete"
        : insuranceStatus === "upcoming" || technicalStatus === "upcoming" ? "upcoming" : "valid";

    return {
        id: row.id,
        type: apiType(row.tipo_vehiculo),
        plate: row.placa,
        transitLicense: row.licencia_transito,
        brand: row.marca,
        owner: row.propietario,
        currentMileage: mileage,
        active: row.estado,
        createdAt: row.created_at,
        oilControlEnabled: oilEnabled,
        oilIntervalKm: row.intervalo_aceite_km,
        oilWarningMarginKm: row.margen_alerta_aceite_km,
        oilReferenceMileage: row.kilometraje_referencia_aceite === null ? null : Number(row.kilometraje_referencia_aceite),
        nextOilChangeKm: nextOil,
        oilRemainingKm: remaining,
        oilStatus,
        fumigationRequired,
        fumigationFrequencyDays: row.frecuencia_fumigacion_dias,
        lastFumigationDate: row.ultima_fumigacion,
        nextFumigationDate: nextFumigation,
        fumigationStatus,
        documentationStatus,
        availableForJourney: row.estado && insuranceStatus !== "expired" && insuranceStatus !== "incomplete" && technicalStatus !== "expired" && technicalStatus !== "incomplete",
        insurances: [],
        technicalInspections: [],
    };
};

const select = `
    SELECT v.id, v.tipo_vehiculo::text, v.placa, v.licencia_transito,
           v.marca, v.propietario, v.kilometraje_actual, v.estado,
           v.created_at::text,
           ca.activo AS control_aceite_activo, ca.intervalo_km AS intervalo_aceite_km,
           ca.margen_alerta_km AS margen_alerta_aceite_km,
           ca.kilometraje_referencia AS kilometraje_referencia_aceite,
           ca.proximo_cambio_km AS proximo_cambio_aceite_km,
           cf.requiere_fumigacion, cf.frecuencia_dias AS frecuencia_fumigacion_dias,
           cf.ultima_fumigacion::text, cf.proxima_fumigacion::text,
           si.fecha_expiracion_poliza::text AS seguro_expira,
           COALESCE(si.documentado, FALSE) AS seguro_documentado,
           rt.fecha_expiracion_tecnomecanica::text AS tecnico_expira,
           COALESCE(rt.documentado, FALSE) AS tecnico_documentado
    FROM vehiculo v
    LEFT JOIN configuracion_cambio_aceite ca ON ca.vehiculo_id = v.id
    LEFT JOIN configuracion_fumigacion cf ON cf.vehiculo_id = v.id
    LEFT JOIN LATERAL (
        SELECT s.fecha_expiracion_poliza,
               EXISTS (SELECT 1 FROM documentos_seguros ds WHERE ds.seguro_id = s.id) AS documentado
        FROM seguros_vehiculos s WHERE s.carro_id = v.id
        ORDER BY s.fecha_expiracion_poliza DESC NULLS LAST, s.id DESC LIMIT 1
    ) si ON TRUE
    LEFT JOIN LATERAL (
        SELECT r.fecha_expiracion_tecnomecanica,
               EXISTS (SELECT 1 FROM documentos_tecnomecanica dt WHERE dt.tecnico_id = r.id) AS documentado
        FROM revisiones_tecnomecanicas r WHERE r.carro_id = v.id
        ORDER BY r.fecha_expiracion_tecnomecanica DESC NULLS LAST, r.id DESC LIMIT 1
    ) rt ON TRUE`;

const saveConfigurations = async (client: PoolClient, vehicleId: number, input: SupervisorVehicleInput): Promise<void> => {
    const nextOil = input.oilControlEnabled && input.oilReferenceMileage !== null && input.oilIntervalKm !== null
        ? input.oilReferenceMileage + input.oilIntervalKm
        : null;
    await client.query(
        `INSERT INTO configuracion_cambio_aceite
            (vehiculo_id, activo, intervalo_km, margen_alerta_km, kilometraje_referencia, proximo_cambio_km, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
         ON CONFLICT (vehiculo_id) DO UPDATE SET activo = EXCLUDED.activo,
            intervalo_km = EXCLUDED.intervalo_km, margen_alerta_km = EXCLUDED.margen_alerta_km,
            kilometraje_referencia = EXCLUDED.kilometraje_referencia,
            proximo_cambio_km = EXCLUDED.proximo_cambio_km, updated_at = CURRENT_TIMESTAMP`,
        [vehicleId, input.oilControlEnabled, input.oilIntervalKm, input.oilWarningMarginKm, input.oilReferenceMileage, nextOil]
    );
    await client.query(
        `INSERT INTO configuracion_fumigacion
            (vehiculo_id, requiere_fumigacion, frecuencia_dias, ultima_fumigacion, proxima_fumigacion, updated_at)
         VALUES ($1, $2, $3, $4, CASE WHEN $4::date IS NULL OR $3::integer IS NULL THEN NULL ELSE $4::date + $3::integer END, CURRENT_TIMESTAMP)
         ON CONFLICT (vehiculo_id) DO UPDATE SET requiere_fumigacion = EXCLUDED.requiere_fumigacion,
            frecuencia_dias = EXCLUDED.frecuencia_dias, ultima_fumigacion = EXCLUDED.ultima_fumigacion,
            proxima_fumigacion = EXCLUDED.proxima_fumigacion, updated_at = CURRENT_TIMESTAMP`,
        [vehicleId, input.fumigationRequired, input.fumigationFrequencyDays, input.lastFumigationDate]
    );
};

const documentStatus = (expiresAt: string | null, hasDocument: boolean): "incomplete" | "valid" | "upcoming" | "expired" => {
    if (!expiresAt || !hasDocument) return "incomplete";
    const today = new Date().toISOString().slice(0, 10);
    const days = Math.ceil((new Date(`${expiresAt}T00:00:00Z`).getTime() - new Date(`${today}T00:00:00Z`).getTime()) / 86400000);
    return days < 0 ? "expired" : days <= 30 ? "upcoming" : "valid";
};

export class SupervisorVehiclesRepository {
    static async findMany(input: SupervisorVehicleListInput): Promise<SupervisorVehicleListResult> {
        const values: unknown[] = [];
        const conditions: string[] = [];
        if (input.search) { values.push(`%${input.search}%`); conditions.push(`(v.placa ILIKE $${values.length} OR v.marca ILIKE $${values.length})`); }
        if (input.type) { values.push(input.type); conditions.push(`LOWER(v.tipo_vehiculo::text) = $${values.length}`); }
        if (input.active !== null) { values.push(input.active); conditions.push(`v.estado = $${values.length}`); }
        const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
        const count = await pool.query<{ total: string }>(`SELECT COUNT(*)::text AS total FROM vehiculo v ${where}`, values);
        const offset = (input.page - 1) * input.pageSize;
        const result = await pool.query<VehicleRow>(`${select} ${where} ORDER BY v.placa LIMIT $${values.length + 1} OFFSET $${values.length + 2}`, [...values, input.pageSize, offset]);
        return { items: result.rows.map(mapRow), total: Number(count.rows[0]?.total ?? 0), page: input.page, pageSize: input.pageSize };
    }

    static async findById(vehicleId: number): Promise<SupervisorVehicleDetail | null> {
        const result = await pool.query<VehicleRow>(`${select} WHERE v.id = $1 LIMIT 1`, [vehicleId]);
        if (!result.rows[0]) return null;
        const [insuranceResult, technicalResult] = await Promise.all([
            pool.query<InsuranceRow>(
                `SELECT s.id, s.numero_poliza, s.tipo_poliza, s.fecha_vigencia_poliza::text,
                        s.fecha_expiracion_poliza::text, s.precio_poliza, s.aseguradora,
                        d.id AS documento_id, d.s3_ruta, d.nombre_archivo, d.created_at::text AS documento_created_at
                 FROM seguros_vehiculos s
                 LEFT JOIN LATERAL (SELECT * FROM documentos_seguros WHERE seguro_id = s.id ORDER BY id DESC LIMIT 1) d ON TRUE
                 WHERE s.carro_id = $1 ORDER BY s.fecha_expiracion_poliza DESC NULLS LAST, s.id DESC`, [vehicleId]),
            pool.query<TechnicalRow>(
                `SELECT r.id, r.numero_tecnomecanica, r.fecha_vigencia_tecnomecanica::text,
                        r.fecha_expiracion_tecnomecanica::text, r.precio_tecnicomecanica,
                        d.id AS documento_id, d.s3_ruta, d.nombre_archivo, d.created_at::text AS documento_created_at
                 FROM revisiones_tecnomecanicas r
                 LEFT JOIN LATERAL (SELECT * FROM documentos_tecnomecanica WHERE tecnico_id = r.id ORDER BY id DESC LIMIT 1) d ON TRUE
                 WHERE r.carro_id = $1 ORDER BY r.fecha_expiracion_tecnomecanica DESC NULLS LAST, r.id DESC`, [vehicleId]),
        ]);
        const detail = mapRow(result.rows[0]);
        detail.insurances = insuranceResult.rows.map((row): VehicleInsuranceRecord => ({
            id: row.id, policyNumber: row.numero_poliza, policyType: row.tipo_poliza,
            validFrom: row.fecha_vigencia_poliza, expiresAt: row.fecha_expiracion_poliza,
            price: row.precio_poliza === null ? null : Number(row.precio_poliza), insurer: row.aseguradora,
            status: documentStatus(row.fecha_expiracion_poliza, row.documento_id !== null),
            document: row.documento_id === null ? null : { id: row.documento_id, objectKey: row.s3_ruta!, fileName: row.nombre_archivo!, createdAt: row.documento_created_at },
        }));
        detail.technicalInspections = technicalResult.rows.map((row): VehicleTechnicalInspectionRecord => ({
            id: row.id, number: row.numero_tecnomecanica, validFrom: row.fecha_vigencia_tecnomecanica,
            expiresAt: row.fecha_expiracion_tecnomecanica,
            price: row.precio_tecnicomecanica === null ? null : Number(row.precio_tecnicomecanica),
            status: documentStatus(row.fecha_expiracion_tecnomecanica, row.documento_id !== null),
            document: row.documento_id === null ? null : { id: row.documento_id, objectKey: row.s3_ruta!, fileName: row.nombre_archivo!, createdAt: row.documento_created_at },
        }));
        return detail;
    }

    static async plateExists(plate: string, exceptId?: number): Promise<boolean> {
        const result = await pool.query("SELECT 1 FROM vehiculo WHERE UPPER(placa) = UPPER($1) AND ($2::integer IS NULL OR id <> $2) LIMIT 1", [plate, exceptId ?? null]);
        return Boolean(result.rowCount);
    }

    static async create(actor: AuthenticatedUser, input: SupervisorVehicleInput): Promise<SupervisorVehicleDetail> {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            const inserted = await client.query<{ id: number }>(
                `INSERT INTO vehiculo (tipo_vehiculo, placa, licencia_transito, marca, propietario, kilometraje_actual, estado, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6, TRUE, CURRENT_TIMESTAMP) RETURNING id`,
                [input.databaseType, input.plate, input.transitLicense, input.brand, input.owner, input.currentMileage]
            );
            const id = inserted.rows[0]!.id;
            if (input.currentMileage !== null) await client.query(
                `INSERT INTO lecturas_kilometraje (vehiculo_id, kilometraje, origen, referencia_id, registrado_por, created_at)
                 VALUES ($1, $2, 'Registro_vehiculo', $1, $3, CURRENT_TIMESTAMP)`,
                [id, input.currentMileage, actor.id]
            );
            await saveConfigurations(client, id, input);
            await client.query("COMMIT");
            return (await this.findById(id))!;
        } catch (error) { await client.query("ROLLBACK"); throw error; }
        finally { client.release(); }
    }

    static async update(vehicleId: number, actor: AuthenticatedUser, input: SupervisorVehicleInput): Promise<SupervisorVehicleDetail | null> {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            const current = await client.query<{ kilometraje_actual: string | null }>("SELECT kilometraje_actual FROM vehiculo WHERE id = $1 FOR UPDATE", [vehicleId]);
            if (!current.rows[0]) { await client.query("ROLLBACK"); return null; }
            const previousMileage = current.rows[0].kilometraje_actual === null ? null : Number(current.rows[0].kilometraje_actual);
            await client.query(
                `UPDATE vehiculo SET tipo_vehiculo = $2, placa = $3, licencia_transito = $4,
                    marca = $5, propietario = $6, kilometraje_actual = $7 WHERE id = $1`,
                [vehicleId, input.databaseType, input.plate, input.transitLicense, input.brand, input.owner, input.currentMileage]
            );
            if (input.currentMileage !== null && (previousMileage === null || input.currentMileage > previousMileage)) {
                await client.query(
                    `INSERT INTO lecturas_kilometraje (vehiculo_id, kilometraje, origen, referencia_id, registrado_por, created_at)
                     VALUES ($1, $2, 'Ajuste_supervisor', $1, $3, CURRENT_TIMESTAMP)`,
                    [vehicleId, input.currentMileage, actor.id]
                );
            }
            await saveConfigurations(client, vehicleId, input);
            await client.query("COMMIT");
            return this.findById(vehicleId);
        } catch (error) { await client.query("ROLLBACK"); throw error; }
        finally { client.release(); }
    }

    static async updateStatus(vehicleId: number, active: boolean): Promise<SupervisorVehicleDetail | null> {
        const result = await pool.query("UPDATE vehiculo SET estado = $2 WHERE id = $1 RETURNING id", [vehicleId, active]);
        return result.rowCount ? this.findById(vehicleId) : null;
    }

    static async createInsurance(vehicleId: number, input: VehicleLegalDocumentInput): Promise<void> {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            const record = await client.query<{ id: number }>(
                `INSERT INTO seguros_vehiculos (carro_id, numero_poliza, tipo_poliza, fecha_vigencia_poliza,
                    fecha_expiracion_poliza, precio_poliza, aseguradora, created_at)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,CURRENT_TIMESTAMP) RETURNING id`,
                [vehicleId, input.number, input.type ?? null, input.validFrom, input.expiresAt, input.price ?? null, input.provider ?? null]);
            await client.query(`INSERT INTO documentos_seguros (seguro_id, s3_ruta, nombre_archivo, created_at) VALUES ($1,$2,$3,CURRENT_TIMESTAMP)`, [record.rows[0]!.id, input.objectKey, input.fileName]);
            await client.query("COMMIT");
        } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
    }

    static async createTechnicalInspection(vehicleId: number, input: VehicleLegalDocumentInput): Promise<void> {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            const record = await client.query<{ id: number }>(
                `INSERT INTO revisiones_tecnicomecanicas (carro_id, numero_tecnomecanica,
                    fecha_vigencia_tecnomecanica, fecha_expiracion_tecnomecanica, precio_tecnicomecanica)
                 VALUES ($1,$2,$3,$4,$5) RETURNING id`,
                [vehicleId, input.number, input.validFrom, input.expiresAt, input.price ?? null]);
            await client.query(`INSERT INTO documentos_tecnomecanica (tecnico_id, s3_ruta, nombre_archivo, created_at) VALUES ($1,$2,$3,CURRENT_TIMESTAMP)`, [record.rows[0]!.id, input.objectKey, input.fileName]);
            await client.query("COMMIT");
        } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
    }
}
