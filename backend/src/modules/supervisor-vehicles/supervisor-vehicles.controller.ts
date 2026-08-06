import type { Request, Response } from "express";

import type { AuthenticatedUser } from "../auth/auth.types.js";
import { SupervisorVehiclesService, SupervisorVehicleConflictError, SupervisorVehicleNotFoundError, SupervisorVehicleValidationError } from "./supervisor-vehicles.service.js";
import type { SupervisorVehicleInput, VehicleLegalDocumentInput } from "./supervisor-vehicles.types.js";

const text = (value: unknown): string => typeof value === "string" ? value : "";
const nullableText = (value: unknown): string | null => typeof value === "string" && value ? value : null;
const numberOrNull = (value: unknown): number | null => value === null || value === "" || value === undefined ? null : Number(value);

const inputFrom = (body: Record<string, unknown>): SupervisorVehicleInput => ({
    type: text(body.type) as SupervisorVehicleInput["type"],
    databaseType: "Camioneta",
    plate: text(body.plate),
    transitLicense: nullableText(body.transitLicense),
    brand: nullableText(body.brand),
    owner: nullableText(body.owner),
    currentMileage: numberOrNull(body.currentMileage),
    oilControlEnabled: body.oilControlEnabled === true,
    oilIntervalKm: numberOrNull(body.oilIntervalKm),
    oilWarningMarginKm: numberOrNull(body.oilWarningMarginKm),
    oilReferenceMileage: numberOrNull(body.oilReferenceMileage),
    fumigationRequired: body.fumigationRequired === true,
    fumigationFrequencyDays: numberOrNull(body.fumigationFrequencyDays),
    lastFumigationDate: nullableText(body.lastFumigationDate),
});

const legalDocumentFrom = (body: Record<string, unknown>): VehicleLegalDocumentInput => ({
    number: text(body.number),
    type: nullableText(body.type),
    validFrom: nullableText(body.validFrom),
    expiresAt: text(body.expiresAt),
    price: numberOrNull(body.price),
    provider: nullableText(body.provider),
    objectKey: text(body.objectKey),
    fileName: text(body.fileName),
});

export class SupervisorVehiclesController {
    static async findMany(req: Request, res: Response): Promise<void> {
        const type = SupervisorVehiclesService.isVehicleType(req.query.type) ? req.query.type : null;
        const activeValue = typeof req.query.active === "string" ? req.query.active : "";
        try {
            res.status(200).json(await SupervisorVehiclesService.findMany({
                search: typeof req.query.search === "string" ? req.query.search.trim() : "",
                type,
                active: activeValue === "true" ? true : activeValue === "false" ? false : null,
                page: Math.max(1, Number(req.query.page) || 1),
                pageSize: Math.min(100, Math.max(1, Number(req.query.pageSize) || 12)),
            }));
        } catch (error) { this.handle(error, res); }
    }

    static async findById(req: Request, res: Response): Promise<void> {
        try { res.status(200).json(await SupervisorVehiclesService.findById(Number(req.params.vehicleId))); }
        catch (error) { this.handle(error, res); }
    }

    static async create(req: Request, res: Response): Promise<void> {
        try { res.status(201).json(await SupervisorVehiclesService.create(res.locals.user as AuthenticatedUser, inputFrom(req.body as Record<string, unknown>))); }
        catch (error) { this.handle(error, res); }
    }

    static async update(req: Request, res: Response): Promise<void> {
        try { res.status(200).json(await SupervisorVehiclesService.update(res.locals.user as AuthenticatedUser, Number(req.params.vehicleId), inputFrom(req.body as Record<string, unknown>))); }
        catch (error) { this.handle(error, res); }
    }

    static async updateStatus(req: Request, res: Response): Promise<void> {
        if (typeof req.body?.active !== "boolean") { res.status(400).json({ message: "El estado no es válido" }); return; }
        try { res.status(200).json(await SupervisorVehiclesService.updateStatus(Number(req.params.vehicleId), req.body.active)); }
        catch (error) { this.handle(error, res); }
    }

    static async createInsurance(req: Request, res: Response): Promise<void> {
        try { res.status(201).json(await SupervisorVehiclesService.createInsurance(res.locals.user as AuthenticatedUser, Number(req.params.vehicleId), legalDocumentFrom(req.body as Record<string, unknown>))); }
        catch (error) { this.handle(error, res); }
    }

    static async createTechnicalInspection(req: Request, res: Response): Promise<void> {
        try { res.status(201).json(await SupervisorVehiclesService.createTechnicalInspection(res.locals.user as AuthenticatedUser, Number(req.params.vehicleId), legalDocumentFrom(req.body as Record<string, unknown>))); }
        catch (error) { this.handle(error, res); }
    }

    private static handle(error: unknown, res: Response): void {
        if (error instanceof SupervisorVehicleValidationError) { res.status(400).json({ message: error.message }); return; }
        if (error instanceof SupervisorVehicleConflictError) { res.status(409).json({ message: error.message }); return; }
        if (error instanceof SupervisorVehicleNotFoundError) { res.status(404).json({ message: error.message }); return; }
        console.error("No fue posible gestionar el vehículo:", error);
        res.status(500).json({ message: "No fue posible gestionar el vehículo" });
    }
}
