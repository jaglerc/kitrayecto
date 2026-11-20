import type { VehicleType } from "../components/ui/VehicleTypeStep";
import {
    getBogotaDateKey,
    getOfflineUserId,
    offlineDatabaseService,
} from "./offline-database.service";

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

export interface InspectionDetail extends Omit<TodayInspection, "answers"> {
    operation: "Check_in" | "Check_out";
    status: InspectionStatus;
    answers: Array<{
        id: number;
        title: string;
        description: string;
        status: InspectionStatus;
        observation: string | null;
        evidences: Array<{
            id: number;
            fileName: string;
            url: string;
        }>;
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
    async findById(inspectionId: number): Promise<InspectionDetail> {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_URL}/inspections/${inspectionId}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!response.ok) {
            throw new Error(await getErrorMessage(response, "No fue posible consultar el checklist"));
        }
        return response.json();
    },

    async findToday(): Promise<TodayInspection | null> {
        const token = localStorage.getItem("token");
        const userId = getOfflineUserId();

        try {
            const response = await fetch(`${API_URL}/inspections/today`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });

            if (!response.ok) {
                throw new Error(await getErrorMessage(response, "No fue posible consultar el resumen de hoy"));
            }

            const inspection = await response.json() as TodayInspection | null;
            if (userId !== null) {
                await offlineDatabaseService.saveCache(userId, "today-inspection", {
                    dayKey: getBogotaDateKey(),
                    inspection,
                });
            }
            return inspection;
        } catch (error) {
            if (userId !== null && error instanceof TypeError) {
                const cached = await offlineDatabaseService.readCache<{
                    dayKey: string;
                    inspection: TodayInspection | null;
                }>(userId, "today-inspection");
                if (cached?.dayKey === getBogotaDateKey()) return cached.inspection;

                const queued = (await offlineDatabaseService.listOperations(userId))
                    .find((operation) => operation.type === "check-in" && operation.status !== "synced");
                if (queued) {
                    const payload = queued.payload as {
                        vehicleId: number;
                        vehicle?: { id: number; type: VehicleType; plate: string } | null;
                        mileage: number;
                        answers: Array<{ templateId: number; status: InspectionStatus; observation: string }>;
                    };
                    if (!payload.vehicle) return null;
                    const templates = await offlineDatabaseService.readCache<InspectionTemplate[]>(
                        userId,
                        `templates:${payload.vehicle.type}`
                    );
                    const titleById = new Map((templates ?? []).map((template) => [template.id, template.title]));
                    return {
                        id: -1,
                        mileage: payload.mileage,
                        createdAt: queued.createdAt,
                        vehicle: payload.vehicle,
                        answers: payload.answers.map((answer, index) => ({
                            id: -(index + 1),
                            title: titleById.get(answer.templateId) ?? "Elemento del checklist",
                            status: answer.status,
                            observation: answer.observation,
                        })),
                    };
                }
            }
            throw error;
        }
    },

    async findTemplatesByVehicleType(vehicleType: VehicleType): Promise<InspectionTemplate[]> {
        const token = localStorage.getItem("token");
        const userId = getOfflineUserId();

        try {
            const response = await fetch(
                `${API_URL}/inspection-templates?type=${encodeURIComponent(vehicleType)}`,
                { headers: token ? { Authorization: `Bearer ${token}` } : {} }
            );

            if (!response.ok) {
                throw new Error(await getErrorMessage(response, "No fue posible consultar el checklist"));
            }

            const templates = await response.json() as InspectionTemplate[];
            if (userId !== null) {
                await offlineDatabaseService.saveCache(userId, `templates:${vehicleType}`, templates);
            }
            return templates;
        } catch (error) {
            if (userId !== null && error instanceof TypeError) {
                const cached = await offlineDatabaseService.readCache<InspectionTemplate[]>(
                    userId,
                    `templates:${vehicleType}`
                );
                if (cached) return cached;
            }
            throw error;
        }
    },

    async create(input: CreateInspectionRequest, idempotencyKey?: string): Promise<CreatedInspection> {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_URL}/inspections`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
            },
            body: JSON.stringify(input),
        });

        if (!response.ok) {
            throw new Error(await getErrorMessage(response, "No fue posible registrar el checklist"));
        }
        return response.json();
    },
};
