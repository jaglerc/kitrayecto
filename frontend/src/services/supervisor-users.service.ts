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
            method: "POST",
            headers: headers(),
            body: JSON.stringify(input),
        });

        if (!response.ok) {
            throw new Error(
                await errorMessage(response, "No fue posible asociar el documento")
            );
        }
    },
};
