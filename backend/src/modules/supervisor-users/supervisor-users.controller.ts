import type { Request, Response } from "express";

import type { AuthenticatedUser, UserRole } from "../auth/auth.types.js";
import {
    SupervisorUserConflictError,
    SupervisorUserForbiddenError,
    SupervisorUserNotFoundError,
    SupervisorUsersService,
    SupervisorUserValidationError,
} from "./supervisor-users.service.js";
import { supervisorDocumentTypes } from "./supervisor-users.types.js";
import type {
    CreateSupervisorUserDocumentInput,
    CreateSupervisorUserInput,
    SupervisorDocumentType,
} from "./supervisor-users.types.js";

interface CreateUserBody {
    cedula?: unknown;
    nombre?: unknown;
    segundoNombre?: unknown;
    apellido?: unknown;
    fechaExpedicionDocumento?: unknown;
    ciudadExpedicionDocumento?: unknown;
    eps?: unknown;
    telefono?: unknown;
    requiereManipulacionAlimentos?: unknown;
    categoriaLicencia?: unknown;
    vencimientoLicencia?: unknown;
    role?: unknown;
    password?: unknown;
}

interface CreateDocumentBody {
    tipoDocumento?: unknown;
    objectKey?: unknown;
    fechaVigencia?: unknown;
    fechaVencimiento?: unknown;
}

const text = (value: unknown): string => typeof value === "string" ? value : "";
const nullableText = (value: unknown): string | null => {
    return typeof value === "string" && value ? value : null;
};

export class SupervisorUsersController {
    static async create(req: Request, res: Response): Promise<void> {
        const body = req.body as CreateUserBody;
        const input: CreateSupervisorUserInput = {
            cedula: text(body.cedula),
            nombre: text(body.nombre),
            segundoNombre: nullableText(body.segundoNombre),
            apellido: text(body.apellido),
            fechaExpedicionDocumento: nullableText(body.fechaExpedicionDocumento),
            ciudadExpedicionDocumento: nullableText(body.ciudadExpedicionDocumento),
            eps: nullableText(body.eps),
            telefono: nullableText(body.telefono),
            requiereManipulacionAlimentos: body.requiereManipulacionAlimentos === true,
            categoriaLicencia: nullableText(body.categoriaLicencia),
            vencimientoLicencia: nullableText(body.vencimientoLicencia),
            role: text(body.role) as UserRole,
            password: text(body.password),
        };

        try {
            const actor = res.locals.user as AuthenticatedUser;
            const created = await SupervisorUsersService.create(actor, input);
            res.status(201).json(created);
        } catch (error) {
            SupervisorUsersController.handleError(error, res);
        }
    }

    static async createDocument(req: Request, res: Response): Promise<void> {
        const body = req.body as CreateDocumentBody;
        const tipoDocumento = text(body.tipoDocumento) as SupervisorDocumentType;

        if (!supervisorDocumentTypes.includes(tipoDocumento)) {
            res.status(400).json({ message: "El tipo de documento no es válido" });
            return;
        }

        const input: CreateSupervisorUserDocumentInput = {
            tipoDocumento,
            objectKey: text(body.objectKey),
            fechaVigencia: nullableText(body.fechaVigencia),
            fechaVencimiento: nullableText(body.fechaVencimiento),
        };

        try {
            const actor = res.locals.user as AuthenticatedUser;
            const userId = Number(req.params.userId);
            const created = await SupervisorUsersService.createDocument(
                actor,
                userId,
                input
            );
            res.status(201).json(created);
        } catch (error) {
            SupervisorUsersController.handleError(error, res);
        }
    }

    private static handleError(error: unknown, res: Response): void {
        if (error instanceof SupervisorUserValidationError) {
            res.status(400).json({ message: error.message });
            return;
        }
        if (error instanceof SupervisorUserConflictError) {
            res.status(409).json({ message: error.message });
            return;
        }
        if (error instanceof SupervisorUserNotFoundError) {
            res.status(404).json({ message: error.message });
            return;
        }
        if (error instanceof SupervisorUserForbiddenError) {
            res.status(403).json({ message: error.message });
            return;
        }

        console.error("No fue posible gestionar el usuario:", error);
        res.status(500).json({ message: "No fue posible gestionar el usuario" });
    }
}
