import { useNavigate } from "react-router";

import bellIcon from "../../icons/supervisor/bell.svg";
import documentIcon from "../../icons/supervisor/document.svg";
import homeIcon from "../../icons/supervisor/home.svg";
import logoutIcon from "../../icons/supervisor/logout.svg";
import shieldIcon from "../../icons/supervisor/shield.svg";
import usersIcon from "../../icons/supervisor/users.svg";
import vehicleIcon from "../../icons/supervisor/vehicle.svg";

type SupervisorOption =
    | "inicio"
    | "usuarios"
    | "vehiculos"
    | "documentos"
    | "roles"
    | "notificaciones";

interface SupervisorSidebarProps {
    name: string;
    active?: SupervisorOption;
}

const navigationItems: Array<{
    id: SupervisorOption;
    icon: string;
    label: string;
    path?: string;
}> = [
    { id: "inicio", icon: homeIcon, label: "Inicio", path: "/supervisor" },
    { id: "usuarios", icon: usersIcon, label: "Usuarios", path: "/supervisor/users/new" },
    { id: "vehiculos", icon: vehicleIcon, label: "Vehículos" },
    { id: "documentos", icon: documentIcon, label: "Documentos" },
    { id: "roles", icon: shieldIcon, label: "Roles y permisos" },
    { id: "notificaciones", icon: bellIcon, label: "Notificaciones" },
];

export default function SupervisorSidebar({
    name,
    active = "inicio",
}: SupervisorSidebarProps) {
    const navigate = useNavigate();

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login", { replace: true });
    };

    return (
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-gray-200 bg-white px-4 py-6 md:flex">
            <img
                src="/ruta-aviario.png"
                alt="El Aviario"
                className="h-20 w-48 object-contain"
            />

            <div className="mt-2 rounded-xl border border-gray-100 p-3">
                <p className="text-sm font-semibold text-gray-900">
                    Hola, {name}
                </p>
                <p className="text-xs text-gray-500">Supervisor</p>
            </div>

            <nav className="mt-5 space-y-2">
                {navigationItems.map((item) => {
                    const isActive = item.id === active;
                    const isAvailable = Boolean(item.path);

                    return (
                        <button
                            key={item.id}
                            type="button"
                            disabled={!isAvailable}
                            onClick={() => item.path && navigate(item.path)}
                            title={!isAvailable ? "Se desarrollará en el siguiente módulo" : undefined}
                            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
                                isActive
                                    ? "border border-amber-400 bg-amber-50 font-semibold text-gray-900"
                                    : "text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                            }`}
                        >
                            <img src={item.icon} alt="" aria-hidden="true" className="h-5 w-5" />
                            {item.label}
                        </button>
                    );
                })}
            </nav>

            <button
                type="button"
                onClick={logout}
                className="mt-auto flex items-center gap-3 border-t border-gray-100 px-4 pt-5 text-sm text-gray-600"
            >
                <img src={logoutIcon} alt="" aria-hidden="true" className="h-5 w-5" />
                Cerrar sesión
            </button>
        </aside>
    );
}
