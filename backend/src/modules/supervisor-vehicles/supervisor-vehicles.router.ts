import { Router } from "express";
import { AuthMiddleware } from "../../middleware/authmiddleware.js";
import { RoleMiddleware } from "../../middleware/rolemiddleware.js";
import { SupervisorVehiclesController } from "./supervisor-vehicles.controller.js";

const router = Router();
router.use(AuthMiddleware, RoleMiddleware("Supervisor", "Administrador"));
router.get("/", SupervisorVehiclesController.findMany);
router.post("/", SupervisorVehiclesController.create);
router.get("/:vehicleId", SupervisorVehiclesController.findById);
router.patch("/:vehicleId", SupervisorVehiclesController.update);
router.patch("/:vehicleId/status", SupervisorVehiclesController.updateStatus);
export default router;
