import { InspectionsRepository } from "./inspections.repository.js";
import { StorageService } from "../storage/storage.service.js";
import { TripsService } from "../trips/trips.service.js";
import type { CreateInspectionInput, CreatedInspection, InspectionStatus } from "./inspections.types.js";

const statuses: InspectionStatus[] = ["Sin novedad", "Con novedad", "Crítica"];
const priority: Record<InspectionStatus, number> = {
    "Sin novedad": 0,
    "Con novedad": 1,
    "Crítica": 2,
};

export class InspectionValidationError extends Error {}
export class InspectionConflictError extends Error {}
export class InspectionNotFoundError extends Error {}

export class InspectionsService {
    static async create(conductorId: number, input: CreateInspectionInput): Promise<CreatedInspection> {
        if (!Number.isInteger(input.vehicleId) || input.vehicleId <= 0) {
            throw new InspectionValidationError("El vehículo no es válido");
        }
        if (input.operation !== "Check_in" && input.operation !== "Check_out") {
            throw new InspectionValidationError("El tipo de inspección no es válido");
        }
        if (!Number.isInteger(input.mileage) || input.mileage < 0) {
            throw new InspectionValidationError(
                "El kilometraje debe ser un número entero mayor o igual a cero"
            );
        }

        if (
            input.operation === "Check_in" &&
            await InspectionsRepository.findTodayByConductor(conductorId)
        ) {
            throw new InspectionConflictError(
                "Ya registraste el checklist de entrada de hoy"
            );
        }
        if (input.operation === "Check_out") {
            const [tripStatus, checkIn] = await Promise.all([
                TripsService.findStatus(conductorId),
                InspectionsRepository.findTodayByConductor(conductorId),
            ]);
            if (!tripStatus.canCheckout || !checkIn) {
                throw new InspectionConflictError(
                    tripStatus.activeTrip
                        ? "Primero debes terminar el viaje actual"
                        : "Debes completar al menos un viaje antes de finalizar la jornada"
                );
            }
            if (checkIn.vehicle.id !== input.vehicleId) {
                throw new InspectionValidationError("El vehículo no corresponde al check-in de la jornada");
            }
            if (checkIn.mileage !== null && input.mileage < checkIn.mileage) {
                throw new InspectionValidationError("El kilometraje final no puede ser menor al inicial");
            }
        }
        if (!Array.isArray(input.answers) || input.answers.length === 0) {
            throw new InspectionValidationError("Debes completar el checklist");
        }

        const vehicle = await InspectionsRepository.findVehicle(input.vehicleId);
        if (!vehicle) throw new InspectionValidationError("El vehículo no existe");

        const templates = await InspectionsRepository.findTemplates(vehicle.tipo_vehiculo);
        const templatesById = new Map(templates.map((template) => [template.id, template]));
        const answerIds = new Set(input.answers.map((answer) => answer.templateId));

        if (input.answers.length !== templates.length || answerIds.size !== templates.length || templates.some((item) => !answerIds.has(item.id))) {
            throw new InspectionValidationError("Debes responder todos los elementos del checklist");
        }

        for (const answer of input.answers) {
            if (!templatesById.has(answer.templateId) || !statuses.includes(answer.status)) {
                throw new InspectionValidationError("El checklist contiene una respuesta no válida");
            }
            answer.observation = answer.observation?.trim() ?? "";
            if (answer.status !== "Sin novedad" && !answer.observation) {
                throw new InspectionValidationError("Describe cada elemento que tenga una novedad");
            }
            if (answer.observation.length > 300) {
                throw new InspectionValidationError("Las observaciones no pueden superar 300 caracteres");
            }

            if (!Array.isArray(answer.evidences) || answer.evidences.length > 3) {
                throw new InspectionValidationError(
                    "Cada elemento puede tener hasta tres evidencias"
                );
            }
            if (answer.status === "Crítica" && answer.evidences.length === 0) {
                throw new InspectionValidationError(
                    "Los elementos críticos requieren al menos una evidencia"
                );
            }

            const storagePrefix = (process.env.S3_UPLOAD_PREFIX ?? "archivos")
                .replace(/^\/+|\/+$/g, "");
            const expectedEvidencePrefix = `${storagePrefix}/inspecciones/${input.vehicleId}/${conductorId}/`;
            for (const evidence of answer.evidences) {
                if (
                    typeof evidence.objectKey !== "string" ||
                    !evidence.objectKey.startsWith(expectedEvidencePrefix) ||
                    !["image/jpeg", "image/png", "image/webp"].includes(evidence.contentType) ||
                    !Number.isInteger(evidence.size) ||
                    evidence.size <= 0 ||
                    evidence.size > 2.5 * 1024 * 1024
                ) {
                    throw new InspectionValidationError(
                        "Una de las evidencias no es válida"
                    );
                }
            }
        }

        const overallStatus = input.answers.reduce<InspectionStatus>(
            (current, answer) => priority[answer.status] > priority[current] ? answer.status : current,
            "Sin novedad"
        );

        try {
            return await InspectionsRepository.create(conductorId, input.vehicleId, input.operation, overallStatus, input.mileage, input.answers, templatesById);
        } catch (error) {
            if (error instanceof Error && error.message === "MILEAGE_LOWER_THAN_CURRENT") {
                throw new InspectionValidationError(
                    "El kilometraje no puede ser menor al registrado actualmente para el vehículo"
                );
            }
            throw error;
        }
    }

    static async findToday(conductorId: number): Promise<import("./inspections.types.js").TodayInspection | null> {
        return InspectionsRepository.findTodayByConductor(conductorId);
    }

    static async findById(conductorId: number, inspectionId: number): Promise<import("./inspections.types.js").InspectionDetail> {
        if (!Number.isInteger(inspectionId) || inspectionId <= 0) {
            throw new InspectionValidationError("El identificador del checklist no es valido");
        }

        const inspection = await InspectionsRepository.findByIdAndConductor(
            inspectionId,
            conductorId
        );
        if (!inspection) {
            throw new InspectionNotFoundError("El checklist no existe");
        }
        return {
            ...inspection,
            answers: await Promise.all(
                inspection.answers.map(async (answer) => ({
                    ...answer,
                    evidences: await Promise.all(
                        answer.evidences.map(async (evidence) => ({
                            id: evidence.id,
                            fileName: evidence.fileName,
                            url: await StorageService.createDownloadUrl(evidence.objectKey),
                        }))
                    ),
                }))
            ),
        };
    }
}
