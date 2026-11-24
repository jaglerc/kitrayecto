import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import IncidentFollowUp from "../components/supervisor/IncidentFollowUp";
import SupervisorSidebar from "../components/supervisor/SupervisorSidebar";
import alertIcon from "../icons/supervisor/alert.svg";
import { caseStatuses, supervisorIncidentsService, type SupervisorIncident } from "../services/supervisor-incidents.service";

const supervisorName = () => {
    try { return JSON.parse(localStorage.getItem("user") ?? "null")?.nombre ?? "Supervisor"; }
    catch { return "Supervisor"; }
};

export default function SupervisorIncidentsPage() {
    const [params] = useSearchParams();
    const [category, setCategory] = useState("");
    const [status, setStatus] = useState(params.get("status") === "abiertos" ? "abiertos" : "");
    const [refresh, setRefresh] = useState(0);
    const [saved, setSaved] = useState(false);
    const [items, setItems] = useState<SupervisorIncident[]>([]);
    const [assignees, setAssignees] = useState<{ id: number; name: string }[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        setError(null);
        const timer = window.setTimeout(() => {
            supervisorIncidentsService.list({ page, search, category, status })
                .then((result) => {
                    if (!mounted) return;
                    setItems(result.items);
                    setTotal(result.total);
                    setAssignees(result.assignees);
                    if (page > 1 && result.items.length === 0) {
                        setPage(Math.max(1, Math.ceil(result.total / 20)));
                    }
                })
                .catch((reason) => mounted && setError(reason instanceof Error ? reason.message : "No fue posible consultar"))
                .finally(() => mounted && setLoading(false));
        }, 200);
        return () => { mounted = false; window.clearTimeout(timer); };
    }, [page, search, category, status, refresh]);

    const pages = Math.max(1, Math.ceil(total / 20));

    return <div className="min-h-dvh bg-gray-50">
        <SupervisorSidebar name={supervisorName()} active="novedades" />
        <main className="px-4 py-6 md:ml-64 md:px-8 lg:px-10">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex items-center gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50"><img src={alertIcon} alt="" className="h-7 w-7" /></span>
                    <div><p className="text-xs uppercase tracking-wider text-amber-500">Seguimiento operativo</p><h1 className="text-2xl font-bold">Novedades</h1><p className="text-sm text-gray-500">Consulta accidentes, novedades de trayecto y hallazgos de inspección.</p></div>
                </div>
                <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Buscar por placa, conductor o descripción" className="w-full rounded-xl border bg-white px-4 py-3 sm:max-w-sm" />
            </header>
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
                <label className="grid gap-1">Tipo de reporte
                    <select value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }} className="rounded-lg border bg-white p-2">
                        <option value="">Todos</option>
                        <option value="accidente">Accidentes</option>
                        <option value="trayecto">Novedades de trayecto</option>
                        <option value="inspeccion">Hallazgos de inspección</option>
                    </select>
                </label>
                <label className="grid gap-1">Estado
                    <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="rounded-lg border bg-white p-2">
                        <option value="">Todos</option>
                        <option value="abiertos">Abiertos</option>
                        {caseStatuses.map((option) => <option key={option}>{option}</option>)}
                    </select>
                </label>
                <button type="button" onClick={() => setRefresh((value) => value + 1)} className="self-end rounded-lg border bg-white p-2">Actualizar</button>
            </div>
            {saved && <p role="status" className="mt-4 text-sm text-green-800">Seguimiento guardado.</p>}
            {error && <p className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-600">{error}</p>}
            <section className="mt-6 space-y-3">
                {items.map((incident) => {
                    const critical = incident.type.toLowerCase().includes("crítica") || incident.type.toLowerCase().includes("critica");
                    return <article key={`${incident.category}-${incident.id}`} className={`rounded-2xl border bg-white p-5 shadow-sm ${critical ? "border-red-200" : "border-gray-200"}`}>
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-3 py-1 text-xs font-bold ${critical ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{incident.type}</span>{incident.tripId !== null && <span className="text-xs text-gray-500">Viaje #{incident.tripId}</span>}</div><p className="mt-3 text-base font-semibold text-gray-900">{incident.description}</p>{incident.category === "accidente" && <p className="mt-2 text-sm text-gray-600">Formulario del conductor: {incident.formCompleted ? "Completado" : "Pendiente"}</p>}</div>
                            <time className="shrink-0 text-sm text-gray-500">{new Date(incident.registeredAt).toLocaleString("es-CO", { timeZone: "America/Bogota" })}</time>
                        </div>
                        <div className="mt-4 grid gap-3 rounded-xl bg-gray-50 p-4 text-sm sm:grid-cols-3"><p><span className="block text-xs text-gray-500">Vehículo</span><strong className="capitalize">{incident.vehicle.type} · {incident.vehicle.plate}</strong></p><p><span className="block text-xs text-gray-500">Conductor</span><strong>{incident.driver.name}</strong></p><p><span className="block text-xs text-gray-500">Evidencias</span><strong>{incident.evidences.length}</strong></p></div>
                        {incident.evidences.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{incident.evidences.map((evidence, index) => evidence.downloadUrl && <a key={evidence.id} href={evidence.downloadUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-amber-300 px-3 py-2 text-sm font-semibold">Abrir evidencia {index + 1}</a>)}</div>}
                        <IncidentFollowUp key={incident.revision} item={incident} assignees={assignees} onSaved={() => { setSaved(true); setRefresh((value) => value + 1); }} />
                    </article>;
                })}
                {!loading && items.length === 0 && <p className="rounded-2xl border bg-white p-10 text-center text-gray-500">No se encontraron novedades.</p>}
                {loading && <p className="p-10 text-center text-gray-500">Consultando novedades...</p>}
            </section>
            <footer className="mt-5 flex items-center justify-between text-sm text-gray-500"><span>{total} novedades</span><div className="flex items-center gap-2"><button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-lg border bg-white px-3 py-2 disabled:opacity-40">Anterior</button><span>{page} de {pages}</span><button disabled={page >= pages} onClick={() => setPage(page + 1)} className="rounded-lg border bg-white px-3 py-2 disabled:opacity-40">Siguiente</button></div></footer>
        </main>
    </div>;
}
