export const caseStatuses = ["Reportado", "En revisión", "En seguimiento", "Cerrado"] as const;
export type CaseStatus = typeof caseStatuses[number];

export interface SupervisorIncidentEvidence {
    id: number;
    fileName: string;
    objectKey: string;
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
