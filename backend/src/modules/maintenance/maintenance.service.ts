import { TripsRepository } from "../trips/trips.repository.js";
import { MaintenanceRepository } from "./maintenance.repository.js";
import type {
    CreateMaintenanceInput,
    CreatedMaintenance,
    MaintenanceEvidenceInput,
    MaintenanceServiceType,
} from "./maintenance.types.js";

export class MaintenanceValidationError extends Error {}
export class MaintenanceConflictError extends Error {}

const serviceTypes: MaintenanceServiceType[] = [
    "Cambio de aceite",
    "Fumigación",
    "Otro",
];
const serviceClasses = ["Preventivo", "Correctivo", "Emergencia"];
const statuses = ["Programado", "Realizado"];
const allowedContentTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

const isValidDate = (value: string): boolean => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

    const parsed = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};

export class MaintenanceService {
    static async create(
        conductorId: number,
        input: CreateMaintenanceInput
    ): Promise<CreatedMaintenance> {
        const vehicle = await TripsRepository.findCheckedInVehicle(conductorId);

        if (!vehicle) {
            throw new MaintenanceConflictError(
                "Debes registrar el ingreso del vehículo a tu jornada antes de reportar mantenimiento"
            );
        }

        if (!serviceTypes.includes(input.serviceType)) {
            throw new MaintenanceValidationError("El tipo de mantenimiento no es válido");
        }
        if (!serviceClasses.includes(input.serviceClass)) {
            throw new MaintenanceValidationError("La clase de mantenimiento no es válida");
        }
        if (!statuses.includes(input.status)) {
            throw new MaintenanceValidationError("El estado del mantenimiento no es válido");
        }
        if (typeof input.category !== "string" || !input.category.trim() || input.category.trim().length > 60) {
            throw new MaintenanceValidationError("La categoría es obligatoria y no puede superar 60 caracteres");
        }
        if (!isValidDate(input.serviceDate)) {
            throw new MaintenanceValidationError("La fecha del servicio no es válida");
        }
        if (typeof input.description !== "string" || !input.description.trim() || input.description.trim().length > 1000) {
            throw new MaintenanceValidationError("La descripción es obligatoria y no puede superar 1000 caracteres");
        }
        if (!Number.isFinite(input.cost) || input.cost < 0) {
            throw new MaintenanceValidationError("El costo debe ser cero o un valor positivo");
        }
        if (typeof input.provider !== "string" || input.provider.length > 120 ||
            typeof input.observations !== "string" || input.observations.length > 300) {
            throw new MaintenanceValidationError("Revisa la longitud del proveedor o las observaciones");
        }
        if (input.mileage !== null && (!Number.isInteger(input.mileage) || input.mileage < 0)) {
            throw new MaintenanceValidationError("El kilometraje debe ser un entero válido");
        }
        if (input.serviceType === "Cambio de aceite" && input.status === "Realizado" && input.mileage === null) {
            throw new MaintenanceValidationError("El cambio de aceite realizado requiere kilometraje");
        }
        if (input.nextServiceDate !== null && !isValidDate(input.nextServiceDate)) {
            throw new MaintenanceValidationError("La próxima fecha de mantenimiento no es válida");
        }
        if (input.nextServiceMileage !== null && (!Number.isInteger(input.nextServiceMileage) || input.nextServiceMileage < 0)) {
            throw new MaintenanceValidationError("El próximo kilometraje debe ser un entero válido");
        }
        if (input.status === "Programado" && input.serviceDate < new Date().toISOString().slice(0, 10)) {
            throw new MaintenanceValidationError("Un mantenimiento programado debe tener fecha de hoy o futura");
        }
        if (input.nextServiceDate && input.nextServiceDate < input.serviceDate) {
            throw new MaintenanceValidationError("La próxima fecha no puede ser anterior al servicio");
        }
        if (input.nextServiceMileage !== null && input.mileage !== null && input.nextServiceMileage < input.mileage) {
            throw new MaintenanceValidationError("El próximo kilometraje no puede ser menor al actual");
        }

        try {
            return await MaintenanceRepository.create(conductorId, vehicle.id, {
                ...input,
                category: input.category.trim(),
                provider: input.provider.trim(),
                description: input.description.trim(),
                observations: input.observations.trim(),
            });
        } catch (error) {
            if (error instanceof Error && error.message === "MILEAGE_LOWER_THAN_CURRENT") {
                throw new MaintenanceValidationError("El kilometraje no puede ser menor al registrado para el vehículo");
            }
            throw error;
        }
    }

    static async attachEvidence(
        conductorId: number,
        input: MaintenanceEvidenceInput
    ): Promise<void> {
        if (!Number.isInteger(input.maintenanceId) || input.maintenanceId <= 0) {
            throw new MaintenanceValidationError("El registro de mantenimiento no es válido");
        }

        const storagePrefix = (process.env.S3_UPLOAD_PREFIX ?? "archivos").replace(/^\/+|\/+$/g, "");
        const expectedPrefix = `${storagePrefix}/mantenimientos/${input.maintenanceId}/${conductorId}/`;
        if (!input.objectKey.startsWith(expectedPrefix) ||
            !allowedContentTypes.includes(input.contentType) ||
            !Number.isInteger(input.size) || input.size <= 0 ||
            input.size > (input.contentType === "application/pdf" ? 50 : 2.5) * 1024 * 1024) {
            throw new MaintenanceValidationError("El comprobante no es válido");
        }

        const attached = await MaintenanceRepository.attachEvidence(conductorId, input);
        if (!attached) throw new MaintenanceConflictError("El mantenimiento no existe o no te pertenece");
    }
}
