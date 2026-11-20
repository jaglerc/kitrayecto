import type { CreateInspectionRequest } from "./inspection.service";
import { inspectionService } from "./inspection.service";
import { tripIncidentService } from "./trip-incident.service";
import type { CreateTripIncidentRequest } from "./trip-incident.service";
import { maintenanceService } from "./maintenance.service";
import type { CreateMaintenanceInput } from "./maintenance.service";
import { accidentService } from "./accident.service";
import type { CompleteAccidentRequest, PendingAccident } from "./accident.service";
import { fuelService } from "./fuel.service";
import type { CreateFuelRequest } from "./fuel.service";
import { storageService } from "./storage.service";
import { tripService } from "./trip.service";
import type { CreateTripRequest } from "./trip.service";
import {
    getOfflineUserId,
    getOfflineUserRole,
    offlineDatabaseService,
} from "./offline-database.service";
import type { OfflineOperation } from "./offline-database.service";

interface QueuedInspectionAnswer {
    templateId: number;
    status: CreateInspectionRequest["answers"][number]["status"];
    observation: string;
    files: File[];
}

interface QueuedInspection {
    vehicleId: number;
    vehicle?: { id: number; type: string; plate: string } | null;
    operation: "Check_in" | "Check_out";
    mileage: number;
    answers: QueuedInspectionAnswer[];
}

interface QueuedTrip {
    input: CreateTripRequest;
    vehicle?: { id: number; type: string; plate: string } | null;
}

interface QueuedTripFinish {
    tripId: number | null;
    tripOperationId: string | null;
}

interface QueuedFuel {
    input: Omit<CreateFuelRequest, "evidence">;
    receipt: File;
    tripId: number | null;
    tripOperationId: string | null;
}

interface QueuedIncident {
    input: Omit<CreateTripIncidentRequest, "evidences">;
    files: File[];
    tripId: number | null;
    tripOperationId: string | null;
}

interface QueuedMaintenance {
    input: CreateMaintenanceInput;
    receipt: File | null;
}

interface QueuedAccidentComplete {
    accidentId: number | null;
    reportOperationId: string | null;
    input: Omit<CompleteAccidentRequest, "evidences">;
    files: File[];
}

type OperationHandler = (operation: OfflineOperation) => Promise<unknown>;

const serverTripId = async (
    tripId: number | null,
    tripOperationId: string | null
): Promise<number> => {
    if (tripId !== null) return tripId;
    if (!tripOperationId) throw new Error("No se pudo identificar el viaje asociado");

    const tripOperation = await offlineDatabaseService.getOperation(tripOperationId);
    const result = tripOperation?.result as { id?: number } | null;
    if (tripOperation?.status !== "synced" || !result?.id) {
        throw new Error("El viaje asociado todavía no se sincronizó");
    }

    return result.id;
};

const serverAccidentId = async (
    accidentId: number | null,
    reportOperationId: string | null
): Promise<number> => {
    if (accidentId !== null) return accidentId;
    if (!reportOperationId) throw new Error("No se pudo identificar el accidente asociado");

    const reportOperation = await offlineDatabaseService.getOperation(reportOperationId);
    const result = reportOperation?.result as PendingAccident | null;
    if (reportOperation?.status !== "synced" || !result?.id) {
        throw new Error("La alerta del accidente todavía no se sincronizó");
    }

    return result.id;
};

const uploadInspectionAnswers = async (
    payload: QueuedInspection
): Promise<CreateInspectionRequest["answers"]> => {
    return Promise.all(payload.answers.map(async (answer) => {
        const evidences = await Promise.all(answer.files.map((file) =>
            storageService.uploadFile(file, "inspecciones", payload.vehicleId)
        ));

        return {
            templateId: answer.templateId,
            status: answer.status,
            observation: answer.observation,
            evidences,
        };
    }));
};

