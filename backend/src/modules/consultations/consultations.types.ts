export type ConsultationCategory = "trips" | "fuel" | "maintenance" | "accidents" | "inspections" | "incidents";

export interface ConsultationListItem {
    id: number;
    category: ConsultationCategory;
    occurredAt: string;
    title: string;
    subtitle: string;
    status: string;
    vehicleType: string;
    plate: string;
}

export interface ConsultationDetail extends ConsultationListItem {
    fields: Array<{ label: string; value: string }>;
    evidences: Array<{ fileName: string; objectKey: string; url?: string }>;
}
