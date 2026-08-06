import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import SupervisorSidebar from "../components/supervisor/SupervisorSidebar";
import userAddIcon from "../icons/supervisor/user-add.svg";
import usersIcon from "../icons/supervisor/users.svg";
import { supervisorUsersService } from "../services/supervisor-users.service";
import type { CreatedSupervisorUser, SupervisorUserRole } from "../services/supervisor-users.service";

const storedName = (): string => {
    try { return JSON.parse(localStorage.getItem("user") ?? "null")?.nombre ?? "Supervisor"; }
    catch { return "Supervisor"; }
};

export default function SupervisorUsersPage() {
    const navigate = useNavigate();
    const [users, setUsers] = useState<CreatedSupervisorUser[]>([]);
    const [search, setSearch] = useState("");
    const [role, setRole] = useState<SupervisorUserRole | "">("");
    const [estado, setEstado] = useState<"" | "true" | "false">("");
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError(null);
        const timeout = window.setTimeout(() => {
            supervisorUsersService.list({ search, role, estado, page, pageSize: 12 })
                .then((result) => {
                    if (!active) return;
                    setUsers(result.items);
                    setTotal(result.total);
                })
                .catch((reason) => active && setError(reason instanceof Error ? reason.message : "No fue posible consultar los usuarios"))
                .finally(() => active && setLoading(false));
        }, 250);
        return () => { active = false; window.clearTimeout(timeout); };
    }, [search, role, estado, page]);

    const pages = Math.max(1, Math.ceil(total / 12));

    return (
        <div className="min-h-dvh bg-gray-50">
            <SupervisorSidebar name={storedName()} active="usuarios" />
            <main className="px-4 py-6 md:ml-64 md:px-8 lg:px-10">
                <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50">
                            <img src={usersIcon} alt="" className="h-7 w-7" />
                        </span>
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wider text-amber-500">Gestión de usuarios</p>
                            <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
                            <p className="mt-1 text-sm text-gray-500">Consulta, edita, activa o desactiva usuarios.</p>
                        </div>
                    </div>
                    <button type="button" onClick={() => navigate("/supervisor/users/new")} className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-gray-900 hover:bg-amber-500">
                        <img src={userAddIcon} alt="" className="h-5 w-5" /> Crear usuario
                    </button>
                </header>

                <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="grid gap-3 lg:grid-cols-[1fr_220px_220px]">
                        <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Buscar por nombre o cédula" className="rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-amber-400" />
                        <select value={role} onChange={(event) => { setRole(event.target.value as SupervisorUserRole | ""); setPage(1); }} className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-amber-400">
                            <option value="">Todos los roles</option><option value="Conductor">Conductor</option><option value="Supervisor">Supervisor</option><option value="Administrador">Administrador</option>
                        </select>
                        <select value={estado} onChange={(event) => { setEstado(event.target.value as "" | "true" | "false"); setPage(1); }} className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-amber-400">
                            <option value="">Todos los estados</option><option value="true">Activos</option><option value="false">Inactivos</option>
                        </select>
                    </div>
                </section>

                {error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</p>}

                <section className="mt-5 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[720px] text-left text-sm">
                            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="px-5 py-4">Usuario</th><th className="px-5 py-4">Cédula</th><th className="px-5 py-4">Rol</th><th className="px-5 py-4">Estado</th><th className="px-5 py-4 text-right">Acción</th></tr></thead>
                            <tbody className="divide-y divide-gray-100">
                                {!loading && users.map((user) => (
                                    <tr key={user.id} className="hover:bg-amber-50/30">
                                        <td className="px-5 py-4 font-semibold text-gray-900">{[user.nombre, user.segundoNombre, user.apellido].filter(Boolean).join(" ")}</td>
                                        <td className="px-5 py-4 text-gray-600">{user.cedula}</td>
                                        <td className="px-5 py-4 text-gray-600">{user.role}</td>
                                        <td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${user.estado ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>{user.estado ? "Activo" : "Inactivo"}</span></td>
                                        <td className="px-5 py-4 text-right"><button type="button" onClick={() => navigate(`/supervisor/users/${user.id}`)} className="rounded-lg border border-amber-300 px-4 py-2 font-semibold text-gray-700 hover:bg-amber-50">Ver usuario</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {loading && <p className="p-8 text-center text-sm text-gray-500">Consultando usuarios...</p>}
                    {!loading && users.length === 0 && <p className="p-8 text-center text-sm text-gray-500">No se encontraron usuarios.</p>}
                    <footer className="flex items-center justify-between border-t border-gray-100 px-5 py-4 text-sm text-gray-500">
                        <span>{total} usuarios</span><div className="flex items-center gap-2"><button disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="rounded-lg border px-3 py-2 disabled:opacity-40">Anterior</button><span>{page} de {pages}</span><button disabled={page >= pages} onClick={() => setPage((value) => value + 1)} className="rounded-lg border px-3 py-2 disabled:opacity-40">Siguiente</button></div>
                    </footer>
                </section>
            </main>
        </div>
    );
}
