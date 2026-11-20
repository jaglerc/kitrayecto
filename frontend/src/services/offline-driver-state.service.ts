import type { TripStatus } from "./trip.service";
import {
    getBogotaDateKey,
    getOfflineUserId,
    offlineDatabaseService,
} from "./offline-database.service";

interface QueuedCheckIn {
    operation: "Check_in" | "Check_out";
    vehicle: TripStatus["vehicle"];
}

interface QueuedTrip {
    input: { originId: number };
    vehicle: TripStatus["vehicle"];
}

const isUnresolved = (status: string): boolean => status !== "synced";

export const offlineDriverStateService = {
    async getTripStatus(): Promise<TripStatus | null> {
        const userId = getOfflineUserId();
        if (!userId) return null;

        const [cached, operations] = await Promise.all([
            offlineDatabaseService.readCache<{
                dayKey: string;
                status: TripStatus;
            }>(userId, "trip-status"),
            offlineDatabaseService.listOperations(userId),
        ]);

        if (!cached || cached.dayKey !== getBogotaDateKey()) return null;

        const status: TripStatus = {
            ...cached.status,
            vehicle: cached.status.vehicle ? { ...cached.status.vehicle } : null,
            activeTrip: cached.status.activeTrip ? { ...cached.status.activeTrip } : null,
        };
        const pending = operations.filter((operation) => isUnresolved(operation.status));

        for (const operation of pending) {
            if (operation.type === "check-in") {
                const input = operation.payload as QueuedCheckIn;
                status.hasCheckIn = true;
                status.vehicle = input.vehicle;
                status.checkInAuthorized = true;
                status.canStart = !status.activeTrip;
                status.canCheckout = false;
            }

            if (operation.type === "trip") {
                const input = operation.payload as QueuedTrip;
                if (!input.vehicle) return null;
                const tripId = -Math.abs(operation.id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0));
                status.activeTrip = {
                    id: tripId,
                    clientOperationId: operation.id,
                    numberOfDay: status.nextTripNumber,
                    startedAt: operation.createdAt,
                    vehicle: input.vehicle,
                };
                status.canStart = false;
                status.canCheckout = false;
            }

            if (operation.type === "finish-trip") {
                status.activeTrip = null;
                status.completedToday += 1;
                status.nextTripNumber = status.completedToday + 1;
                status.canStart = status.hasCheckIn && status.checkInAuthorized;
                status.canCheckout = status.hasCheckIn && status.completedToday > 0;
            }

            if (operation.type === "check-out") {
                status.hasCheckIn = false;
                status.vehicle = null;
                status.canStart = false;
                status.canCheckout = false;
            }
        }

        return status;
    },
};
