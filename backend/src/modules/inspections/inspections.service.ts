import { InspectionsRepository } from "./inspections.repository.js";
import type { CreateInspectionInput, CreatedInspection, InspectionStatus } from "./inspections.types.js";

const statuses: InspectionStatus[] = ["Sin novedad", "Con novedad", "Crítica"];
const priority: Record<InspectionStatus, number> = {
    "Sin novedad": 0,
    "Con novedad": 1,
    "Crítica": 2,
};

export class InspectionValidationError extends Error {}

export class InspectionsService {
    static async create(conductorId: number, input: CreateInspectionInput): Promise<CreatedInspection> {
        if (!Number.isInteger(input.vehicleId) || input.vehicleId <= 0) {
            throw new InspectionValidationError("El vehículo no es válido");
        }
        if (input.operation !== "Check_in" && input.operation !== "Check_out") {
            throw new InspectionValidationError("El tipo de inspección no es válido");
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
        }

        const overallStatus = input.answers.reduce<InspectionStatus>(
            (current, answer) => priority[answer.status] > priority[current] ? answer.status : current,
            "Sin novedad"
        );

        return InspectionsRepository.create(conductorId, input.vehicleId, input.operation, overallStatus, input.answers, templatesById);
    }
}
