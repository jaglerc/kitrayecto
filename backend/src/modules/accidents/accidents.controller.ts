import type { Request, Response } from "express";
import type { AuthenticatedUser } from "../auth/auth.types.js";
import { AccidentConflictError, AccidentNotFoundError, AccidentsService, AccidentValidationError } from "./accidents.service.js";
import type { CompleteAccidentInput } from "./accidents.types.js";

const idFrom = (value: string | string[] | undefined) => Number(Array.isArray(value) ? value[0] : value);

export class AccidentsController {
    static async report(_req: Request, res: Response): Promise<void> { await AccidentsController.respond(res, () => AccidentsService.report((res.locals.user as AuthenticatedUser).id), 201); }
    static async findPending(_req: Request, res: Response): Promise<void> { await AccidentsController.respond(res, () => AccidentsService.findPending((res.locals.user as AuthenticatedUser).id)); }
    static async findById(req: Request, res: Response): Promise<void> { await AccidentsController.respond(res, () => AccidentsService.findById((res.locals.user as AuthenticatedUser).id, idFrom(req.params.id))); }
    static async complete(req: Request, res: Response): Promise<void> { await AccidentsController.respond(res, async () => { await AccidentsService.complete((res.locals.user as AuthenticatedUser).id, idFrom(req.params.id), req.body as CompleteAccidentInput); return { message: "Formulario de accidente registrado" }; }); }

    private static async respond(res: Response, action: () => Promise<unknown>, status = 200): Promise<void> {
        try { res.status(status).json(await action()); }
        catch (error) {
            if (error instanceof AccidentValidationError) { res.status(400).json({ message: error.message }); return; }
            if (error instanceof AccidentConflictError) { res.status(409).json({ message: error.message }); return; }
            if (error instanceof AccidentNotFoundError) { res.status(404).json({ message: error.message }); return; }
            console.error("No fue posible procesar el accidente:", error);
            res.status(500).json({ message: "No fue posible procesar el accidente" });
        }
    }
}
