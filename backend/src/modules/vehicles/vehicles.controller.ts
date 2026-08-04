import type { Request, Response } from "express";

import { VehiclesService } from "./vehicles.service.js";

export class VehiclesController {
    static async findByType(
        req: Request,
        res: Response
    ): Promise<void> {
        const { type } = req.query;

        if (!VehiclesService.isVehicleType(type)) {
            res.status(400).json({
                message: "El tipo de vehículo no es válido",
            });
            return;
        }

        const vehicles = await VehiclesService.findByType(type);
        res.status(200).json(vehicles);
    }
}
