export interface AccidentEvidenceInput {
    objectKey: string;
    contentType: string;
    size: number;
}

export interface CompleteAccidentInput {
    accidentTime: string;
    location: string;
    description: string;
    driverInjured: boolean;
    vehicleDamaged: boolean;
    thirdPartiesInvolved: boolean;
    evidences: AccidentEvidenceInput[];
}

export interface PendingAccident {
    id: number;
    reportedAt: string;
    vehicle: { id: number; type: string; plate: string };
}

export interface AccidentDetail extends PendingAccident {
    driverName: string;
}
