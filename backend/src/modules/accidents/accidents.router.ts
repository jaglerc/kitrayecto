import { Router } from "express";
import { AuthMiddleware } from "../../middleware/authmiddleware.js";
import { IdempotencyMiddleware } from "../../middleware/idempotency.middleware.js";
import { AccidentsController } from "./accidents.controller.js";

const router = Router();
router.post("/report", AuthMiddleware, IdempotencyMiddleware, AccidentsController.report);
router.get("/pending", AuthMiddleware, AccidentsController.findPending);
router.get("/:id", AuthMiddleware, AccidentsController.findById);
router.patch("/:id/complete", AuthMiddleware, IdempotencyMiddleware, AccidentsController.complete);
export default router;
