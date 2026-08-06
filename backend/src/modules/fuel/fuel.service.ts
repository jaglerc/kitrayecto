import { TripsRepository } from "../trips/trips.repository.js";
import { FuelRepository } from "./fuel.repository.js";
import type { CreateFuelRecordInput, CreatedFuelRecord, FuelType } from "./fuel.types.js";

export class FuelValidationError extends Error {}
export class FuelConflictError extends Error {}

const fuelTypes: FuelType[] = ["Gasolina", "ACPM", "Gas", "Electrico"];
const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];

export class FuelService {
    static async create(conductorId: number, input: CreateFuelRecordInput): Promise<CreatedFuelRecord> {
        const tripStatus = await TripsRepository.findStatus(conductorId);
        const activeTrip = tripStatus.activeTrip;
        if (!activeTrip) throw new FuelConflictError("Debes tener un viaje en curso para registrar combustible");

        if (!Number.isInteger(input.currentMileage) || input.currentMileage < 0) {
            throw new FuelValidationError("El kilometraje debe ser un número entero válido");
        }
        if (!Number.isFinite(input.gallons) || input.gallons <= 0) {
            throw new FuelValidationError("La cantidad de galones no es válida");
        }
        if (!Number.isFinite(input.amountPaid) || input.amountPaid <= 0) {
            throw new FuelValidationError("El valor pagado no es válido");
        }
        if (typeof input.serviceStation !== "string" || !input.serviceStation.trim() || input.serviceStation.trim().length > 120) {
            throw new FuelValidationError("La estación de servicio no es válida");
        }
        if (!fuelTypes.includes(input.fuelType)) {
            throw new FuelValidationError("El tipo de combustible no es válido");
        }
        const observations = input.observations?.trim() ?? "";
        if (observations.length > 300) throw new FuelValidationError("Las observaciones no pueden superar 300 caracteres");

        const evidence = input.evidence;
        const storagePrefix = (process.env.S3_UPLOAD_PREFIX ?? "archivos").replace(/^\/+|\/+$/g, "");
        const expectedPrefix = `${storagePrefix}/combustible/${activeTrip.id}/${conductorId}/`;
        if (!evidence || typeof evidence.objectKey !== "string" || !evidence.objectKey.startsWith(expectedPrefix) ||
            !allowedImageTypes.includes(evidence.contentType) || !Number.isInteger(evidence.size) ||
            evidence.size <= 0 || evidence.size > 2.5 * 1024 * 1024) {
            throw new FuelValidationError("La foto del recibo no es válida");
        }

        try {
            return await FuelRepository.create(activeTrip.id, activeTrip.vehicle.id, conductorId, { ...input, observations });
        } catch (error) {
            if (error instanceof Error && error.message === "MILEAGE_LOWER_THAN_CURRENT") {
                throw new FuelValidationError("El kilometraje no puede ser menor al registrado actualmente para el vehículo");
            }
            throw error;
        }
    }
}
