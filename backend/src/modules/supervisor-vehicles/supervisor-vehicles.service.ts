import type { AuthenticatedUser } from "../auth/auth.types.js";
import type { DatabaseVehicleType, VehicleType } from "../vehicles/vehicles.types.js";
import { SupervisorVehiclesRepository } from "./supervisor-vehicles.repository.js";
import type {
    SupervisorVehicleDetail,
    SupervisorVehicleInput,
    SupervisorVehicleListInput,
    SupervisorVehicleListResult,
} from "./supervisor-vehicles.types.js";

const databaseTypes: Record<VehicleType, DatabaseVehicleType> = {
    camioneta: "Camioneta",
    motocicleta: "Motocicleta",
    motocarguero: "Motocarguero",
    carro: "Carro",
};

export class SupervisorVehicleValidationError extends Error {}
export class SupervisorVehicleConflictError extends Error {}
export class SupervisorVehicleNotFoundError extends Error {}

const optionalText = (value: string | null): string | null => value?.trim() || null;
const isoDate = (value: string | null): boolean => value === null || /^\d{4}-\d{2}-\d{2}$/.test(value);

export class SupervisorVehiclesService {
    static isVehicleType(value: unknown): value is VehicleType {
        return typeof value === "string" && value in databaseTypes;
    }

    static findMany(input: SupervisorVehicleListInput): Promise<SupervisorVehicleListResult> {
        return SupervisorVehiclesRepository.findMany(input);
    }

    static async findById(vehicleId: number): Promise<SupervisorVehicleDetail> {
        this.validateId(vehicleId);
        const vehicle = await SupervisorVehiclesRepository.findById(vehicleId);
        if (!vehicle) throw new SupervisorVehicleNotFoundError("El vehículo no existe");
        return vehicle;
    }

    static async create(actor: AuthenticatedUser, input: SupervisorVehicleInput): Promise<SupervisorVehicleDetail> {
        const normalized = this.normalize(input);
        await this.validate(normalized);
        if (await SupervisorVehiclesRepository.plateExists(normalized.plate)) {
            throw new SupervisorVehicleConflictError("Ya existe un vehículo con esta placa");
        }
        return SupervisorVehiclesRepository.create(actor, normalized);
    }

    static async update(actor: AuthenticatedUser, vehicleId: number, input: SupervisorVehicleInput): Promise<SupervisorVehicleDetail> {
        this.validateId(vehicleId);
        const existing = await this.findById(vehicleId);
        const normalized = this.normalize(input);
        await this.validate(normalized);
        if (normalized.currentMileage < existing.currentMileage) {
            throw new SupervisorVehicleValidationError("El kilometraje no puede ser menor al registrado actualmente");
        }
        if (await SupervisorVehiclesRepository.plateExists(normalized.plate, vehicleId)) {
            throw new SupervisorVehicleConflictError("Ya existe un vehículo con esta placa");
        }
        const updated = await SupervisorVehiclesRepository.update(vehicleId, actor, normalized);
        if (!updated) throw new SupervisorVehicleNotFoundError("El vehículo no existe");
        return updated;
    }

    static async updateStatus(vehicleId: number, active: boolean): Promise<SupervisorVehicleDetail> {
        this.validateId(vehicleId);
        const updated = await SupervisorVehiclesRepository.updateStatus(vehicleId, active);
        if (!updated) throw new SupervisorVehicleNotFoundError("El vehículo no existe");
        return updated;
    }

    private static normalize(input: SupervisorVehicleInput): SupervisorVehicleInput {
        return {
            ...input,
            databaseType: databaseTypes[input.type],
            plate: input.plate.trim().toUpperCase().replace(/\s+/g, ""),
            transitLicense: optionalText(input.transitLicense),
            brand: optionalText(input.brand),
            owner: optionalText(input.owner),
        };
    }

    private static async validate(input: SupervisorVehicleInput): Promise<void> {
        if (!this.isVehicleType(input.type) || !input.databaseType) throw new SupervisorVehicleValidationError("El tipo de vehículo no es válido");
        if (!/^[A-Z0-9-]{3,12}$/.test(input.plate)) throw new SupervisorVehicleValidationError("La placa no es válida");
        if (!Number.isFinite(input.currentMileage) || input.currentMileage < 0) throw new SupervisorVehicleValidationError("El kilometraje no es válido");
        if (input.oilControlEnabled) {
            if (!Number.isInteger(input.oilIntervalKm) || input.oilIntervalKm! < 500) throw new SupervisorVehicleValidationError("El intervalo de aceite debe ser de mínimo 500 km");
            if (!Number.isInteger(input.oilWarningMarginKm) || input.oilWarningMarginKm! < 0 || input.oilWarningMarginKm! >= input.oilIntervalKm!) throw new SupervisorVehicleValidationError("El margen de alerta de aceite no es válido");
            if (input.oilReferenceMileage !== null && (input.oilReferenceMileage < 0 || input.oilReferenceMileage > input.currentMileage)) throw new SupervisorVehicleValidationError("El kilometraje del último cambio de aceite no es válido");
        }
        if (input.fumigationRequired && (!Number.isInteger(input.fumigationFrequencyDays) || input.fumigationFrequencyDays! < 1)) throw new SupervisorVehicleValidationError("La frecuencia de fumigación no es válida");
        if (!isoDate(input.lastFumigationDate)) throw new SupervisorVehicleValidationError("La fecha de fumigación no es válida");
    }

    private static validateId(vehicleId: number): void {
        if (!Number.isInteger(vehicleId) || vehicleId <= 0) throw new SupervisorVehicleValidationError("El vehículo no es válido");
    }
}
