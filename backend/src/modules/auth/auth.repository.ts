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
                role
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
}