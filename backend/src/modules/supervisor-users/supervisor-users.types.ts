import type { UserRole } from "../auth/auth.types.js";

export const supervisorDocumentTypes = [
    "Foto",
    "Licencia_conduccion",
    "Cedula",
    "Certificado_manipulacion_alimentos",
] as const;

export type SupervisorDocumentType = typeof supervisorDocumentTypes[number];

export interface CreateSupervisorUserInput {
    cedula: string;
    nombre: string;
    segundoNombre: string | null;
    apellido: string;
    fechaExpedicionDocumento: string | null;
    ciudadExpedicionDocumento: string | null;
    eps: string | null;
    telefono: string | null;
    requiereManipulacionAlimentos: boolean;
    categoriaLicencia: string | null;
    vencimientoLicencia: string | null;
    role: UserRole;
    password: string;
}

export interface CreatedSupervisorUser {
    id: number;
    cedula: string;
    nombre: string;
    segundoNombre: string | null;
    apellido: string;
    role: UserRole;
    estado: boolean;
}

export interface CreateSupervisorUserDocumentInput {
    tipoDocumento: SupervisorDocumentType;
    objectKey: string;
    fechaVigencia: string | null;
    fechaVencimiento: string | null;
}

export interface CreatedSupervisorUserDocument {
    id: number;
    tipoDocumento: SupervisorDocumentType;
    objectKey: string;
    nombreArchivo: string;
}
