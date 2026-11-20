import { Router } from "express";

import { AuthMiddleware } from "../../middleware/authmiddleware.js";
import { MaintenanceController } from "./maintenance.controller.js";

const router = Router();

router.post("/", AuthMiddleware, MaintenanceController.create);
router.patch("/:id/evidence", AuthMiddleware, MaintenanceController.attachEvidence);

export default router;
