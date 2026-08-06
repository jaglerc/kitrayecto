import type { DatabaseVehicleType, VehicleType } from "../vehicles/vehicles.types.js";

export type OilAlertStatus = "disabled" | "pending" | "ok" | "upcoming" | "overdue";
export type FumigationAlertStatus = "not_required" | "pending" | "ok" | "upcoming" | "overdue";
export type DocumentAlertStatus = "incomplete" | "valid" | "upcoming" | "expired";

export interface VehicleStoredDocument {
    id: number;
    objectKey: string;
    fileName: string;
    createdAt: string | null;
    downloadUrl?: string;
}

export interface VehicleInsuranceRecord {
    id: number;
    policyNumber: string;
    policyType: string | null;
    validFrom: string | null;
    expiresAt: string | null;
    price: number | null;
    insurer: string | null;
    status: DocumentAlertStatus;
    document: VehicleStoredDocument | null;
}

export interface VehicleTechnicalInspectionRecord {
    id: number;
    number: string;
    validFrom: string | null;
    expiresAt: string | null;
    price: number | null;
    status: DocumentAlertStatus;
    document: VehicleStoredDocument | null;
}

export interface VehicleLegalDocumentInput {
    number: string;
    type?: string | null;
    validFrom: string | null;
    expiresAt: string;
    price?: number | null;
    provider?: string | null;
    objectKey: string;
    fileName: string;
}

export interface SupervisorVehicleInput {
    type: VehicleType;
    databaseType: DatabaseVehicleType;
    plate: string;
    transitLicense: string | null;
    brand: string | null;
    owner: string | null;
    currentMileage: number | null;
    oilControlEnabled: boolean;
    oilIntervalKm: number | null;
    oilWarningMarginKm: number | null;
    oilReferenceMileage: number | null;
    fumigationRequired: boolean;
    fumigationFrequencyDays: number | null;
    lastFumigationDate: string | null;
}

export interface SupervisorVehicleListInput {
    search: string;
    type: VehicleType | null;
    active: boolean | null;
    page: number;
    pageSize: number;
}

export interface SupervisorVehicleSummary {
    id: number;
    type: VehicleType;
    plate: string;
    brand: string | null;
    currentMileage: number | null;
    active: boolean;
    oilStatus: OilAlertStatus;
    oilRemainingKm: number | null;
    nextOilChangeKm: number | null;
    fumigationStatus: FumigationAlertStatus;
    nextFumigationDate: string | null;
    documentationStatus: DocumentAlertStatus;
    availableForJourney: boolean;
}

export interface SupervisorVehicleDetail extends SupervisorVehicleSummary {
    transitLicense: string | null;
    owner: string | null;
    createdAt: string | null;
    oilControlEnabled: boolean;
    oilIntervalKm: number | null;
    oilWarningMarginKm: number | null;
    oilReferenceMileage: number | null;
    fumigationRequired: boolean;
    fumigationFrequencyDays: number | null;
    lastFumigationDate: string | null;
    insurances: VehicleInsuranceRecord[];
    technicalInspections: VehicleTechnicalInspectionRecord[];
}

export interface SupervisorVehicleListResult {
    items: SupervisorVehicleSummary[];
    total: number;
    page: number;
    pageSize: number;
}
