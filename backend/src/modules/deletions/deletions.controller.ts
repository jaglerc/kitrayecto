import type { Request, Response } from "express";
import { DeletionError, DeletionsService } from "./deletions.service.js";

async function respond(res: Response, action: () => Promise<void>): Promise<void> {
    try {
        await action();
        res.status(200).json({ message: "Eliminado correctamente. La limpieza de archivos se procesará automáticamente." });
    } catch (error) {
        if (error instanceof DeletionError) { res.status(error.status).json({ message: error.message }); return; }
        console.error("No fue posible eliminar el registro:", error);
        res.status(500).json({ message: "No fue posible completar la eliminación. Vuelve a intentarlo." });
    }
}

export class DeletionsController {
    static userDocument(req: Request, res: Response): Promise<void> {
        return respond(res, () => DeletionsService.userDocument(Number(req.params.userId), Number(req.params.documentId)));
    }
    static insurance(req: Request, res: Response): Promise<void> {
        return respond(res, () => DeletionsService.legalRecord(Number(req.params.vehicleId), "insurance", Number(req.params.recordId)));
    }
    static technical(req: Request, res: Response): Promise<void> {
        return respond(res, () => DeletionsService.legalRecord(Number(req.params.vehicleId), "technical-inspections", Number(req.params.recordId)));
    }
}
