export const caseStatuses = ["Reportado", "En revisión", "En seguimiento", "Cerrado"] as const;
export type CaseStatus = typeof caseStatuses[number];

export interface SupervisorIncidentEvidence {
    id: number;
    fileName: string;
    downloadUrl?: string;
}

export interface SupervisorIncident {
    id: number;
    tripId: number | null;
    category: "trayecto" | "accidente" | "inspeccion";
    status: CaseStatus;
    revision: string;
    assigneeId: number | null;
    assignee: string | null;
    formCompleted: boolean | null;
    accidentDetails: { location: string | null; time: string | null; driverInjured: boolean | null; vehicleDamaged: boolean | null; thirdParties: boolean | null };
    history: { id: string; status: CaseStatus; note: string; createdAt: string; author: string; assignee: string | null }[];
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
    assignees: { id: number; name: string }[];
    page: number;
    pageSize: number;
}

const API = (import.meta.env.VITE_API_URL ?? "http://localhost:3000").replace(/\/+$/, "");

export const supervisorIncidentsService = {
    async record(item: SupervisorIncident, input: { status: CaseStatus; note: string; assigneeId: number | null }) {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API}/supervisor/incidents/${item.category}/${item.id}/follow-up`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: JSON.stringify({ ...input, revision: item.revision }),
        });
        if (!response.ok) {
            const body = await response.json().catch(() => ({})) as { message?: string };
            throw new Error(body.message ?? "No fue posible guardar el seguimiento");
        }
    },
    async list(input: { page?: number; search?: string; category?: string; status?: string } = {}): Promise<SupervisorIncidentList> {
        const query = new URLSearchParams({ page: String(input.page ?? 1), pageSize: "20" });
        if (input.search) query.set("search", input.search);
        if (input.category) query.set("category", input.category);
        if (input.status) query.set("status", input.status);
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
