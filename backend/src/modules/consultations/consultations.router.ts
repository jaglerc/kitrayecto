import { Router } from "express";
import { AuthMiddleware } from "../../middleware/authmiddleware.js";
import { ConsultationsController } from "./consultations.controller.js";
const router=Router();
router.get("/:category",AuthMiddleware,ConsultationsController.findAll);
router.get("/:category/:id",AuthMiddleware,ConsultationsController.findById);
export default router;
