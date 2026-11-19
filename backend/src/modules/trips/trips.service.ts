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

    static findLocations() {
        return TripsRepository.findLocations();
    }

    static async create(conductorId: number, input: CreateTripInput): Promise<ActiveTrip> {
        const status = await TripsRepository.findStatus(conductorId);
        if (!status.hasCheckIn) throw new TripConflictError("Primero debes realizar el check-in del vehículo");
        if (!status.checkInAuthorized) throw new TripConflictError("El check-in contiene una novedad crítica y la ruta no está autorizada");
        if (status.activeTrip) throw new TripConflictError("Ya tienes un viaje en curso");
        if (!status.vehicle) throw new TripConflictError("No tienes un vehículo asignado");

        if (
            !Number.isInteger(input.originId) ||
            !Array.isArray(input.stops) ||
            input.stops.length < 1 ||
            input.stops.length > 20
        ) {
            throw new TripValidationError("Registra el origen y al menos una parada");
        }

        const locations = await TripsRepository.findLocations();
        const locationIds = new Set(locations.map((location) => location.id));
        if (
            !locationIds.has(input.originId) ||
            input.stops.some((stop) => !locationIds.has(stop.locationId))
        ) {
            throw new TripValidationError("Selecciona ubicaciones válidas");
        }

        if (!Array.isArray(input.products) || input.products.length > expectedProducts.length) {
            throw new TripValidationError("La carga inicial no es válida");
        }

        if (new Set(input.products.map((product) => product.productName)).size !== input.products.length) {
            throw new TripValidationError("No puedes repetir un tipo de carga");
        }

        for (const product of input.products) {
            const expected = expectedProducts.find((item) => item.productName === product.productName);
            if (
                !expected ||
                product.unit !== expected.unit ||
                !Number.isFinite(product.quantity) ||
                product.quantity <= 0
            ) {
                throw new TripValidationError(`La cantidad de ${product.productName?.toLowerCase() || "carga"} no es válida`);
            }
        }

        const cargo = new Map(input.products.map((product) => [product.productName, product.quantity]));
        for (const stop of input.stops) {
            if (!Array.isArray(stop.movements) || stop.movements.length > expectedProducts.length * 2) {
                throw new TripValidationError("Los movimientos de carga de una parada no son válidos");
            }
            for (const movement of stop.movements) {
                const expected = expectedProducts.find((item) => item.productName === movement.productName);
                if (
                    !expected ||
                    expected.unit !== movement.unit ||
                    !Number.isFinite(movement.quantity) ||
                    movement.quantity <= 0 ||
                    !["Recogida", "Entrega"].includes(movement.type)
                ) {
                    throw new TripValidationError("Uno de los movimientos de carga no es válido");
                }
                const current = cargo.get(movement.productName) ?? 0;
                if (movement.type === "Entrega" && movement.quantity > current) {
                    throw new TripValidationError(`No hay suficiente ${movement.productName.toLowerCase()} para entregar`);
                }
                cargo.set(movement.productName, current + (movement.type === "Recogida" ? movement.quantity : -movement.quantity));
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
