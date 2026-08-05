import type { Request, Response } from "express";
import type { AuthenticatedUser } from "../auth/auth.types.js";
import { ConsultationNotFoundError, ConsultationsService, ConsultationValidationError } from "./consultations.service.js";
const param = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] ?? "" : value ?? "";
export class ConsultationsController {
    static async findAll(req: Request, res: Response): Promise<void> { try { const user=res.locals.user as AuthenticatedUser; res.json(await ConsultationsService.findAll(user.id,param(req.params.category))); } catch(error) { ConsultationsController.error(error,res); } }
    static async findById(req: Request, res: Response): Promise<void> { try { const user=res.locals.user as AuthenticatedUser; res.json(await ConsultationsService.findById(user.id,param(req.params.category),Number(param(req.params.id)))); } catch(error) { ConsultationsController.error(error,res); } }
    private static error(error: unknown,res: Response) { if(error instanceof ConsultationValidationError){res.status(400).json({message:error.message});return;} if(error instanceof ConsultationNotFoundError){res.status(404).json({message:error.message});return;} console.error("No fue posible consultar el historial:",error);res.status(500).json({message:"No fue posible consultar el historial"}); }
}
