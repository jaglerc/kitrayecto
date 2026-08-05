import { Router } from "express";
import { AuthMiddleware } from "../../middleware/authmiddleware.js";
import { FuelController } from "./fuel.controller.js";

const router = Router();
router.post("/", AuthMiddleware, FuelController.create);
export default router;
