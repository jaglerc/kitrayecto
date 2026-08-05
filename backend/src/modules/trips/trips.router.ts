import { Router } from "express";
import { AuthMiddleware } from "../../middleware/authmiddleware.js";
import { TripsController } from "./trips.controller.js";

const router = Router();
router.get("/status", AuthMiddleware, TripsController.findStatus);
router.post("/", AuthMiddleware, TripsController.create);
router.patch("/:id/finish", AuthMiddleware, TripsController.finish);
export default router;
