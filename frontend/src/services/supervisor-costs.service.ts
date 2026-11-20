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

export interface CostDocument {
    number: string;
    validFrom: string | null;
    expiresAt: string | null;
    amount: number | null;
}

export interface VehicleCostDocuments {
    vehicleId: number;
    plate: string;
    soat: CostDocument | null;
    technicalInspection: CostDocument | null;
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

const API_URL = (
    import.meta.env.VITE_API_URL ?? "http://localhost:3000"
).replace(/\/+$/, "");

const getErrorMessage = async (response: Response): Promise<string> => {
    try {
        const body = await response.json() as { message?: string };
        return body.message ?? "No fue posible consultar los costos";
    } catch {
        return "No fue posible consultar los costos";
    }
};

export const supervisorCostsService = {
    async find(month: string, vehicleId: number | null): Promise<SupervisorCostsResult> {
        const parameters = new URLSearchParams({ month });
        if (vehicleId !== null) parameters.set("vehicleId", String(vehicleId));

        const token = localStorage.getItem("token");
        const response = await fetch(`${API_URL}/supervisor/costs?${parameters}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!response.ok) throw new Error(await getErrorMessage(response));
        return response.json();
    },
};
