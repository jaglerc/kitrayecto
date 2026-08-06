import bcrypt from "bcrypt";

import type { AuthenticatedUser, UserRole } from "../auth/auth.types.js";
import { SupervisorUsersRepository } from "./supervisor-users.repository.js";
import type {
    CreatedSupervisorUser,
    CreatedSupervisorUserDocument,
    CreateSupervisorUserDocumentInput,
    CreateSupervisorUserInput,
} from "./supervisor-users.types.js";

const allowedRoles: UserRole[] = ["Conductor", "Supervisor", "Administrador"];

export class SupervisorUserValidationError extends Error {}
export class SupervisorUserConflictError extends Error {}
export class SupervisorUserNotFoundError extends Error {}
export class SupervisorUserForbiddenError extends Error {}

const optionalText = (value: string | null): string | null => {
    const normalized = value?.trim();
    return normalized ? normalized : null;
};

const isIsoDate = (value: string | null): boolean => {
    return value === null || /^\d{4}-\d{2}-\d{2}$/.test(value);
};

export class SupervisorUsersService {
    static async create(
        actor: AuthenticatedUser,
        input: CreateSupervisorUserInput
    ): Promise<CreatedSupervisorUser> {
        const normalized: CreateSupervisorUserInput = {
            ...input,
            cedula: input.cedula.trim(),
            nombre: input.nombre.trim(),
            segundoNombre: optionalText(input.segundoNombre),
            apellido: input.apellido.trim(),
            fechaExpedicionDocumento: optionalText(input.fechaExpedicionDocumento),
            ciudadExpedicionDocumento: optionalText(input.ciudadExpedicionDocumento),
            eps: optionalText(input.eps),
            telefono: optionalText(input.telefono),
            categoriaLicencia: optionalText(input.categoriaLicencia),
            vencimientoLicencia: optionalText(input.vencimientoLicencia),
        };

        if (!normalized.cedula || !normalized.nombre || !normalized.apellido) {
            throw new SupervisorUserValidationError(
                "La cédula, el nombre y el apellido son obligatorios"
            );
        }

        if (!/^\d{5,20}$/.test(normalized.cedula)) {
            throw new SupervisorUserValidationError("La cédula no es válida");
        }

        if (normalized.password.length < 8) {
            throw new SupervisorUserValidationError(
                "La contraseña debe tener mínimo 8 caracteres"
            );
        }

        if (!allowedRoles.includes(normalized.role)) {
            throw new SupervisorUserValidationError("El rol no es válido");
        }

        if (normalized.role === "Administrador" && actor.role !== "Administrador") {
            throw new SupervisorUserForbiddenError(
                "Solo un administrador puede crear otro administrador"
            );
        }

        if (
            !isIsoDate(normalized.fechaExpedicionDocumento) ||
            !isIsoDate(normalized.vencimientoLicencia)
        ) {
            throw new SupervisorUserValidationError("Una de las fechas no es válida");
        }

        if (await SupervisorUsersRepository.existsByCedula(normalized.cedula)) {
            throw new SupervisorUserConflictError(
                "Ya existe un usuario registrado con esta cédula"
            );
        }

        const passwordHash = await bcrypt.hash(normalized.password, 12);
        return SupervisorUsersRepository.create(normalized, passwordHash);
    }

    static async createDocument(
        actor: AuthenticatedUser,
        userId: number,
        input: CreateSupervisorUserDocumentInput
    ): Promise<CreatedSupervisorUserDocument> {
        if (!Number.isInteger(userId) || userId <= 0) {
            throw new SupervisorUserValidationError("El usuario no es válido");
        }

        if (!await SupervisorUsersRepository.existsById(userId)) {
            throw new SupervisorUserNotFoundError("El usuario no existe");
        }

        const expectedPath = `/usuarios/${userId}/${actor.id}/`;
        if (!input.objectKey.includes(expectedPath)) {
            throw new SupervisorUserValidationError(
                "El archivo no pertenece al usuario indicado"
            );
        }

        if (!isIsoDate(input.fechaVigencia) || !isIsoDate(input.fechaVencimiento)) {
            throw new SupervisorUserValidationError("La vigencia del documento no es válida");
        }

        return SupervisorUsersRepository.createDocument(userId, input);
    }
}
