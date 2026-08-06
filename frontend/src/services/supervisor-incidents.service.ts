export interface SupervisorIncidentEvidence {
    id: number;
    fileName: string;
    downloadUrl?: string;
}

export interface SupervisorIncident {
    id: number;
    tripId: number;
    type: string;
    description: string;
    registeredAt: string;
    driver: { id: number; name: string };
    vehicle: { id: number; type: string; plate: string };
    evidences: SupervisorIncidentEvidence[];
}

export interface SupervisorIncidentList {
    items: SupervisorIncident[];
    total: number;
    page: number;
    pageSize: number;
}

const API = (import.meta.env.VITE_API_URL ?? "http://localhost:3000").replace(/\/+$/, "");

export const supervisorIncidentsService = {
    async list(input: { page?: number; search?: string } = {}): Promise<SupervisorIncidentList> {
        const query = new URLSearchParams({ page: String(input.page ?? 1), pageSize: "20" });
        if (input.search) query.set("search", input.search);
        const token = localStorage.getItem("token");
        const response = await fetch(`${API}/supervisor/incidents?${query}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!response.ok) {
            const body = await response.json().catch(() => ({})) as { message?: string };
            throw new Error(body.message ?? "No fue posible consultar las novedades");
        }
        return response.json();
    },
};
