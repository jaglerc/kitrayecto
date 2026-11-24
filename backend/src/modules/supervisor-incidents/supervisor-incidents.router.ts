import { Router } from "express";
import { AuthMiddleware } from "../../middleware/authmiddleware.js";
import { RoleMiddleware } from "../../middleware/rolemiddleware.js";
import { SupervisorIncidentsController } from "./supervisor-incidents.controller.js";

const router = Router();
router.use(AuthMiddleware, RoleMiddleware("Supervisor", "Administrador"));
router.get("/", SupervisorIncidentsController.findMany);
router.post("/:category/:id/follow-up", SupervisorIncidentsController.record);
export default router;
