import type { Request, Response } from "express";

import type { AuthenticatedUser } from "../auth/auth.types.js";
import {
    MaintenanceConflictError,
    MaintenanceService,
    MaintenanceValidationError,
} from "./maintenance.service.js";
import type { CreateMaintenanceInput, MaintenanceEvidenceInput } from "./maintenance.types.js";

export class MaintenanceController {
    static async create(req: Request, res: Response): Promise<void> {
        const user = res.locals.user as AuthenticatedUser;
        if (user.role !== "Conductor") {
            res.status(403).json({ message: "Solo un conductor puede registrar mantenimiento" });
            return;
        }

        try {
            res.status(201).json(await MaintenanceService.create(user.id, req.body as CreateMaintenanceInput));
        } catch (error) {
            if (error instanceof MaintenanceValidationError) {
                res.status(400).json({ message: error.message });
                return;
            }
            if (error instanceof MaintenanceConflictError) {
                res.status(409).json({ message: error.message });
                return;
            }
            console.error("No fue posible registrar el mantenimiento:", error);
            res.status(500).json({ message: "No fue posible registrar el mantenimiento" });
        }
    }

    static async attachEvidence(req: Request, res: Response): Promise<void> {
        const user = res.locals.user as AuthenticatedUser;
        if (user.role !== "Conductor") {
            res.status(403).json({ message: "Solo un conductor puede adjuntar comprobantes" });
            return;
        }

        try {
            await MaintenanceService.attachEvidence(user.id, {
                ...req.body,
                maintenanceId: Number(req.params.id),
            } as MaintenanceEvidenceInput);
            res.status(204).end();
        } catch (error) {
            if (error instanceof MaintenanceValidationError) {
                res.status(400).json({ message: error.message });
                return;
            }
            if (error instanceof MaintenanceConflictError) {
                res.status(404).json({ message: error.message });
                return;
            }
            console.error("No fue posible adjuntar el comprobante:", error);
            res.status(500).json({ message: "No fue posible adjuntar el comprobante" });
        }
    }
}
