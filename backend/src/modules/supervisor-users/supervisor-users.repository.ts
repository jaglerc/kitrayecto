import { pool } from "../../database/database.js";
import type {
    CreatedSupervisorUser,
    CreatedSupervisorUserDocument,
    CreateSupervisorUserDocumentInput,
    CreateSupervisorUserInput,
    SupervisorUserDetail,
    SupervisorUserListInput,
    SupervisorUserListResult,
    UpdateSupervisorUserInput,
} from "./supervisor-users.types.js";

interface UserRow {
    id: number;
    cedula: string;
    nombre: string;
    segundo_nombre: string | null;
    apellido: string;
    role: CreatedSupervisorUser["role"];
    estado: boolean;
}

interface DocumentRow {
    id: number;
    tipo_documento: CreatedSupervisorUserDocument["tipoDocumento"];
    s3_ruta: string;
    nombre_archivo: string;
}

interface UserDetailRow extends UserRow {
    fecha_expedicion_documento: string | null;
    ciudad_expedicion_documento: string | null;
    eps: string | null;
    telefono: string | null;
    categoria_licencia: string | null;
    vencimiento_licencia: string | null;
    created_at: string | null;
}

const mapUser = (row: UserRow): CreatedSupervisorUser => ({
    id: row.id,
    cedula: row.cedula,
    nombre: row.nombre,
    segundoNombre: row.segundo_nombre,
    apellido: row.apellido,
    role: row.role,
    estado: row.estado,
});

