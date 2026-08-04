import type {
    VehicleType,
} from "../components/ui/VehicleTypeStep";

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

        return response.json();
    },
};
