import { Router } from "express";
import { AuthMiddleware } from "../../middleware/authmiddleware.js";
import { IdempotencyMiddleware } from "../../middleware/idempotency.middleware.js";
import { TripIncidentsController } from "./trip-incidents.controller.js";

const router = Router();
router.post("/", AuthMiddleware, IdempotencyMiddleware, TripIncidentsController.create);
export default router;
