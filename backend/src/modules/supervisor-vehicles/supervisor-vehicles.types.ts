import type { DatabaseVehicleType, VehicleType } from "../vehicles/vehicles.types.js";

export type OilAlertStatus = "disabled" | "pending" | "ok" | "upcoming" | "overdue";
export type FumigationAlertStatus = "not_required" | "pending" | "ok" | "upcoming" | "overdue";

export interface SupervisorVehicleInput {
    type: VehicleType;
    databaseType: DatabaseVehicleType;
    plate: string;
    transitLicense: string | null;
    brand: string | null;
    owner: string | null;
    currentMileage: number;
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
    currentMileage: number;
    active: boolean;
    oilStatus: OilAlertStatus;
    oilRemainingKm: number | null;
    nextOilChangeKm: number | null;
    fumigationStatus: FumigationAlertStatus;
    nextFumigationDate: string | null;
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
}

export interface SupervisorVehicleListResult {
    items: SupervisorVehicleSummary[];
    total: number;
    page: number;
    pageSize: number;
}
