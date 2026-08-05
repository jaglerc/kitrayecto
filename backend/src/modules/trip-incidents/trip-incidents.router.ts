import { Router } from "express";
import { AuthMiddleware } from "../../middleware/authmiddleware.js";
import { TripIncidentsController } from "./trip-incidents.controller.js";

const router = Router();
router.post("/", AuthMiddleware, TripIncidentsController.create);
export default router;
