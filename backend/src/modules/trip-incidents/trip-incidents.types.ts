export type TripIncidentType = "Novedad" | "Critica";

export interface TripIncidentEvidenceInput {
    objectKey: string;
    contentType: string;
    size: number;
}

export interface CreateTripIncidentInput {
    type: TripIncidentType;
    description: string;
    evidences: TripIncidentEvidenceInput[];
}

export interface CreatedTripIncident {
    id: number;
    tripId: number;
    type: TripIncidentType;
    registeredAt: string;
}
