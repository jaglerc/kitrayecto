import type {
    Request,
    Response,
    NextFunction
} from 'express';

import type { UserRole } from "../modules/auth/auth.types.js";

export const RoleMiddleware = (...rolesPermitidos: UserRole[]) =>
    (_req: Request, res: Response, next: NextFunction): void => {
        const user = res.locals.user;

        if (!user) {
            res.status(401).json({
                message: "Usuario no autenticado"
            });
            return;
        }

        if (!rolesPermitidos.includes(user.role)) {
            res.status(403).json({
                message: "No tiene permisos para realiza esta acción"
            });
            return;
        }

        next();
    }