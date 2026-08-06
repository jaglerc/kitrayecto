export type VehicleType = "camioneta" | "motocicleta" | "motocarguero" | "carro";
export type OilStatus = "disabled" | "pending" | "ok" | "upcoming" | "overdue";
export type FumigationStatus = "not_required" | "pending" | "ok" | "upcoming" | "overdue";
export type DocumentStatus = "incomplete" | "valid" | "upcoming" | "expired";

export interface VehicleDocument { id: number; objectKey: string; fileName: string; createdAt: string | null; downloadUrl?: string; }
export interface VehicleInsurance { id: number; policyNumber: string; policyType: string | null; validFrom: string | null; expiresAt: string | null; price: number | null; insurer: string | null; status: DocumentStatus; document: VehicleDocument | null; }
export interface VehicleTechnicalInspection { id: number; number: string; validFrom: string | null; expiresAt: string | null; price: number | null; status: DocumentStatus; document: VehicleDocument | null; }
export interface VehicleLegalDocumentInput { number: string; type?: string | null; validFrom: string | null; expiresAt: string; price?: number | null; provider?: string | null; objectKey: string; fileName: string; }

export interface SupervisorVehicleInput {
    type: VehicleType;
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

export interface SupervisorVehicle extends SupervisorVehicleInput {
    id: number;
    active: boolean;
    createdAt: string | null;
    oilStatus: OilStatus;
    oilRemainingKm: number | null;
    nextOilChangeKm: number | null;
    fumigationStatus: FumigationStatus;
    nextFumigationDate: string | null;
    documentationStatus: DocumentStatus;
    availableForJourney: boolean;
    insurances: VehicleInsurance[];
    technicalInspections: VehicleTechnicalInspection[];
}

export interface VehicleListResult { items: SupervisorVehicle[]; total: number; page: number; pageSize: number; message: string; }

const API = (import.meta.env.VITE_API_URL ?? "http://localhost:3000").replace(/\/+$/, "");
const headers = (): HeadersInit => ({ "Content-Type": "application/json", ...(localStorage.getItem("token") ? { Authorization: `Bearer ${localStorage.getItem("token")}` } : {}) });
const message = async (response: Response, fallback: string): Promise<string> => { try { return ((await response.json()) as { message?: string }).message ?? fallback; } catch { return fallback; } };
export const supervisorVehiclesService = {
    async list(input: { search?: string; type?: VehicleType | ""; active?: "" | "true" | "false"; page?: number } = {}): Promise<VehicleListResult> {
        const query = new URLSearchParams({ page: String(input.page ?? 1), pageSize: "12" });
        if (input.search) query.set("search", input.search);
        if (input.type) query.set("type", input.type);
        if (input.active) query.set("active", input.active);
        const response = await fetch(`${API}/supervisor/vehicles?${query}`, { headers: headers() });
        if (!response.ok) throw new Error(await message(response, "No fue posible consultar los vehículos"));
        return response.json();
    },
    async findById(id: number): Promise<SupervisorVehicle> {
        const response = await fetch(`${API}/supervisor/vehicles/${id}`, { headers: headers() });
        if (!response.ok) throw new Error(await message(response, "No fue posible consultar el vehículo"));
        return response.json();
    },
    async create(input: SupervisorVehicleInput): Promise<SupervisorVehicle> {
        const response = await fetch(`${API}/supervisor/vehicles`, { method: "POST", headers: headers(), body: JSON.stringify(input) });
        if (!response.ok) throw new Error(await message(response, "No fue posible registrar el vehículo"));
        return response.json();
    },
    async update(id: number, input: SupervisorVehicleInput): Promise<SupervisorVehicle> {
        const response = await fetch(`${API}/supervisor/vehicles/${id}`, { method: "PATCH", headers: headers(), body: JSON.stringify(input) });
        if (!response.ok) throw new Error(await message(response, "No fue posible actualizar el vehículo"));
        return response.json();
    },
    async updateStatus(id: number, active: boolean): Promise<SupervisorVehicle> {
        const response = await fetch(`${API}/supervisor/vehicles/${id}/status`, { method: "PATCH", headers: headers(), body: JSON.stringify({ active }) });
        if (!response.ok) throw new Error(await message(response, "No fue posible cambiar el estado"));
        return response.json();
    },
    async addInsurance(id: number, input: VehicleLegalDocumentInput): Promise<SupervisorVehicle> {
        const response = await fetch(`${API}/supervisor/vehicles/${id}/insurance`, { method: "POST", headers: headers(), body: JSON.stringify(input) });
        if (!response.ok) throw new Error(await message(response, "No fue posible guardar el seguro"));
        return response.json();
    },
    async addTechnicalInspection(id: number, input: VehicleLegalDocumentInput): Promise<SupervisorVehicle> {
        const response = await fetch(`${API}/supervisor/vehicles/${id}/technical-inspections`, { method: "POST", headers: headers(), body: JSON.stringify(input) });
        if (!response.ok) throw new Error(await message(response, "No fue posible guardar la revisión técnico-mecánica"));
        return response.json();
    },
};
