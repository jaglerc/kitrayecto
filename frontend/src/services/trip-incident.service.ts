import type { ConfirmedUpload } from "./storage.service";

export type TripIncidentType = "Novedad" | "Critica";
export interface CreateTripIncidentRequest { type: TripIncidentType; description: string; evidences: ConfirmedUpload[]; }
const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:3000").replace(/\/+$/, "");

export const tripIncidentService = {
    async create(input: CreateTripIncidentRequest): Promise<{ id: number; tripId: number; type: TripIncidentType; registeredAt: string }> {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_URL}/trip-incidents`, { method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(input) });
        if (!response.ok) {
            let message = "No fue posible registrar la novedad";
            try { message = ((await response.json()) as { message?: string }).message ?? message; } catch { /* sin JSON */ }
            throw new Error(message);
        }
        return response.json();
    },
};
