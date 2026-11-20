import { Router } from "express";

import { AuthMiddleware } from "../../middleware/authmiddleware.js";
import { IdempotencyMiddleware } from "../../middleware/idempotency.middleware.js";
import { MaintenanceController } from "./maintenance.controller.js";

const router = Router();

router.post("/", AuthMiddleware, IdempotencyMiddleware, MaintenanceController.create);
router.patch("/:id/evidence", AuthMiddleware, IdempotencyMiddleware, MaintenanceController.attachEvidence);

export default router;
