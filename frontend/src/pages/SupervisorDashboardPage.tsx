import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import SupervisorSidebar from "../components/supervisor/SupervisorSidebar";
import SupervisorStatCard from "../components/supervisor/SupervisorStatCard";
import alertIcon from "../icons/supervisor/alert.svg";
import documentIcon from "../icons/supervisor/document.svg";
import shieldIcon from "../icons/supervisor/shield.svg";
import uploadIcon from "../icons/supervisor/upload.svg";
import userAddIcon from "../icons/supervisor/user-add.svg";
import usersIcon from "../icons/supervisor/users.svg";
import vehicleAddIcon from "../icons/supervisor/vehicle-add.svg";
import vehicleIcon from "../icons/supervisor/vehicle.svg";
import { supervisorDashboardService } from "../services/supervisor-dashboard.service";
import type { SupervisorDashboard } from "../services/supervisor-dashboard.service";

const emptyDashboard: SupervisorDashboard = {
    activeUsers: 0,
    registeredVehicles: 0,
    expiringDocuments: 0,
    pendingAlerts: 0,
    documents: [],
};

const quickActions = [
    {
        icon: userAddIcon,
        title: "Crear usuario",
        description: "Agregar un nuevo usuario al sistema",
        path: "/supervisor/users/new",
    },
    {
        icon: vehicleAddIcon,
        title: "Registrar vehículo",
        description: "Añadir un vehículo a la flota",
        path: "/supervisor/vehicles/new",
    },
    {
        icon: uploadIcon,
        title: "Subir documentos",
        description: "Cargar archivos de usuarios o vehículos",
    },
    {
        icon: shieldIcon,
        title: "Asignar roles",
        description: "Gestionar roles y permisos",
    },
];

interface StoredUser {
    nombre?: string;
}

const getStoredUser = (): StoredUser | null => {
    try {
        return JSON.parse(localStorage.getItem("user") ?? "null") as StoredUser | null;
    } catch {
        return null;
    }
};

export default function SupervisorDashboardPage() {
    const navigate = useNavigate();
    const [dashboard, setDashboard] = useState<SupervisorDashboard>(emptyDashboard);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const user = getStoredUser();
    const supervisorName = user?.nombre ?? "Supervisor";

    useEffect(() => {
        void supervisorDashboardService
            .find()
            .then(setDashboard)
            .catch((requestError: unknown) => {
                setError(
                    requestError instanceof Error
                        ? requestError.message
                        : "No fue posible consultar el panel"
                );
            })
            .finally(() => setIsLoading(false));
    }, []);

    return (
        <div className="min-h-dvh bg-gray-50">
            <SupervisorSidebar name={supervisorName} />

            <main className="px-4 py-6 md:ml-64 md:px-8 lg:px-10">
                <header className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-amber-500">
                            Administración
                        </p>
                        <h1 className="mt-1 text-2xl font-bold text-gray-900 md:text-3xl">
                            Panel del supervisor
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Gestiona usuarios, vehículos y documentación.
                        </p>
                    </div>

                    <div className="hidden rounded-full bg-white px-4 py-2 text-right shadow-sm sm:block">
                        <p className="text-sm font-semibold">Hola, {supervisorName}</p>
                        <p className="text-xs text-gray-500">Supervisor</p>
                    </div>
                </header>

                {error && (
                    <p
                        role="alert"
                        className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600"
                    >
                        {error}
                    </p>
                )}

                <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <SupervisorStatCard
                        icon={usersIcon}
                        label="Usuarios registrados"
                        value={dashboard.activeUsers}
                    />
                    <SupervisorStatCard
                        icon={vehicleIcon}
                        label="Vehículos registrados"
                        value={dashboard.registeredVehicles}
                    />
                    <SupervisorStatCard
                        icon={documentIcon}
                        label="Documentos próximos a vencer"
                        value={dashboard.expiringDocuments}
                    />
                    <SupervisorStatCard
                        icon={alertIcon}
                        label="Alertas pendientes"
                        value={dashboard.pendingAlerts}
                    />
                </section>

                <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <h2 className="text-base font-bold text-gray-900">Acciones rápidas</h2>

                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        {quickActions.map((action) => (
                            <button
                                key={action.title}
                                type="button"
                                disabled={!action.path}
                                onClick={() => action.path && navigate(action.path)}
                                title={
                                    action.path
                                        ? action.title
                                        : "Se habilitará al desarrollar este módulo"
                                }
                                className="flex items-center gap-4 rounded-xl border border-gray-100 p-4 text-left hover:border-amber-300 hover:bg-amber-50/40 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-50">
                                    <img
                                        src={action.icon}
                                        alt=""
                                        aria-hidden="true"
                                        className="h-7 w-7"
                                    />
                                </span>

                                <span>
                                    <strong className="block text-sm text-gray-900">
                                        {action.title}
                                    </strong>
                                    <span className="mt-1 block text-xs leading-relaxed text-gray-500">
                                        {action.description}
                                    </span>
                                </span>
                            </button>
                        ))}
                    </div>
                </section>

                <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
                    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <h2 className="text-base font-bold">Actividad reciente</h2>
                        <div className="mt-6 rounded-xl border border-dashed border-gray-200 p-10 text-center">
                            <p className="text-sm font-medium text-gray-600">
                                Sin actividad registrada
                            </p>
                            <p className="mt-1 text-xs text-gray-400">
                                La actividad aparecerá cuando implementemos la auditoría de acciones del supervisor.
                            </p>
                        </div>
                    </section>

                    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <h2 className="text-base font-bold">Documentos por vencer</h2>
                        <ExpiringDocuments
                            isLoading={isLoading}
                            documents={dashboard.documents}
                        />
                    </section>
                </div>
            </main>
        </div>
    );
}

interface ExpiringDocumentsProps {
    isLoading: boolean;
    documents: SupervisorDashboard["documents"];
}

function ExpiringDocuments({ isLoading, documents }: ExpiringDocumentsProps) {
    if (isLoading) {
        return (
            <p className="py-10 text-center text-sm text-gray-400">
                Consultando documentos...
            </p>
        );
    }

    if (documents.length === 0) {
        return (
            <p className="py-10 text-center text-sm text-gray-400">
                No hay documentos que venzan en los próximos 30 días.
            </p>
        );
    }

    return (
        <div className="mt-3 divide-y divide-gray-100">
            {documents.map((document) => (
                <article key={document.id} className="flex items-center gap-3 py-4">
                    <img
                        src={documentIcon}
                        alt=""
                        aria-hidden="true"
                        className="h-6 w-6"
                    />

                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                            {document.documentType}
                        </p>
                        <p className="text-xs text-gray-500">
                            Vehículo {document.plate}
                        </p>
                    </div>

                    <div className="text-right">
                        <p className="text-xs font-semibold text-red-500">
                            Vence en {document.daysRemaining} días
                        </p>
                        <p className="text-[10px] text-gray-400">
                            {new Date(document.expiresAt).toLocaleDateString("es-CO")}
                        </p>
                    </div>
                </article>
            ))}
        </div>
    );
}
