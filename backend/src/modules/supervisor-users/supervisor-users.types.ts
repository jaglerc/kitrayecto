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
}

export interface CreatedSupervisorUserDocument {
    id: number;
    tipoDocumento: SupervisorDocumentType;
    objectKey: string;
    nombreArchivo: string;
    downloadUrl?: string;
}

export interface SupervisorUserDetail extends CreatedSupervisorUser {
    fechaExpedicionDocumento: string | null;
    ciudadExpedicionDocumento: string | null;
    eps: string | null;
    telefono: string | null;
    categoriaLicencia: string | null;
    vencimientoLicencia: string | null;
    createdAt: string | null;
    documents: CreatedSupervisorUserDocument[];
}

export interface UpdateSupervisorUserInput {
    cedula: string;
    nombre: string;
    segundoNombre: string | null;
    apellido: string;
    fechaExpedicionDocumento: string | null;
    ciudadExpedicionDocumento: string | null;
    eps: string | null;
    telefono: string | null;
    categoriaLicencia: string | null;
    vencimientoLicencia: string | null;
    role: UserRole;
}

export interface SupervisorUserListInput {
    search: string;
    role: UserRole | null;
    estado: boolean | null;
    page: number;
    pageSize: number;
}

export interface SupervisorUserListResult {
    items: CreatedSupervisorUser[];
    total: number;
    page: number;
    pageSize: number;
}
