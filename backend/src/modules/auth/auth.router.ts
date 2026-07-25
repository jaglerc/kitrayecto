import { AuthMiddleware } from '../../middleware/authmiddleware.js';
import { RoleMiddleware } from '../../middleware/rolemiddleware.js';

import { Router } from "express";

import { AuthController } from "../auth/auth.controller.js";
const router = Router();

router.post("/login", AuthController.login);


export default router;