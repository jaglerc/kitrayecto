import type {
    Request,
    Response,

} from "express";

import { AuthService } from "../auth/auth.service.js";
export class AuthController {

    static async login(req: Request, res: Response): Promise<void> {

        const { cedula, password } = req.body;

        const response = await AuthService.login({ cedula, password });

        res.status(200).json(response);
    }
}
