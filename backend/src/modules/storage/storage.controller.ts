import type { Request, Response } from "express";

import type { AuthenticatedUser } from "../auth/auth.types.js";
import {
    StorageService,
    StorageValidationError,
} from "./storage.service.js";
import {
    allowedContentTypes,
    storageModules,
} from "./storage.types.js";
import type {
    AllowedContentType,
    StorageModule,
} from "./storage.types.js";

interface UploadUrlBody {
    module?: unknown;
    referenceId?: unknown;
    contentType?: unknown;
    size?: unknown;
}

interface ConfirmUploadBody {
    module?: unknown;
    referenceId?: unknown;
    objectKey?: unknown;
}

const isStorageModule = (value: unknown): value is StorageModule => {
    return storageModules.includes(value as StorageModule);
};

const isAllowedContentType = (
    value: unknown
): value is AllowedContentType => {
    return allowedContentTypes.includes(value as AllowedContentType);
};

export class StorageController {
    static async createUploadUrl(
        req: Request,
        res: Response
    ): Promise<void> {
        const body = req.body as UploadUrlBody;

        if (!isStorageModule(body.module)) {
            res.status(400).json({ message: "El módulo no es válido" });
            return;
        }

        if (!isAllowedContentType(body.contentType)) {
            res.status(400).json({
                message: "El tipo de archivo no está permitido",
            });
            return;
        }

        const user = res.locals.user as AuthenticatedUser;

        try {
            const result = await StorageService.createUploadUrl({
                module: body.module,
                referenceId: Number(body.referenceId),
                contentType: body.contentType,
                size: Number(body.size),
                userId: user.id,
            });

            res.status(200).json(result);
        } catch (error) {
            if (error instanceof StorageValidationError) {
                res.status(400).json({ message: error.message });
                return;
            }

            console.error("No fue posible generar la URL de carga:", error);
            res.status(500).json({
                message: "No fue posible autorizar la carga del archivo",
            });
        }
    }

    static async confirmUpload(
        req: Request,
        res: Response
    ): Promise<void> {
        const body = req.body as ConfirmUploadBody;

        if (!isStorageModule(body.module)) {
            res.status(400).json({ message: "El módulo no es válido" });
            return;
        }

        if (typeof body.objectKey !== "string" || !body.objectKey) {
            res.status(400).json({ message: "La ruta del archivo no es válida" });
            return;
        }

        const user = res.locals.user as AuthenticatedUser;

        try {
            const result = await StorageService.confirmUpload({
                module: body.module,
                referenceId: Number(body.referenceId),
                objectKey: body.objectKey,
                userId: user.id,
            });

            res.status(200).json(result);
        } catch (error) {
            if (error instanceof StorageValidationError) {
                res.status(400).json({ message: error.message });
                return;
            }

            console.error("No fue posible confirmar la carga:", error);
            res.status(500).json({
                message: "No fue posible verificar el archivo almacenado",
            });
        }
    }
}
