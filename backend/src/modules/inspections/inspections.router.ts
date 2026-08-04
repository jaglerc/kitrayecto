import { Router } from "express";
import { AuthMiddleware } from "../../middleware/authmiddleware.js";
import { InspectionsController } from "./inspections.controller.js";

const router = Router();
router.post("/", AuthMiddleware, InspectionsController.create);
export default router;
