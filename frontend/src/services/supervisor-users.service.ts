export type SupervisorUserRole = "Conductor" | "Supervisor" | "Administrador";

export type SupervisorDocumentType =
    | "Foto"
    | "Licencia_conduccion"
    | "Cedula"
    | "Certificado_manipulacion_alimentos";

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
    role: SupervisorUserRole;
    password: string;
}

export interface CreatedSupervisorUser {
    id: number;
    cedula: string;
    nombre: string;
    segundoNombre: string | null;
    apellido: string;
    role: SupervisorUserRole;
    estado: boolean;
}

export interface CreateSupervisorUserDocumentInput {
    tipoDocumento: SupervisorDocumentType;
    objectKey: string;
}

export interface SupervisorUserDocument {
    id: number;
    tipoDocumento: SupervisorDocumentType;
    objectKey: string;
    nombreArchivo: string;
}

export interface SupervisorUserDetail extends CreatedSupervisorUser {
    fechaExpedicionDocumento: string | null;
    ciudadExpedicionDocumento: string | null;
    eps: string | null;
    telefono: string | null;
    categoriaLicencia: string | null;
    vencimientoLicencia: string | null;
    createdAt: string | null;
    documents: SupervisorUserDocument[];
}

export interface SupervisorUserListResult {
    items: CreatedSupervisorUser[];
    total: number;
    page: number;
    pageSize: number;
}

export interface ListSupervisorUsersInput {
    search?: string;
    role?: SupervisorUserRole | "";
    estado?: "" | "true" | "false";
    page?: number;
    pageSize?: number;
}

export type UpdateSupervisorUserInput = Omit<CreateSupervisorUserInput, "password">;

const API_URL = (
    import.meta.env.VITE_API_URL ?? "http://localhost:3000"
).replace(/\/+$/, "");

const headers = (): Record<string, string> => {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

const errorMessage = async (response: Response, fallback: string): Promise<string> => {
    try {
        const body = await response.json() as { message?: string };
        return body.message ?? fallback;
    } catch {
        return fallback;
    }
};

export const supervisorUsersService = {
    async list(input: ListSupervisorUsersInput = {}): Promise<SupervisorUserListResult> {
        const params = new URLSearchParams();
        if (input.search) params.set("search", input.search);
        if (input.role) params.set("role", input.role);
        if (input.estado) params.set("estado", input.estado);
        params.set("page", String(input.page ?? 1));
        params.set("pageSize", String(input.pageSize ?? 12));
        const response = await fetch(`${API_URL}/supervisor/users?${params}`, {
            headers: headers(),
        });
        if (!response.ok) throw new Error(await errorMessage(response, "No fue posible consultar los usuarios"));
        return response.json();
    },

    async findById(userId: number): Promise<SupervisorUserDetail> {
        const response = await fetch(`${API_URL}/supervisor/users/${userId}`, {
            headers: headers(),
        });
        if (!response.ok) throw new Error(await errorMessage(response, "No fue posible consultar el usuario"));
        return response.json();
    },

    async create(input: CreateSupervisorUserInput): Promise<CreatedSupervisorUser> {
        const response = await fetch(`${API_URL}/supervisor/users`, {
            method: "POST",
            headers: headers(),
            body: JSON.stringify(input),
        });

        if (!response.ok) {
            throw new Error(await errorMessage(response, "No fue posible crear el usuario"));
        }

        return response.json();
    },

    async createDocument(
        userId: number,
        input: CreateSupervisorUserDocumentInput
    ): Promise<void> {
        const response = await fetch(`${API_URL}/supervisor/users/${userId}/documents`, {
            method: "PUT",
            headers: headers(),
            body: JSON.stringify(input),
        });

        if (!response.ok) {
            throw new Error(
                await errorMessage(response, "No fue posible asociar el documento")
            );
        }
    },

    async update(userId: number, input: UpdateSupervisorUserInput): Promise<CreatedSupervisorUser> {
        const response = await fetch(`${API_URL}/supervisor/users/${userId}`, {
            method: "PATCH",
            headers: headers(),
            body: JSON.stringify(input),
        });
        if (!response.ok) throw new Error(await errorMessage(response, "No fue posible actualizar el usuario"));
        return response.json();
    },

    async updateStatus(userId: number, estado: boolean): Promise<CreatedSupervisorUser> {
        const response = await fetch(`${API_URL}/supervisor/users/${userId}/status`, {
            method: "PATCH",
            headers: headers(),
            body: JSON.stringify({ estado }),
        });
        if (!response.ok) throw new Error(await errorMessage(response, "No fue posible cambiar el estado"));
        return response.json();
    },
};
