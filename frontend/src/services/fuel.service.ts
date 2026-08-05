import type { ConfirmedUpload } from "./storage.service";

export type FuelType = "Gasolina" | "ACPM" | "Gas" | "Electrico";
export interface CreateFuelRequest {
    currentMileage: number;
    gallons: number;
    amountPaid: number;
    serviceStation: string;
    fuelType: FuelType;
    observations: string;
    evidence: ConfirmedUpload;
}

const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:3000").replace(/\/+$/, "");

export const fuelService = {
    async create(input: CreateFuelRequest): Promise<{ id: number; tripId: number; createdAt: string }> {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_URL}/fuel`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: JSON.stringify(input),
        });
        if (!response.ok) {
            let message = "No fue posible registrar el combustible";
            try { message = ((await response.json()) as { message?: string }).message ?? message; } catch { /* sin JSON */ }
            throw new Error(message);
        }
        return response.json();
    },
};
