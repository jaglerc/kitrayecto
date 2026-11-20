import type { VehicleType } from "../components/ui/VehicleTypeStep";
import {
    getBogotaDateKey,
    getOfflineUserId,
    offlineDatabaseService,
} from "./offline-database.service";

export interface TripVehicle {
    id: number;
    type: VehicleType;
    plate: string;
}

export interface ActiveTrip {
    id: number;
    clientOperationId?: string;
    numberOfDay: number;
    startedAt: string;
    vehicle: TripVehicle;
}

export interface TripStatus {
    hasCheckIn: boolean;
    checkInAuthorized: boolean;
    vehicle: TripVehicle | null;
    activeTrip: ActiveTrip | null;
    completedToday: number;
    nextTripNumber: number;
    canStart: boolean;
    canCheckout: boolean;
    suggestedOriginId: number | null;
}

export interface TripCargoMovement {
    productName: string;
    unit: string;
    quantity: number;
    type: "Recogida" | "Entrega";
}

export interface CreateTripRequest {
    originId: number;
    observations: string;
    products: Array<{
        productName: string;
        unit: string;
        quantity: number;
    }>;
    stops: Array<{
        locationId: number;
        movements: TripCargoMovement[];
    }>;
}

export interface TripLocation {
    id: number;
    name: string;
}

const API_URL = (
    import.meta.env.VITE_API_URL ?? "http://localhost:3000"
).replace(/\/+$/, "");

const createHeaders = (): HeadersInit => {
    const token = localStorage.getItem("token");

    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};
const getErrorMessage = async (
    response: Response,
    fallback: string
): Promise<string> => {
    try {
        const body = await response.json() as { message?: string };
        return body.message ?? fallback;
    } catch {
        return fallback;
    }
};

export const tripService = {
    async findLocations(): Promise<TripLocation[]> {
        const userId = getOfflineUserId();

        try {
            const response = await fetch(`${API_URL}/trips/locations`, {
                headers: createHeaders(),
            });

            if (!response.ok) {
                throw new Error(await getErrorMessage(
                    response,
                    "No fue posible consultar las ubicaciones"
                ));
            }

            const locations = await response.json() as TripLocation[];
            if (userId !== null) {
                await offlineDatabaseService.saveCache(userId, "locations", locations);
            }
            return locations;
        } catch (error) {
            if (userId !== null && error instanceof TypeError) {
                const cached = await offlineDatabaseService.readCache<TripLocation[]>(userId, "locations");
                if (cached) return cached;
            }
            throw error;
        }
    },

    async findStatus(): Promise<TripStatus> {
        const userId = getOfflineUserId();

        try {
            const response = await fetch(`${API_URL}/trips/status`, {
                headers: createHeaders(),
            });

            if (!response.ok) {
                throw new Error(await getErrorMessage(
                    response,
                    "No fue posible consultar el viaje"
                ));
            }

            const status = await response.json() as TripStatus;
            if (userId !== null) {
                await offlineDatabaseService.saveCache(userId, "trip-status", {
                    dayKey: getBogotaDateKey(),
                    status,
                });
            }
            return status;
        } catch (error) {
            if (userId !== null && error instanceof TypeError) {
                const { offlineDriverStateService } = await import("./offline-driver-state.service");
                const localStatus = await offlineDriverStateService.getTripStatus();
                if (localStatus) return localStatus;
            }
            throw error;
        }
    },

    async create(input: CreateTripRequest, idempotencyKey?: string): Promise<ActiveTrip> {
        const response = await fetch(`${API_URL}/trips`, {
            method: "POST",
            headers: {
                ...createHeaders(),
                ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
            },
            body: JSON.stringify(input),
        });

        if (!response.ok) {
            throw new Error(await getErrorMessage(
                response,
                "No fue posible registrar el viaje"
            ));
        }

        return response.json();
    },

    async finish(tripId: number, idempotencyKey?: string): Promise<void> {
        const response = await fetch(`${API_URL}/trips/${tripId}/finish`, {
            method: "PATCH",
            headers: {
                ...createHeaders(),
                ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
            },
        });

        if (!response.ok) {
            throw new Error(await getErrorMessage(
                response,
                "No fue posible terminar el viaje"
            ));
        }
    },
};
