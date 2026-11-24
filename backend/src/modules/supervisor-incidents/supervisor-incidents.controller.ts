import type { Request, Response } from "express";
import { SupervisorIncidentsService } from "./supervisor-incidents.service.js";
import { caseCategories, caseStatuses, SupervisorIncidentsRepository } from "./supervisor-incidents.repository.js";

const validCategory = (value: unknown) => caseCategories.some((category) => category === value);
const validStatus = (value: unknown) => caseStatuses.some((status) => status === value);

export class SupervisorIncidentsController {
    static async findMany(req: Request, res: Response): Promise<void> {
        try {
            const page = Math.min(1_000_000, Math.max(1, Math.floor(Number(req.query.page) || 1)));
            const pageSize = Math.min(100, Math.max(1, Math.floor(Number(req.query.pageSize) || 20)));
            const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
            const category = String(req.query.category ?? "");
            const status = String(req.query.status ?? "");
            if ((category && !validCategory(category)) || (status && status !== "abiertos" && !validStatus(status))) {
                res.status(400).json({ message: "Filtro inválido" });
                return;
            }
            res.json(await SupervisorIncidentsService.findMany(page, pageSize, search, category, status));
        } catch (error) {
            console.error("No fue posible consultar las novedades:", error);
            res.status(500).json({ message: "No fue posible consultar las novedades" });
        }
    }

    static async record(req: Request, res: Response): Promise<void> {
        const category = String(req.params.category);
        const id = Number(req.params.id);
        const { status, note, revision, assigneeId } = req.body ?? {};
        if (!validCategory(category) || !Number.isInteger(id) || id <= 0 || id > 2147483647 ||
            !validStatus(status) || typeof note !== "string" || !note.trim() || note.trim().length > 2000 ||
            typeof revision !== "string" || !/^\d+$/.test(revision) || (assigneeId !== null && (!Number.isInteger(assigneeId) || assigneeId <= 0 || assigneeId > 2147483647))) {
            res.status(400).json({ message: "Selecciona un estado y escribe una nota de hasta 2000 caracteres" });
            return;
        }
        try {
            const result = await SupervisorIncidentsRepository.record(category, id, res.locals.user.id, status, note.trim(), revision, assigneeId);
            if (result === "saved") res.sendStatus(204);
            else if (result === "missing") res.status(404).json({ message: "El reporte ya no está disponible" });
            else if (result === "invalid-assignee") res.status(400).json({ message: "Selecciona un responsable activo" });
            else res.status(409).json({ message: "El caso cambió. Actualiza la bandeja antes de guardar." });
        } catch (error) {
            console.error("No fue posible guardar el seguimiento:", error);
            res.status(500).json({ message: "No fue posible guardar el seguimiento" });
        }
    }
}
