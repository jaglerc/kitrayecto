import { TripsRepository } from "../trips/trips.repository.js";
import { TripIncidentsRepository } from "./trip-incidents.repository.js";
import type { CreateTripIncidentInput, CreatedTripIncident } from "./trip-incidents.types.js";

export class TripIncidentValidationError extends Error {}
export class TripIncidentConflictError extends Error {}

const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];

export class TripIncidentsService {
    static async create(conductorId: number, input: CreateTripIncidentInput): Promise<CreatedTripIncident> {
        const status = await TripsRepository.findStatus(conductorId);
        const activeTrip = status.activeTrip;
        if (!activeTrip) throw new TripIncidentConflictError("Debes tener un viaje en curso para registrar una novedad");
        if (input.type !== "Novedad" && input.type !== "Critica") {
            throw new TripIncidentValidationError("El tipo de novedad no es válido");
        }
        if (typeof input.description !== "string" || !input.description.trim() || input.description.trim().length > 300) {
            throw new TripIncidentValidationError("La descripción debe tener entre 1 y 300 caracteres");
        }
        if (!Array.isArray(input.evidences) || input.evidences.length > 3) {
            throw new TripIncidentValidationError("Puedes adjuntar hasta tres evidencias");
        }
        if (input.type === "Critica" && input.evidences.length === 0) {
            throw new TripIncidentValidationError("Una novedad crítica requiere al menos una evidencia");
        }

        const storagePrefix = (process.env.S3_UPLOAD_PREFIX ?? "archivos").replace(/^\/+|\/+$/g, "");
        const expectedPrefix = `${storagePrefix}/novedades/${activeTrip.id}/${conductorId}/`;
        for (const evidence of input.evidences) {
            if (!evidence || typeof evidence.objectKey !== "string" || !evidence.objectKey.startsWith(expectedPrefix) ||
                !allowedImageTypes.includes(evidence.contentType) || !Number.isInteger(evidence.size) ||
                evidence.size <= 0 || evidence.size > 2.5 * 1024 * 1024) {
                throw new TripIncidentValidationError("Una de las evidencias no es válida");
            }
        }
        return TripIncidentsRepository.create(activeTrip.id, { ...input, description: input.description.trim() });
    }
}
