import type { VehicleType } from "../components/ui/VehicleTypeStep";

export interface InspectionTemplate {
    id: number;
    vehicleType: VehicleType;
    title: string;
    description: string;
}

export type InspectionStatus = "Sin novedad" | "Con novedad" | "Crítica";

export interface InspectionAnswer {
    status: InspectionStatus;
    observation: string;
}

interface CreateInspectionRequest {
    vehicleId: number;
    operation: "Check_in" | "Check_out";
    answers: Array<InspectionAnswer & { templateId: number }>;
}

export interface CreatedInspection {
    id: number;
    status: InspectionStatus;
    createdAt: string;
}

const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:3000").replace(/\/+$/, "");

const getErrorMessage = async (response: Response, fallback: string) => {
    try {
        const body = await response.json() as { message?: string };
        return body.message ?? fallback;
    } catch {
        return fallback;
    }
};

export const inspectionService = {
    async findTemplatesByVehicleType(vehicleType: VehicleType): Promise<InspectionTemplate[]> {
        const token = localStorage.getItem("token");
        const response = await fetch(
            `${API_URL}/inspection-templates?type=${encodeURIComponent(vehicleType)}`,
            { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );

        if (!response.ok) {
            throw new Error(await getErrorMessage(response, "No fue posible consultar el checklist"));
        }
        return response.json();
    },

    async create(input: CreateInspectionRequest): Promise<CreatedInspection> {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_URL}/inspections`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(input),
        });

        if (!response.ok) {
            throw new Error(await getErrorMessage(response, "No fue posible registrar el checklist"));
        }
        return response.json();
    },
};
