export type InspectionOperation = "Check_in" | "Check_out";

export type InspectionStatus = "Sin novedad" | "Con novedad" | "Crítica";

export interface CreateInspectionAnswer {
    templateId: number;
    status: InspectionStatus;
    observation: string;
    evidences: CreateInspectionEvidence[];
}

export interface CreateInspectionEvidence {
    objectKey: string;
    contentType: string;
    size: number;
}

export interface CreateInspectionInput {
    vehicleId: number;
    operation: InspectionOperation;
    answers: CreateInspectionAnswer[];
}

export interface CreatedInspection {
    id: number;
    status: InspectionStatus;
    createdAt: string;
}
