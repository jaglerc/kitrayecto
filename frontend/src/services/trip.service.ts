import type { VehicleType } from "../components/ui/VehicleTypeStep";

export interface TripVehicle { id: number; type: VehicleType; plate: string; }
export interface ActiveTrip { id: number; numberOfDay: number; startedAt: string; vehicle: TripVehicle; }
export interface TripStatus {
    hasCheckIn: boolean;
    checkInAuthorized: boolean;
    vehicle: TripVehicle | null;
    activeTrip: ActiveTrip | null;
    completedToday: number;
    nextTripNumber: number;
    canStart: boolean;
    canCheckout: boolean;
}
export interface CreateTripRequest {
    observations: string;
    products: Array<{ productName: string; unit: string; quantity: number }>;
}

const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:3000").replace(/\/+$/, "");
const headers = () => {
    const token = localStorage.getItem("token");
    return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};
const errorMessage = async (response: Response, fallback: string) => {
    try { return ((await response.json()) as { message?: string }).message ?? fallback; } catch { return fallback; }
};

export const tripService = {
    async findStatus(): Promise<TripStatus> {
        const response = await fetch(`${API_URL}/trips/status`, { headers: headers() });
        if (!response.ok) throw new Error(await errorMessage(response, "No fue posible consultar el viaje"));
        return response.json();
    },
    async create(input: CreateTripRequest): Promise<ActiveTrip> {
        const response = await fetch(`${API_URL}/trips`, { method: "POST", headers: headers(), body: JSON.stringify(input) });
        if (!response.ok) throw new Error(await errorMessage(response, "No fue posible registrar el viaje"));
        return response.json();
    },
    async finish(tripId: number): Promise<void> {
        const response = await fetch(`${API_URL}/trips/${tripId}/finish`, { method: "PATCH", headers: headers() });
        if (!response.ok) throw new Error(await errorMessage(response, "No fue posible terminar el viaje"));
    },
};
