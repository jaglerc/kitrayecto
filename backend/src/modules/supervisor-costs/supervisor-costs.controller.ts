import type { Request, Response } from "express";

import { SupervisorCostsService, SupervisorCostsValidationError } from "./supervisor-costs.service.js";

const currentMonth = (): string => new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
}).format(new Date());

export class SupervisorCostsController {
    static async find(req: Request, res: Response): Promise<void> {
        const month = typeof req.query.month === "string" ? req.query.month : currentMonth();
        const vehicleParameter = req.query.vehicleId;
        if (vehicleParameter !== undefined && typeof vehicleParameter !== "string") {
            res.status(400).json({ message: "El vehículo seleccionado no es válido" });
            return;
        }
        const vehicleId = typeof vehicleParameter === "string" && vehicleParameter !== ""
            ? Number(vehicleParameter)
            : null;

        try {
            const result = await SupervisorCostsService.find({ month, vehicleId });
            res.status(200).json(result);
        } catch (error) {
            if (error instanceof SupervisorCostsValidationError) {
                res.status(400).json({ message: error.message });
                return;
            }

            console.error("No fue posible consultar los costos del supervisor:", error);
            res.status(500).json({ message: "No fue posible consultar los costos" });
        }
    }
}
