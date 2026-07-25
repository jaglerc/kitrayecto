export type UserRole =
    | "Administrador"
    | "Supervisor"
    | "Conductor";

export interface User {
    id: number;
    cedula: string;
    nombre: string;
    password: string; // hash almacenado en la BD
    role: UserRole;
}

export interface AuthenticatedUser {
    id: number;
    role: UserRole;
}

export interface LoginRequest {
    cedula: string;
    password: string;
}

export interface LoginResponse {
    token: string;
    user: {
        id: number;
        nombre: string;
        role: UserRole;
    };
}

export const validRoles: UserRole[] = [
    "Administrador",
    "Supervisor",
    "Conductor"
];