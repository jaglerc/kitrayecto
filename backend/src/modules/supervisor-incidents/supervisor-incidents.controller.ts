import type { Request, Response } from "express";
import { SupervisorIncidentsService } from "./supervisor-incidents.service.js";

export class SupervisorIncidentsController {
    static async findMany(req: Request, res: Response): Promise<void> {
        try {
            const page = Math.max(1, Number(req.query.page) || 1);
            const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));
            const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
            res.status(200).json(await SupervisorIncidentsService.findMany(page, pageSize, search));
        } catch (error) {
            console.error("No fue posible consultar las novedades:", error);
            res.status(500).json({ message: "No fue posible consultar las novedades" });
        }
    }
}
