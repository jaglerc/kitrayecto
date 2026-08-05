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
    mileage: number;
    answers: CreateInspectionAnswer[];
}

export interface CreatedInspection {
    id: number;
    status: InspectionStatus;
    mileage: number;
    createdAt: string;
}

export interface TodayInspectionAnswer {
    id: number;
    title: string;
    status: InspectionStatus;
    observation: string | null;
}

export interface TodayInspection {
    id: number;
    mileage: number | null;
    createdAt: string;
    vehicle: {
        id: number;
        type: string;
        plate: string;
    };
    answers: TodayInspectionAnswer[];
}

export interface InspectionDetailAnswer extends TodayInspectionAnswer {
    description: string;
}

export interface InspectionDetail extends Omit<TodayInspection, "answers"> {
    operation: InspectionOperation;
    status: InspectionStatus;
    answers: InspectionDetailAnswer[];
}
