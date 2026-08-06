import type { ReactNode } from "react";
import { Navigate } from "react-router";

type UserRole = "Administrador" | "Supervisor" | "Conductor";

interface RoleRouteProps {
    allowedRoles: UserRole[];
    children: ReactNode;
}

const getStoredRole = (): UserRole | undefined => {
    try {
        const user = JSON.parse(
            localStorage.getItem("user") ?? "null"
        ) as { role?: UserRole } | null;

        return user?.role;
    } catch {
        return undefined;
    }
};

export default function RoleRoute({
    allowedRoles,
    children,
}: RoleRouteProps) {
    const token = localStorage.getItem("token");
    const role = getStoredRole();

    if (!token || !role) {
        return <Navigate to="/login" replace />;
    }

    if (!allowedRoles.includes(role)) {
        const allowedHome = role === "Conductor" ? "/home" : "/supervisor";
        return <Navigate to={allowedHome} replace />;
    }

    return children;
}
