import type {
    NextFunction,
    Request,
    Response,
} from "express"

import { jwtVerify } from 'jose';

import type {
    AuthenticatedUser,
    UserRole
} from "../modules/auth/auth.types.js";

import { validRoles } from "../modules/auth/auth.types.js";

const isUserRole = (value: unknown): value is UserRole => {
    return validRoles.includes(value as UserRole)
}

export const AuthMiddleware = async (
    req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
        res.status(401).json({
            message: 'Debes iniciar sesión'
        });

        return;
    }
    const token = authorization.slice(7);

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        throw new Error('La variable de entorno no se encuentra');
    }

    try {
        //Conviete el jwtSecret en bytes manejables por la libreria Jose
        const secretKey = new TextEncoder().encode(jwtSecret);
        const { payload } = await jwtVerify(token, secretKey, { algorithms: ["HS256"] });

        if (typeof payload.sub !== "number" || !isUserRole(payload.role)) {
            res.status(401).json({
                message: 'El token no contiene datos validos'
            })
            return;
        }

        const authenticatedUser: AuthenticatedUser = {
            id: payload.sub,
            role: payload.role
        };

        res.locals.user = authenticatedUser;

        next();
      
    } catch {
        res.status(401).json({
            message: 'Token no valido'
        })
    }


}




