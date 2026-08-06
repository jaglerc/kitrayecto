import { Router } from "express";

import { AuthMiddleware } from "../../middleware/authmiddleware.js";
import { RoleMiddleware } from "../../middleware/rolemiddleware.js";
import { SupervisorUsersController } from "./supervisor-users.controller.js";

const router = Router();

router.use(
    AuthMiddleware,
    RoleMiddleware("Supervisor", "Administrador")
);

router.get("/", SupervisorUsersController.findMany);
router.post("/", SupervisorUsersController.create);
router.get("/:userId", SupervisorUsersController.findById);
router.patch("/:userId", SupervisorUsersController.update);
router.patch("/:userId/status", SupervisorUsersController.updateStatus);
router.put("/:userId/documents", SupervisorUsersController.createDocument);

export default router;
