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
    evidenceFiles: InspectionEvidenceFile[];
}

export interface InspectionEvidenceFile {
    id: string;
    file: File;
    previewUrl: string;
}

export interface UploadedInspectionEvidence {
    objectKey: string;
    contentType: string;
    size: number;
}

export interface CreateInspectionRequest {
    vehicleId: number;
    operation: "Check_in" | "Check_out";
    mileage: number;
    answers: Array<{
        templateId: number;
        status: InspectionStatus;
        observation: string;
        evidences: UploadedInspectionEvidence[];
    }>;
}

export interface CreatedInspection {
    id: number;
    status: InspectionStatus;
    mileage: number;
    createdAt: string;
}

export interface TodayInspection {
    id: number;
    mileage: number | null;
    createdAt: string;
    vehicle: {
        id: number;
        type: VehicleType;
        plate: string;
    };
    answers: Array<{
        id: number;
        title: string;
        status: InspectionStatus;
        observation: string | null;
    }>;
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
    async findToday(): Promise<TodayInspection | null> {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_URL}/inspections/today`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!response.ok) {
            throw new Error(await getErrorMessage(response, "No fue posible consultar el resumen de hoy"));
        }

        return response.json();
    },

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
