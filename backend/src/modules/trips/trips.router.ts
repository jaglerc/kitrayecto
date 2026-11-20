import { Router } from "express";
import { AuthMiddleware } from "../../middleware/authmiddleware.js";
import { IdempotencyMiddleware } from "../../middleware/idempotency.middleware.js";
import { TripsController } from "./trips.controller.js";

const router = Router();
router.get("/status", AuthMiddleware, TripsController.findStatus);
router.get("/locations", AuthMiddleware, TripsController.findLocations);
router.post("/", AuthMiddleware, IdempotencyMiddleware, TripsController.create);
router.patch("/:id/finish", AuthMiddleware, IdempotencyMiddleware, TripsController.finish);
export default router;
