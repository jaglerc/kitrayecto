import type { Request, Response } from "express";
import { SupervisorDashboardService } from "./supervisor-dashboard.service.js";
export class SupervisorDashboardController { static async find(_req: Request, res: Response): Promise<void> { try { res.json(await SupervisorDashboardService.find()); } catch (error) { console.error("No fue posible consultar el panel del supervisor:", error); res.status(500).json({ message: "No fue posible consultar el panel del supervisor" }); } } }
