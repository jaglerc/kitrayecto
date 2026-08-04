import type {
    VehicleType,
} from "../components/ui/VehicleTypeStep";

export interface InspectionTemplate {
    id: number;
    vehicleType: VehicleType;
    title: string;
    description: string;
}

export type InspectionStatus =
    | "Sin novedad"
    | "Con novedad"
    | "Crítica";

export interface InspectionAnswer {
    status: InspectionStatus;
    observation: string;
}

const API_URL = (
    import.meta.env.VITE_API_URL ?? "http://localhost:3000"
).replace(/\/+$/, "");

export const inspectionService = {
    async findTemplatesByVehicleType(
        vehicleType: VehicleType
    ): Promise<InspectionTemplate[]> {
        const token = localStorage.getItem("token");

        const response = await fetch(
            `${API_URL}/inspection-templates?type=${encodeURIComponent(vehicleType)}`,
            {
                headers: token
                    ? { Authorization: `Bearer ${token}` }
                    : {},
            }
        );

        if (!response.ok) {
            let message = "No fue posible consultar el checklist";

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