export class SupervisorUsersRepository {
    static async findMany(input: SupervisorUserListInput): Promise<SupervisorUserListResult> {
        const values: unknown[] = [];
        const conditions: string[] = [];

        if (input.search) {
            values.push(`%${input.search}%`);
            conditions.push(`(
                u.cedula ILIKE $${values.length}
                OR CONCAT_WS(' ', u.nombre, u.segundo_nombre, u.apellido) ILIKE $${values.length}
            )`);
        }
        if (input.role) {
            values.push(input.role);
            conditions.push(`u.role = $${values.length}`);
        }
        if (input.estado !== null) {
            values.push(input.estado);
            conditions.push(`u.estado = $${values.length}`);
        }

        const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
        const countResult = await pool.query<{ total: string }>(
            `SELECT COUNT(*)::text AS total FROM usuario u ${where}`,
            values
        );

        const offset = (input.page - 1) * input.pageSize;
        const listValues = [...values, input.pageSize, offset];
        const result = await pool.query<UserRow>(
            `SELECT u.id, u.cedula, u.nombre, u.segundo_nombre, u.apellido, u.role, u.estado
             FROM usuario u
             ${where}
             ORDER BY u.created_at DESC NULLS LAST, u.id DESC
             LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
            listValues
        );

        return {
            items: result.rows.map(mapUser),
            total: Number(countResult.rows[0]?.total ?? 0),
            page: input.page,
            pageSize: input.pageSize,
        };
    }

    static async findById(userId: number): Promise<SupervisorUserDetail | null> {
        const userResult = await pool.query<UserDetailRow>(
            `SELECT id, cedula, nombre, segundo_nombre, apellido,
                    fecha_expedicion_documento::text,
                    ciudad_expedicion_documento, eps, telefono,
                    categoria_licencia, vencimiento_licencia::text,
                    role, estado, created_at::text
             FROM usuario
             WHERE id = $1
             LIMIT 1`,
            [userId]
        );
        const row = userResult.rows[0];
        if (!row) return null;

        const documentsResult = await pool.query<DocumentRow>(
            `SELECT DISTINCT ON (tipo_documento)
                    id, tipo_documento, s3_ruta, nombre_archivo
             FROM documentos_usuarios
             WHERE usuario_id = $1
             ORDER BY tipo_documento, created_at DESC NULLS LAST, id DESC`,
            [userId]
        );

        return {
            ...mapUser(row),
            fechaExpedicionDocumento: row.fecha_expedicion_documento,
            ciudadExpedicionDocumento: row.ciudad_expedicion_documento,
            eps: row.eps,
            telefono: row.telefono,
            categoriaLicencia: row.categoria_licencia,
            vencimientoLicencia: row.vencimiento_licencia,
            createdAt: row.created_at,
            documents: documentsResult.rows.map((document) => ({
                id: document.id,
                tipoDocumento: document.tipo_documento,
                objectKey: document.s3_ruta,
                nombreArchivo: document.nombre_archivo,
            })),
        };
    }

    static async existsByCedula(cedula: string): Promise<boolean> {
        const result = await pool.query(
            "SELECT 1 FROM usuario WHERE cedula = $1 LIMIT 1",
            [cedula]
        );

        return Boolean(result.rowCount);
    }

    static async create(
        input: CreateSupervisorUserInput,
        passwordHash: string
    ): Promise<CreatedSupervisorUser> {
        const result = await pool.query<UserRow>(
            `INSERT INTO usuario (
                cedula,
                nombre,
                segundo_nombre,
                apellido,
                fecha_expedicion_documento,
                ciudad_expedicion_documento,
                eps,
                telefono,
                categoria_licencia,
                vencimiento_licencia,
                role,
                password,
                estado,
                created_at
             )
             VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8,
                $9, $10, $11, $12, TRUE, CURRENT_TIMESTAMP
             )
             RETURNING id, cedula, nombre, segundo_nombre, apellido, role, estado`,
            [
                input.cedula,
                input.nombre,
                input.segundoNombre,
                input.apellido,
                input.fechaExpedicionDocumento,
                input.ciudadExpedicionDocumento,
                input.eps,
                input.telefono,
                input.categoriaLicencia,
                input.vencimientoLicencia,
                input.role,
                passwordHash,
            ]
        );

        const row = result.rows[0];
        if (!row) throw new Error("USER_NOT_CREATED");
        return mapUser(row);
    }

    static async existsById(userId: number): Promise<boolean> {
        const result = await pool.query(
            "SELECT 1 FROM usuario WHERE id = $1 LIMIT 1",
            [userId]
        );

        return Boolean(result.rowCount);
    }

    static async existsByCedulaExcept(cedula: string, userId: number): Promise<boolean> {
        const result = await pool.query(
            "SELECT 1 FROM usuario WHERE cedula = $1 AND id <> $2 LIMIT 1",
            [cedula, userId]
        );
        return Boolean(result.rowCount);
    }

    static async update(
        userId: number,
        input: UpdateSupervisorUserInput
    ): Promise<CreatedSupervisorUser | null> {
        const result = await pool.query<UserRow>(
            `UPDATE usuario SET
                cedula = $2,
                nombre = $3,
                segundo_nombre = $4,
                apellido = $5,
                fecha_expedicion_documento = $6,
                ciudad_expedicion_documento = $7,
                eps = $8,
                telefono = $9,
                categoria_licencia = $10,
                vencimiento_licencia = $11,
                role = $12
             WHERE id = $1
             RETURNING id, cedula, nombre, segundo_nombre, apellido, role, estado`,
            [
                userId, input.cedula, input.nombre, input.segundoNombre,
                input.apellido, input.fechaExpedicionDocumento,
                input.ciudadExpedicionDocumento, input.eps, input.telefono,
                input.categoriaLicencia, input.vencimientoLicencia, input.role,
            ]
        );
        return result.rows[0] ? mapUser(result.rows[0]) : null;
    }

    static async updateStatus(userId: number, estado: boolean): Promise<CreatedSupervisorUser | null> {
        const result = await pool.query<UserRow>(
            `UPDATE usuario SET estado = $2
             WHERE id = $1
             RETURNING id, cedula, nombre, segundo_nombre, apellido, role, estado`,
            [userId, estado]
        );
        return result.rows[0] ? mapUser(result.rows[0]) : null;
    }

    static async createDocument(
        userId: number,
        input: CreateSupervisorUserDocumentInput
    ): Promise<CreatedSupervisorUserDocument> {
        const result = await pool.query<DocumentRow>(
            `INSERT INTO documentos_usuarios (
                usuario_id,
                tipo_documento,
                s3_ruta,
                nombre_archivo,
                created_at
             )
             VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
             RETURNING id, tipo_documento, s3_ruta, nombre_archivo`,
            [
                userId,
                input.tipoDocumento,
                input.objectKey,
                input.objectKey.split("/").at(-1),
            ]
        );

        const row = result.rows[0];
        if (!row) throw new Error("DOCUMENT_NOT_CREATED");

        return {
            id: row.id,
            tipoDocumento: row.tipo_documento,
            objectKey: row.s3_ruta,
            nombreArchivo: row.nombre_archivo,
        };
    }

    static async replaceDocument(
        userId: number,
        input: CreateSupervisorUserDocumentInput
    ): Promise<{ document: CreatedSupervisorUserDocument; previousObjectKeys: string[] }> {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            const previous = await client.query<{ s3_ruta: string }>(
                `SELECT s3_ruta FROM documentos_usuarios
                 WHERE usuario_id = $1 AND tipo_documento = $2
                 FOR UPDATE`,
                [userId, input.tipoDocumento]
            );

            await client.query(
                `DELETE FROM documentos_usuarios
                 WHERE usuario_id = $1 AND tipo_documento = $2`,
                [userId, input.tipoDocumento]
            );

            const inserted = await client.query<DocumentRow>(
                `INSERT INTO documentos_usuarios (
                    usuario_id, tipo_documento, s3_ruta, nombre_archivo, created_at
                 ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
                 RETURNING id, tipo_documento, s3_ruta, nombre_archivo`,
                [userId, input.tipoDocumento, input.objectKey, input.objectKey.split("/").at(-1)]
            );
            await client.query("COMMIT");

            const row = inserted.rows[0];
            if (!row) throw new Error("DOCUMENT_NOT_CREATED");
            return {
                document: {
                    id: row.id,
                    tipoDocumento: row.tipo_documento,
                    objectKey: row.s3_ruta,
                    nombreArchivo: row.nombre_archivo,
                },
                previousObjectKeys: previous.rows
                    .map((item) => item.s3_ruta)
                    .filter((key) => key !== input.objectKey),
            };
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }
}
