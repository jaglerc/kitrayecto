import type { PoolClient } from "pg";
import { pool } from "../../database/database.js";
import { drainStorageCleanup } from "../storage/storage-cleanup.js";

export class DeletionError extends Error {
    constructor(message: string, public readonly status: number) { super(message); }
}

export function validateDeletionId(id: number): void {
    if (!Number.isSafeInteger(id) || id <= 0) throw new DeletionError("El identificador no es válido", 400);
}

const quote = (name: string): string => `"${name.replaceAll('"', '""')}"`;

// Check even CASCADE / SET NULL references before deleting. New database relations
// are protected automatically instead of silently erasing operational history.
export async function assertUnreferenced(client: PoolClient, table: string, id: number): Promise<void> {
    const references = await client.query<{ schema_name: string; table_name: string; columns: string[]; target_columns: string[] }>(
        `SELECT ns.nspname AS schema_name, rel.relname AS table_name,
            ARRAY(SELECT a.attname::text FROM unnest(c.conkey) WITH ORDINALITY k(num, ord)
                  JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.num ORDER BY k.ord) AS columns,
            ARRAY(SELECT a.attname::text FROM unnest(c.confkey) WITH ORDINALITY k(num, ord)
                  JOIN pg_attribute a ON a.attrelid = c.confrelid AND a.attnum = k.num ORDER BY k.ord) AS target_columns
         FROM pg_constraint c JOIN pg_class rel ON rel.oid = c.conrelid
         JOIN pg_namespace ns ON ns.oid = rel.relnamespace
         WHERE c.contype = 'f' AND c.confrelid = to_regclass($1)`, [table]
    );
    for (const reference of references.rows) {
        const predicate = reference.columns.map((column, index) => `r.${quote(column)} = t.${quote(reference.target_columns[index]!)}`).join(" AND ");
        const result = await client.query(
            `SELECT 1 FROM ${quote(reference.schema_name)}.${quote(reference.table_name)} r
             JOIN ${quote(table)} t ON ${predicate} WHERE t.id = $1 LIMIT 1`, [id]
        );
        if (result.rowCount) throw new DeletionError("No se puede eliminar porque tiene historial o registros relacionados. Puedes desactivarlo para conservar la información.", 409);
    }
}

async function lockRecord(client: PoolClient, table: string, id: number, parentColumn?: string, parentId?: number): Promise<void> {
    const result = await client.query(`SELECT id FROM ${quote(table)} WHERE id = $1${parentColumn ? ` AND ${quote(parentColumn)} = $2` : ""} FOR UPDATE`, parentColumn ? [id, parentId] : [id]);
    if (!result.rowCount) throw new DeletionError("El registro ya no existe o no pertenece al elemento seleccionado. Actualiza la página.", 404);
}

async function removeDocuments(client: PoolClient, table: string, column: string, id: number): Promise<void> {
    // All identifiers are server-owned constants, never supplied by the request.
    await client.query(`INSERT INTO storage_deletion_queue (object_key)
        SELECT s3_ruta FROM ${quote(table)} WHERE ${quote(column)} = $1 AND s3_ruta IS NOT NULL
        ON CONFLICT (object_key) DO NOTHING`, [id]);
    const documents = await client.query<{ id: number }>(`SELECT id FROM ${quote(table)} WHERE ${quote(column)} = $1 FOR UPDATE`, [id]);
    for (const document of documents.rows) await assertUnreferenced(client, table, document.id);
    await client.query(`DELETE FROM ${quote(table)} WHERE ${quote(column)} = $1`, [id]);
}

export type LegalRecordKind = "insurance" | "technical-inspections";
const legalTables = {
    insurance: { record: "seguros_vehiculos", documents: "documentos_seguros", foreignKey: "seguro_id" },
    "technical-inspections": { record: "revisiones_tecnicomecanicas", documents: "documentos_tecnomecanica", foreignKey: "tecnico_id" },
} as const;

async function removeLegalRecord(client: PoolClient, vehicleId: number, kind: LegalRecordKind, id: number): Promise<void> {
    const tables = legalTables[kind];
    await lockRecord(client, tables.record, id, "carro_id", vehicleId);
    await removeDocuments(client, tables.documents, tables.foreignKey, id);
    await assertUnreferenced(client, tables.record, id);
    await client.query(`DELETE FROM ${quote(tables.record)} WHERE id = $1`, [id]);
}

async function transaction(work: (client: PoolClient) => Promise<void>): Promise<void> {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await work(client);
        await client.query("COMMIT");
    } catch (error) {
        await client.query("ROLLBACK");
        if ((error as { code?: string }).code === "23503") throw new DeletionError("El registro tiene información relacionada y no se puede eliminar. Puedes desactivarlo.", 409);
        if (["40001", "40P01"].includes((error as { code?: string }).code ?? "")) throw new DeletionError("El registro cambió mientras se eliminaba. Actualiza la página y vuelve a intentarlo.", 409);
        throw error;
    } finally { client.release(); }
    void drainStorageCleanup().catch((error: unknown) => console.error("Limpieza de archivos pendiente:", error));
}

export class DeletionsService {
    static async userDocument(userId: number, documentId: number): Promise<void> {
        validateDeletionId(userId); validateDeletionId(documentId);
        await transaction(async (client) => {
            await lockRecord(client, "usuario", userId);
            await lockRecord(client, "documentos_usuarios", documentId, "usuario_id", userId);
            // Remove older copies of this same type too, so they cannot reappear.
            const type = await client.query<{ tipo_documento: string }>("SELECT tipo_documento::text FROM documentos_usuarios WHERE id = $1", [documentId]);
            const documents = await client.query<{ id: number }>("SELECT id FROM documentos_usuarios WHERE usuario_id = $1 AND tipo_documento::text = $2 FOR UPDATE", [userId, type.rows[0]!.tipo_documento]);
            for (const document of documents.rows) {
                await assertUnreferenced(client, "documentos_usuarios", document.id);
                await client.query(`INSERT INTO storage_deletion_queue (object_key) SELECT s3_ruta FROM documentos_usuarios WHERE id = $1 AND s3_ruta IS NOT NULL ON CONFLICT DO NOTHING`, [document.id]);
                await client.query("DELETE FROM documentos_usuarios WHERE id = $1", [document.id]);
            }
        });
    }

    static async legalRecord(vehicleId: number, kind: LegalRecordKind, id: number): Promise<void> {
        validateDeletionId(vehicleId); validateDeletionId(id);
        await transaction(async (client) => {
            await lockRecord(client, "vehiculo", vehicleId);
            await removeLegalRecord(client, vehicleId, kind, id);
        });
    }
}
