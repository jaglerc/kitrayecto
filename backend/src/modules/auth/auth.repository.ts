import { pool } from "../../database/database.js";
import type { User } from "./auth.types.js";

export class AuthRepository {

    static async findByCedula(
        cedula: string
    ): Promise<User | null> {

        const result = await pool.query<User>(
            `
            SELECT
                id,
                nombre,
                cedula,
                password,
                role,
                estado
            FROM usuario
            WHERE cedula = $1
            LIMIT 1
            `,
            [cedula]
        );

        if (result.rows.length === 0) {
            return null;
        }

        return result.rows[0] ?? null;
    }

    static async findActiveIdentity(userId: number): Promise<Pick<User, "id" | "role" | "estado"> | null> {
        const result = await pool.query<Pick<User, "id" | "role" | "estado">>(
            `SELECT id, role, estado FROM usuario WHERE id = $1 LIMIT 1`,
            [userId]
        );
        return result.rows[0] ?? null;
    }
}
