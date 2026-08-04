import type { Request, Response } from "express";

import { InspectionTemplatesService } from "./inspection-templates.service.js";

export class InspectionTemplatesController {
    static async findByVehicleType(
        req: Request,
        res: Response
    ): Promise<void> {
        const { type } = req.query;

        if (!InspectionTemplatesService.isVehicleType(type)) {
            res.status(400).json({
                message: "El tipo de vehículo no es válido",
            });
            return;
        }

        const templates =
            await InspectionTemplatesService.findByVehicleType(type);

        res.status(200).json(templates);
    }
}
