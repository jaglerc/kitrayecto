import { Router } from "express";
import { AuthMiddleware } from "../../middleware/authmiddleware.js";
import { RoleMiddleware } from "../../middleware/rolemiddleware.js";
import { SupervisorDashboardController } from "./supervisor-dashboard.controller.js";
const router = Router();
router.get("/", AuthMiddleware, RoleMiddleware("Supervisor", "Administrador"), SupervisorDashboardController.find);
export default router;
