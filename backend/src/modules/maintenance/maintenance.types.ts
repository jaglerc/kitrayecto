export type MaintenanceServiceType = "Cambio de aceite" | "Fumigación" | "Otro";
export type MaintenanceClass = "Preventivo" | "Correctivo" | "Emergencia";
export type MaintenanceStatus = "Programado" | "Realizado";

export interface MaintenanceEvidence {
    objectKey: string;
    contentType: string;
    size: number;
}

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

export interface MaintenanceEvidenceInput extends MaintenanceEvidence {
    maintenanceId: number;
}
