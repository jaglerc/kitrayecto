import { Router } from "express";

import { AuthMiddleware } from "../../middleware/authmiddleware.js";
import { RoleMiddleware } from "../../middleware/rolemiddleware.js";
import { SupervisorUsersController } from "./supervisor-users.controller.js";

const router = Router();

router.use(
    AuthMiddleware,
    RoleMiddleware("Supervisor", "Administrador")
);

router.post("/", SupervisorUsersController.create);
router.post("/:userId/documents", SupervisorUsersController.createDocument);

export default router;