const handlers: Record<OfflineOperation["type"], OperationHandler> = {
    "check-in": async (operation) => {
        const payload = operation.payload as QueuedInspection;
        const answers = await uploadInspectionAnswers(payload);
        return inspectionService.create({ ...payload, answers }, operation.id);
    },

    "check-out": async (operation) => {
        const payload = operation.payload as QueuedInspection;
        const answers = await uploadInspectionAnswers(payload);
        return inspectionService.create({ ...payload, answers }, operation.id);
    },

    trip: async (operation) => {
        const payload = operation.payload as QueuedTrip;
        return tripService.create(payload.input, operation.id);
    },

    "finish-trip": async (operation) => {
        const payload = operation.payload as QueuedTripFinish;
        const tripId = await serverTripId(payload.tripId, payload.tripOperationId);
        await tripService.finish(tripId, operation.id);
        return { tripId };
    },

    fuel: async (operation) => {
        const payload = operation.payload as QueuedFuel;
        const tripId = await serverTripId(payload.tripId, payload.tripOperationId);
        const evidence = await storageService.uploadFile(payload.receipt, "combustible", tripId);
        return fuelService.create({ ...payload.input, evidence }, operation.id);
    },

    incident: async (operation) => {
        const payload = operation.payload as QueuedIncident;
        const tripId = await serverTripId(payload.tripId, payload.tripOperationId);
        const evidences = await Promise.all(payload.files.map((file) =>
            storageService.uploadFile(file, "novedades", tripId)
        ));
        return tripIncidentService.create({ ...payload.input, evidences }, operation.id);
    },

    "accident-report": async (operation) => {
        return accidentService.report(operation.id);
    },

    "accident-complete": async (operation) => {
        const payload = operation.payload as QueuedAccidentComplete;
        const accidentId = await serverAccidentId(payload.accidentId, payload.reportOperationId);
        const evidences = await Promise.all(payload.files.map((file) =>
            storageService.uploadFile(file, "accidentes", accidentId)
        ));
        await accidentService.complete(accidentId, { ...payload.input, evidences }, operation.id);
        return { accidentId };
    },

    maintenance: async (operation) => {
        const payload = operation.payload as QueuedMaintenance;
        const saved = await maintenanceService.create(payload.input, operation.id);
        if (payload.receipt) {
            const evidence = await storageService.uploadFile(payload.receipt, "mantenimientos", saved.id);
            await maintenanceService.attachEvidence(saved.id, evidence, `${operation.id}:evidence`);
        }
        return saved;
    },
};

let synchronizationPromise: Promise<void> | null = null;
let listenersStarted = false;

const isOnline = (): boolean => typeof navigator === "undefined" || navigator.onLine;

export const offlineSyncService = {
    start(): void {
        if (listenersStarted || typeof window === "undefined") return;
        listenersStarted = true;

        window.addEventListener("online", () => void this.processPending());
        window.addEventListener("focus", () => void this.processPending());
        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "visible") void this.processPending();
        });

        if (isOnline()) void this.processPending();
    },

    async processPending(): Promise<void> {
        if (synchronizationPromise) return synchronizationPromise;
        const userId = getOfflineUserId();
        if (!userId || !localStorage.getItem("token") || !isOnline()) return;

        synchronizationPromise = this.runQueue(userId).finally(() => {
            synchronizationPromise = null;
        });
        return synchronizationPromise;
    },

    async retryFailed(): Promise<void> {
        const userId = getOfflineUserId();
        if (!userId) return;

        const operations = await offlineDatabaseService.listOperations(userId);
        await Promise.all(operations
            .filter((operation) => operation.status === "failed" || operation.status === "syncing")
            .map((operation) => offlineDatabaseService.updateOperation(operation.id, (current) => ({
                ...current,
                status: "pending",
                lastError: null,
            }))));

        return this.processPending();
    },

    async enqueue<TPayload>(type: OfflineOperation["type"], payload: TPayload): Promise<OfflineOperation<TPayload>> {
        const userId = getOfflineUserId();
        if (!userId || getOfflineUserRole() !== "Conductor") {
            throw new Error("Inicia sesión como conductor para guardar datos sin conexión");
        }
        return offlineDatabaseService.enqueue({ userId, type, payload });
    },

    async enqueueAndSync<TPayload>(
        type: OfflineOperation["type"],
        payload: TPayload
    ): Promise<OfflineOperation<TPayload>> {
        const operation = await this.enqueue(type, payload);
        if (isOnline()) await this.processPending();
        const updated = await offlineDatabaseService.getOperation(operation.id);
        if (updated?.status === "failed") {
            throw new Error(updated.lastError ?? "No fue posible guardar el registro");
        }
        return (updated ?? operation) as OfflineOperation<TPayload>;
    },

    async runQueue(userId: number): Promise<void> {
        const operations = await offlineDatabaseService.listOperations(userId);
        const recovering = operations.filter((operation) => operation.status === "syncing");
        await Promise.all(recovering.map((operation) => offlineDatabaseService.updateOperation(
            operation.id,
            (current) => ({ ...current, status: "pending" })
        )));
        const queue = (await offlineDatabaseService.listOperations(userId))
            .filter((operation) => operation.status !== "synced");

        for (const operation of queue) {
            if (!isOnline()) return;
            if (operation.status === "failed") return;

            await offlineDatabaseService.updateOperation(operation.id, (current) => ({
                ...current,
                status: "syncing",
                attempts: current.attempts + 1,
                lastError: null,
            }));

            try {
                const result = await handlers[operation.type](operation);
                await offlineDatabaseService.updateOperation(operation.id, (current) => ({
                    ...current,
                    status: "synced",
                    payload: null,
                    result,
                    lastError: null,
                }));
            } catch (error) {
                const lostConnection = !isOnline() || error instanceof TypeError;
                await offlineDatabaseService.updateOperation(operation.id, (current) => ({
                    ...current,
                    status: lostConnection ? "pending" : "failed",
                    lastError: error instanceof Error
                        ? error.message
                        : "No fue posible sincronizar este registro",
                }));
                return;
            }
        }
    },
};
