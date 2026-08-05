import type { ConfirmedUpload } from "./storage.service";
import type { VehicleType } from "../components/ui/VehicleTypeStep";

export interface PendingAccident {
    id: number;
    reportedAt: string;
    vehicle: { id: number; type: VehicleType; plate: string };
}
export interface AccidentDetail extends PendingAccident {
    driverName: string;
    driverDocument: string;
    driverPhone: string | null;
    driverEps: string | null;
}
export interface CompleteAccidentRequest {
    accidentTime: string; location: string; description: string;
    driverInjured: boolean; vehicleDamaged: boolean; thirdPartiesInvolved: boolean;
    evidences: ConfirmedUpload[];
}

const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:3000").replace(/\/+$/, "");
const headers = () => { const token = localStorage.getItem("token"); return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }; };
const message = async (response: Response, fallback: string) => { try { return ((await response.json()) as { message?: string }).message ?? fallback; } catch { return fallback; } };

export const accidentService = {
    async report(): Promise<PendingAccident> { const response = await fetch(`${API_URL}/accidents/report`, { method: "POST", headers: headers() }); if (!response.ok) throw new Error(await message(response, "No fue posible reportar el accidente")); return response.json(); },
    async findPending(): Promise<PendingAccident[]> { const response = await fetch(`${API_URL}/accidents/pending`, { headers: headers() }); if (!response.ok) throw new Error(await message(response, "No fue posible consultar las notificaciones")); return response.json(); },
    async findById(id: number): Promise<AccidentDetail> { const response = await fetch(`${API_URL}/accidents/${id}`, { headers: headers() }); if (!response.ok) throw new Error(await message(response, "No fue posible consultar el accidente")); return response.json(); },
    async complete(id: number, input: CompleteAccidentRequest): Promise<void> { const response = await fetch(`${API_URL}/accidents/${id}/complete`, { method: "PATCH", headers: headers(), body: JSON.stringify(input) }); if (!response.ok) throw new Error(await message(response, "No fue posible enviar el formulario")); },
};
