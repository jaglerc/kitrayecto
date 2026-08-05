import type { Request, Response } from "express";
import type { AuthenticatedUser } from "../auth/auth.types.js";
import { TripConflictError, TripNotFoundError, TripsService, TripValidationError } from "./trips.service.js";
import type { CreateTripInput } from "./trips.types.js";

export class TripsController {
    static async findStatus(_req: Request, res: Response): Promise<void> {
        try {
            const user = res.locals.user as AuthenticatedUser;
            res.status(200).json(await TripsService.findStatus(user.id));
        } catch (error) {
            console.error("No fue posible consultar el estado del viaje:", error);
            res.status(500).json({ message: "No fue posible consultar el estado del viaje" });
        }
    }

    static async create(req: Request, res: Response): Promise<void> {
        try {
            const user = res.locals.user as AuthenticatedUser;
            res.status(201).json(await TripsService.create(user.id, req.body as CreateTripInput));
        } catch (error) {
            if (error instanceof TripValidationError) { res.status(400).json({ message: error.message }); return; }
            if (error instanceof TripConflictError) { res.status(409).json({ message: error.message }); return; }
            console.error("No fue posible registrar el viaje:", error);
            res.status(500).json({ message: "No fue posible registrar el viaje" });
        }
    }

    static async finish(req: Request, res: Response): Promise<void> {
        try {
            const user = res.locals.user as AuthenticatedUser;
            await TripsService.finish(user.id, Number(req.params.id));
            res.status(200).json({ message: "Viaje finalizado correctamente" });
        } catch (error) {
            if (error instanceof TripValidationError) { res.status(400).json({ message: error.message }); return; }
            if (error instanceof TripNotFoundError) { res.status(404).json({ message: error.message }); return; }
            console.error("No fue posible finalizar el viaje:", error);
            res.status(500).json({ message: "No fue posible finalizar el viaje" });
        }
    }
}
