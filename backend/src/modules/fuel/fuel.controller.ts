import type { Request, Response } from "express";
import type { AuthenticatedUser } from "../auth/auth.types.js";
import { FuelConflictError, FuelService, FuelValidationError } from "./fuel.service.js";
import type { CreateFuelRecordInput } from "./fuel.types.js";

export class FuelController {
    static async create(req: Request, res: Response): Promise<void> {
        try {
            const user = res.locals.user as AuthenticatedUser;
            res.status(201).json(await FuelService.create(user.id, req.body as CreateFuelRecordInput));
        } catch (error) {
            if (error instanceof FuelValidationError) { res.status(400).json({ message: error.message }); return; }
            if (error instanceof FuelConflictError) { res.status(409).json({ message: error.message }); return; }
            console.error("No fue posible registrar el combustible:", error);
            res.status(500).json({ message: "No fue posible registrar el combustible" });
        }
    }
}
