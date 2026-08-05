export type FuelType = "Gasolina" | "ACPM" | "Gas" | "Electrico";

export interface FuelEvidenceInput {
    objectKey: string;
    contentType: string;
    size: number;
}

export interface CreateFuelRecordInput {
    currentMileage: number;
    gallons: number;
    amountPaid: number;
    serviceStation: string;
    fuelType: FuelType;
    observations?: string;
    evidence: FuelEvidenceInput;
}

export interface CreatedFuelRecord {
    id: number;
    tripId: number;
    createdAt: string;
}
