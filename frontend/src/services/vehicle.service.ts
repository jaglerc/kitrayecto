import type {
    VehicleType,
} from "../components/ui/VehicleTypeStep";
import { getOfflineUserId, offlineDatabaseService } from "./offline-database.service";

export interface Vehicle {
    id: number;
    plate: string;
    type: VehicleType;
}

const API_URL = (
    import.meta.env.VITE_API_URL ?? "http://localhost:3000"
).replace(/\/+$/, "");

export const vehicleService = {
    async findByType(type: VehicleType): Promise<Vehicle[]> {
        const token = localStorage.getItem("token");
        const userId = getOfflineUserId();

        try {
            const response = await fetch(
                `${API_URL}/vehicles?type=${encodeURIComponent(type)}`,
                {
                    headers: token
                        ? { Authorization: `Bearer ${token}` }
                        : {},
                }
            );

            if (!response.ok) {
                let message = "No fue posible consultar los vehículos";

                try {
                    const body = await response.json() as { message?: string };
                    message = body.message ?? message;
                } catch {
                    // La respuesta no contenía JSON.
                }

                throw new Error(message);
            }

            const vehicles = await response.json() as Vehicle[];
            if (userId !== null) {
                await offlineDatabaseService.saveCache(userId, `vehicles:${type}`, vehicles);
            }
            return vehicles;
        } catch (error) {
            if (userId !== null && error instanceof TypeError) {
                const cachedVehicles = await offlineDatabaseService.readCache<Vehicle[]>(
                    userId,
                    `vehicles:${type}`
                );
                if (cachedVehicles) return cachedVehicles;
            }

            throw error;
        }
    },
};
