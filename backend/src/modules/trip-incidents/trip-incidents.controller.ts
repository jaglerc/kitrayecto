import type { Request, Response } from "express";
import type { AuthenticatedUser } from "../auth/auth.types.js";
import { TripIncidentConflictError, TripIncidentsService, TripIncidentValidationError } from "./trip-incidents.service.js";
import type { CreateTripIncidentInput } from "./trip-incidents.types.js";

export class TripIncidentsController {
    static async create(req: Request, res: Response): Promise<void> {
        try {
            const user = res.locals.user as AuthenticatedUser;
            res.status(201).json(await TripIncidentsService.create(user.id, req.body as CreateTripIncidentInput));
        } catch (error) {
            if (error instanceof TripIncidentValidationError) { res.status(400).json({ message: error.message }); return; }
            if (error instanceof TripIncidentConflictError) { res.status(409).json({ message: error.message }); return; }
            console.error("No fue posible registrar la novedad:", error);
            res.status(500).json({ message: "No fue posible registrar la novedad" });
        }
    }
}
