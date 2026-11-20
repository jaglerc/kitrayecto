import { Router } from "express";
import { AuthMiddleware } from "../../middleware/authmiddleware.js";
import { IdempotencyMiddleware } from "../../middleware/idempotency.middleware.js";
import { FuelController } from "./fuel.controller.js";

const router = Router();
router.post("/", AuthMiddleware, IdempotencyMiddleware, FuelController.create);
export default router;
