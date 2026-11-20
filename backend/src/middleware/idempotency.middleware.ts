import type { RequestHandler } from "express";
import type { AuthenticatedUser } from "../modules/auth/auth.types.js";
import { pool } from "../database/database.js";

interface StoredResponse {
    response_status: number;
    response_body: unknown;
}

export const IdempotencyMiddleware: RequestHandler = async (req, res, next) => {
    const key = req.header("Idempotency-Key");
    if (!key) {
        next();
        return;
    }
    if (key.length > 100) {
        res.status(400).json({ message: "La clave de idempotencia no es válida" });
        return;
    }

    const user = res.locals.user as AuthenticatedUser | undefined;
    if (!user) {
        res.status(401).json({ message: "Debes iniciar sesión" });
        return;
    }

    const routePath = req.route?.path ?? req.path;
    const scope = `${user.id}:${req.method}:${req.baseUrl}${routePath}`;
    const lockKey = `${scope}:${key}`;
    const client = await pool.connect();
    let lockAcquired = false;
    let clientReleased = false;

    const release = async () => {
        try {
            if (lockAcquired) {
                await client.query("SELECT pg_advisory_unlock(hashtextextended($1, 0))", [lockKey]);
                lockAcquired = false;
            }
        } finally {
            if (!clientReleased) {
                clientReleased = true;
                client.release();
            }
        }
    };

    try {
        await client.query("SELECT pg_advisory_lock(hashtextextended($1, 0))", [lockKey]);
        lockAcquired = true;

        const existing = await client.query<StoredResponse>(
            `SELECT response_status, response_body
             FROM idempotency_requests
             WHERE scope = $1 AND idempotency_key = $2`,
            [scope, key]
        );
        const stored = existing.rows[0];
        if (stored) {
            await release();
            res.status(stored.response_status).json(stored.response_body);
            return;
        }

        const originalJson = res.json.bind(res);
        let responseBody: unknown;
        res.json = ((body: unknown) => {
            responseBody = body;
            return originalJson(body);
        }) as typeof res.json;

        res.once("finish", () => {
            void (async () => {
                try {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        await client.query(
                            `INSERT INTO idempotency_requests
                                (scope, idempotency_key, response_status, response_body)
                             VALUES ($1, $2, $3, $4::jsonb)
                             ON CONFLICT (scope, idempotency_key) DO NOTHING`,
                            [scope, key, res.statusCode, JSON.stringify(responseBody ?? null)]
                        );
                    }
                } catch (error) {
                    console.error("No fue posible guardar la respuesta idempotente:", error);
                } finally {
                    await release();
                }
            })();
        });
        res.once("close", () => {
            if (!res.writableFinished) void release();
        });

        next();
    } catch (error) {
        if (!clientReleased) await release();
        next(error);
    }
};
