import type { Request, Response } from "express";
import type { AuthenticatedUser } from "../auth/auth.types.js";
import { InspectionsService, InspectionValidationError } from "./inspections.service.js";
import type { CreateInspectionInput } from "./inspections.types.js";

export class InspectionsController {
    static async create(req: Request, res: Response): Promise<void> {
        try {
            const user = res.locals.user as AuthenticatedUser;
            const inspection = await InspectionsService.create(user.id, req.body as CreateInspectionInput);
            res.status(201).json(inspection);
        } catch (error) {
            if (error instanceof InspectionValidationError) {
                res.status(400).json({ message: error.message });
                return;
            }
            console.error("No fue posible registrar la inspección:", error);
            res.status(500).json({ message: "No fue posible registrar el checklist" });
        }
    }
}
