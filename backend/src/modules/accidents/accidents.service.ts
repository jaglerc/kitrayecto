import { TripsRepository } from "../trips/trips.repository.js";
import { AccidentsRepository } from "./accidents.repository.js";
import type { AccidentDetail, CompleteAccidentInput, PendingAccident } from "./accidents.types.js";

export class AccidentValidationError extends Error {}
export class AccidentConflictError extends Error {}
export class AccidentNotFoundError extends Error {}

const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];

export class AccidentsService {
    static async report(conductorId: number): Promise<PendingAccident> {
        const activeTrip = (await TripsRepository.findStatus(conductorId)).activeTrip;
        if (!activeTrip) throw new AccidentConflictError("Debes tener un viaje en curso para reportar un accidente");
        return (await AccidentsRepository.findPendingByTrip(activeTrip.id)) ?? AccidentsRepository.createPending(activeTrip.id);
    }

    static findPending(conductorId: number): Promise<PendingAccident[]> {
        return AccidentsRepository.findPending(conductorId);
    }

    static async findById(conductorId: number, accidentId: number): Promise<AccidentDetail> {
        if (!Number.isInteger(accidentId) || accidentId <= 0) throw new AccidentValidationError("El accidente no es válido");
        const accident = await AccidentsRepository.findById(conductorId, accidentId);
        if (!accident) throw new AccidentNotFoundError("El formulario pendiente no existe");
        return accident;
    }

    static async complete(conductorId: number, accidentId: number, input: CompleteAccidentInput): Promise<void> {
        await this.findById(conductorId, accidentId);
        if (typeof input.accidentTime !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(input.accidentTime)) throw new AccidentValidationError("La hora del accidente no es válida");
        if (typeof input.location !== "string" || !input.location.trim() || input.location.trim().length > 200) throw new AccidentValidationError("La ubicación debe tener entre 1 y 200 caracteres");
        if (typeof input.description !== "string" || !input.description.trim() || input.description.trim().length > 500) throw new AccidentValidationError("La descripción debe tener entre 1 y 500 caracteres");
        if ([input.driverInjured, input.vehicleDamaged, input.thirdPartiesInvolved].some((value) => typeof value !== "boolean")) throw new AccidentValidationError("Responde todas las preguntas del accidente");
        if (!Array.isArray(input.evidences) || input.evidences.length > 3) throw new AccidentValidationError("Puedes adjuntar hasta tres evidencias");

        const prefix = (process.env.S3_UPLOAD_PREFIX ?? "archivos").replace(/^\/+|\/+$/g, "");
        const expectedPrefix = `${prefix}/accidentes/${accidentId}/${conductorId}/`;
        for (const evidence of input.evidences) {
            if (!evidence || typeof evidence.objectKey !== "string" || !evidence.objectKey.startsWith(expectedPrefix) ||
                !allowedImageTypes.includes(evidence.contentType) || !Number.isInteger(evidence.size) ||
                evidence.size <= 0 || evidence.size > 2.5 * 1024 * 1024) {
                throw new AccidentValidationError("Una de las evidencias no es válida");
            }
        }
        await AccidentsRepository.complete(conductorId, accidentId, input);
    }
}
