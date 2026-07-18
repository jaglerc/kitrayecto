export type UserRole = "Administrador" | "Supervisor" | "Conductor";

export interface AuthenticatedUser {
    id: number;
    role: UserRole;
}

export const validRoles: UserRole[] = [
    "Administrador",
    "Supervisor",
    "Conductor"
];