import { pool } from "../../database/database.js";
import { StorageService } from "./storage.service.js";

let running = false;
export async function drainStorageCleanup(): Promise<void> {
    if (running) return;
    running = true;
    try {
        for (let index = 0; index < 20; index++) {
            const client = await pool.connect();
            try {
                await client.query("BEGIN");
                const result = await client.query<{ object_key: string }>(
                    `SELECT object_key FROM storage_deletion_queue
                     WHERE next_attempt_at <= CURRENT_TIMESTAMP
                     ORDER BY created_at LIMIT 1 FOR UPDATE SKIP LOCKED`
                );
                const row = result.rows[0];
                if (!row) { await client.query("COMMIT"); break; }
                try {
                    await StorageService.deleteObject(row.object_key);
                    await client.query("DELETE FROM storage_deletion_queue WHERE object_key = $1", [row.object_key]);
                } catch (error) {
                    console.error("No se pudo eliminar un archivo; se reintentará:", error);
                    await client.query(`UPDATE storage_deletion_queue SET attempts = attempts + 1,
                        next_attempt_at = CURRENT_TIMESTAMP + LEAST(3600, 30 * POWER(2, LEAST(attempts, 7))) * INTERVAL '1 second'
                        WHERE object_key = $1`, [row.object_key]);
                }
                await client.query("COMMIT");
            } catch (error) { await client.query("ROLLBACK"); throw error; }
            finally { client.release(); }
        }
    } finally { running = false; }
}

export function startStorageCleanup(): void {
    const run = () => { void drainStorageCleanup().catch((error: unknown) => console.error("No se pudo procesar la limpieza de archivos:", error)); };
    run();
    setInterval(run, 30_000).unref();
}
