import { Router } from "express";

import { AuthMiddleware } from "../../middleware/authmiddleware.js";
import { InspectionTemplatesController } from "./inspection-templates.controller.js";

const router = Router();

router.get(
    "/",
    AuthMiddleware,
    InspectionTemplatesController.findByVehicleType
);

export default router;
