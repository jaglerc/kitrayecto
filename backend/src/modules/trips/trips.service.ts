import { TripsRepository } from "./trips.repository.js";
import type { ActiveTrip, CreateTripInput, TripStatus } from "./trips.types.js";

export class TripValidationError extends Error {}
export class TripConflictError extends Error {}
export class TripNotFoundError extends Error {}

const expectedProducts = [
    { productName: "Huevos", unit: "Unidades" },
    { productName: "Alimento balanceado", unit: "Kilogramos" },
];

export class TripsService {
    static findStatus(conductorId: number): Promise<TripStatus> {
        return TripsRepository.findStatus(conductorId);
    }

    static async create(conductorId: number, input: CreateTripInput): Promise<ActiveTrip> {
        const status = await TripsRepository.findStatus(conductorId);
        if (!status.hasCheckIn) throw new TripConflictError("Primero debes realizar el check-in del vehículo");
        if (!status.checkInAuthorized) throw new TripConflictError("El check-in contiene una novedad crítica y la ruta no está autorizada");
        if (status.activeTrip) throw new TripConflictError("Ya tienes un viaje en curso");
        if (!status.vehicle) throw new TripConflictError("No tienes un vehículo asignado");

        if (!Array.isArray(input.products) || input.products.length !== expectedProducts.length) {
            throw new TripValidationError("Debes registrar toda la carga del viaje");
        }
        for (const expected of expectedProducts) {
            const product = input.products.find((item) => item.productName === expected.productName);
            if (!product || product.unit !== expected.unit || !Number.isFinite(product.quantity) || product.quantity <= 0) {
                throw new TripValidationError(`La cantidad de ${expected.productName.toLowerCase()} no es válida`);
            }
        }
        const observations = input.observations?.trim() ?? "";
        if (observations.length > 300) throw new TripValidationError("Las observaciones no pueden superar 300 caracteres");

        try {
            return await TripsRepository.create(conductorId, status.vehicle.id, { ...input, observations });
        } catch (error) {
            if (error instanceof Error && error.message === "ACTIVE_TRIP_EXISTS") {
                throw new TripConflictError("Ya tienes un viaje en curso");
            }
            throw error;
        }
    }

    static async finish(conductorId: number, tripId: number): Promise<void> {
        if (!Number.isInteger(tripId) || tripId <= 0) throw new TripValidationError("El viaje no es válido");
        try {
            await TripsRepository.finish(conductorId, tripId);
        } catch (error) {
            if (error instanceof Error && error.message === "ACTIVE_TRIP_NOT_FOUND") {
                throw new TripNotFoundError("El viaje activo no existe");
            }
            throw error;
        }
    }
}
