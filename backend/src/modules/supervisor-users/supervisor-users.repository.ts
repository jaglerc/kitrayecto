import { pool } from "../../database/database.js";
import type {
    CreatedSupervisorUser,
    CreatedSupervisorUserDocument,
    CreateSupervisorUserDocumentInput,
    CreateSupervisorUserInput,
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
}
