import type { ConfirmedUpload } from "./storage.service";

export type MaintenanceServiceType = "Cambio de aceite" | "Fumigación" | "Otro";
export type MaintenanceClass = "Preventivo" | "Correctivo" | "Emergencia";
export type MaintenanceStatus = "Programado" | "Realizado";

export interface CreateMaintenanceInput {
    serviceType: MaintenanceServiceType;
    serviceClass: MaintenanceClass;
    category: string;
    serviceDate: string;
    mileage: number | null;
    provider: string;
    description: string;
    cost: number;
    nextServiceDate: string | null;
    nextServiceMileage: number | null;
    status: MaintenanceStatus;
    observations: string;
}

export interface CreatedMaintenance {
    id: number;
    vehicleId: number;
    createdAt: string;
}

const API_URL = (
    import.meta.env.VITE_API_URL ?? "http://localhost:3000"
).replace(/\/+$/, "");

const headers = (): HeadersInit => {
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

export const maintenanceService = {
    async create(input: CreateMaintenanceInput): Promise<CreatedMaintenance> {
        const response = await fetch(`${API_URL}/maintenance`, {
            method: "POST",
            headers: headers(),
            body: JSON.stringify(input),
        });

        if (!response.ok) {
            throw new Error(await errorMessage(response, "No fue posible registrar el mantenimiento"));
        }

        return response.json();
    },

    async attachEvidence(id: number, evidence: ConfirmedUpload): Promise<void> {
        const response = await fetch(`${API_URL}/maintenance/${id}/evidence`, {
            method: "PATCH",
            headers: headers(),
            body: JSON.stringify(evidence),
        });

        if (!response.ok) {
            throw new Error(await errorMessage(response, "No fue posible adjuntar el comprobante"));
        }
    },
};
