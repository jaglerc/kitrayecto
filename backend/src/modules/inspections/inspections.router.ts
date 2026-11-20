import { Router } from "express";
import { AuthMiddleware } from "../../middleware/authmiddleware.js";
import { IdempotencyMiddleware } from "../../middleware/idempotency.middleware.js";
import { InspectionsController } from "./inspections.controller.js";

const router = Router();
router.get("/today", AuthMiddleware, InspectionsController.findToday);
router.get("/:id", AuthMiddleware, InspectionsController.findById);
router.post("/", AuthMiddleware, IdempotencyMiddleware, InspectionsController.create);
export default router;
