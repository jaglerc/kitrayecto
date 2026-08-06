export interface ExpiringDocument {
    id: string;
    documentType: string;
    plate: string;
    expiresAt: string;
    daysRemaining: number;
}

export interface SupervisorDashboard {
    activeUsers: number;
    registeredVehicles: number;
    expiringDocuments: number;
    pendingAlerts: number;
    documents: ExpiringDocument[];
}

const API_URL = (
    import.meta.env.VITE_API_URL ?? "http://localhost:3000"
).replace(/\/+$/, "");

export const supervisorDashboardService = {
    async find(): Promise<SupervisorDashboard> {
        const token = localStorage.getItem("token");
        const headers: Record<string, string> = token
            ? { Authorization: `Bearer ${token}` }
            : {};

        const response = await fetch(`${API_URL}/supervisor-dashboard`, {
            headers,
        });

        if (!response.ok) {
            let message = "No fue posible consultar el panel";

            try {
                const body = (await response.json()) as { message?: string };
                message = body.message ?? message;
            } catch {
                // La respuesta no contenía JSON.
            }

            throw new Error(message);
        }

        return response.json();
    },
};
