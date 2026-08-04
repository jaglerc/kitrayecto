import { Router } from "express";

import { AuthMiddleware } from "../../middleware/authmiddleware.js";
import { VehiclesController } from "./vehicles.controller.js";

const router = Router();

router.get("/", AuthMiddleware, VehiclesController.findByType);

export default router;
