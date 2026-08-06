export interface SupervisorIncidentEvidence {
    id: number;
    fileName: string;
    objectKey: string;
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
