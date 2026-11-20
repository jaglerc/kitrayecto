import { Router } from "express";

import { AuthMiddleware } from "../../middleware/authmiddleware.js";
import { RoleMiddleware } from "../../middleware/rolemiddleware.js";
import { SupervisorCostsController } from "./supervisor-costs.controller.js";

const router = Router();

router.get(
    "/",
    AuthMiddleware,
    RoleMiddleware("Supervisor", "Administrador"),
    SupervisorCostsController.find
);

export default router;
