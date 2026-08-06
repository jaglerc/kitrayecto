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
