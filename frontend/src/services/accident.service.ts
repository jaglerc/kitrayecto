import type { VehicleType } from "../components/ui/VehicleTypeStep";
import type { ConfirmedUpload } from "./storage.service";

export interface PendingAccident {
    id: number;
    reportedAt: string;
    vehicle: { id: number; type: VehicleType; plate: string };
}

export interface AccidentDetail extends PendingAccident {
    driverName: string;
    driverDocument: string;
    driverPhone: string | null;
    driverEps: string | null;
}

export interface CompleteAccidentRequest {
    accidentTime: string;
    location: string;
    description: string;
    driverInjured: boolean;
    vehicleDamaged: boolean;
    thirdPartiesInvolved: boolean;
    evidences: ConfirmedUpload[];
}

const API_URL = (
    import.meta.env.VITE_API_URL ?? "http://localhost:3000"
).replace(/\/+$/, "");

const headers = (idempotencyKey?: string): HeadersInit => {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    };
};

const getErrorMessage = async (response: Response, fallback: string): Promise<string> => {
    try {
        const body = await response.json() as { message?: string };
        return body.message ?? fallback;
    } catch {
        return fallback;
    }
};

export const accidentService = {
    async report(idempotencyKey?: string): Promise<PendingAccident> {
        const response = await fetch(`${API_URL}/accidents/report`, {
            method: "POST",
            headers: headers(idempotencyKey),
        });

        if (!response.ok) {
            throw new Error(await getErrorMessage(response, "No fue posible reportar el accidente"));
        }

        return response.json();
    },

    async findPending(): Promise<PendingAccident[]> {
        const response = await fetch(`${API_URL}/accidents/pending`, {
            headers: headers(),
        });

        if (!response.ok) {
            throw new Error(await getErrorMessage(response, "No fue posible consultar las notificaciones"));
        }

        return response.json();
    },

    async findById(id: number): Promise<AccidentDetail> {
        const response = await fetch(`${API_URL}/accidents/${id}`, {
            headers: headers(),
        });

        if (!response.ok) {
            throw new Error(await getErrorMessage(response, "No fue posible consultar el accidente"));
        }

        return response.json();
    },

    async complete(
        id: number,
        input: CompleteAccidentRequest,
        idempotencyKey?: string
    ): Promise<void> {
        const response = await fetch(`${API_URL}/accidents/${id}/complete`, {
            method: "PATCH",
            headers: headers(idempotencyKey),
            body: JSON.stringify(input),
        });

        if (!response.ok) {
            throw new Error(await getErrorMessage(response, "No fue posible enviar el formulario"));
        }
    },
};
