export interface SupervisorCostsQuery {
    month: string;
    vehicleId: number | null;
}

export type ExpenseCategory = "Combustible" | "Mantenimiento";

export interface SupervisorExpense {
    id: string;
    vehicleId: number;
    plate: string;
    occurredAt: string;
    category: ExpenseCategory;
    description: string;
    amount: number;
}

export interface VehicleCostDocuments {
    vehicleId: number;
    plate: string;
    soat: {
        number: string;
        validFrom: string | null;
        expiresAt: string | null;
        amount: number | null;
    } | null;
    technicalInspection: {
        number: string;
        validFrom: string | null;
        expiresAt: string | null;
        amount: number | null;
    } | null;
}

export interface SupervisorCostsResult {
    month: string;
    vehicleId: number | null;
    totals: {
        fuel: number;
        maintenance: number;
        total: number;
        records: number;
    };
    expenses: SupervisorExpense[];
    vehicles: Array<{ id: number; plate: string }>;
    documents: VehicleCostDocuments[];
}
