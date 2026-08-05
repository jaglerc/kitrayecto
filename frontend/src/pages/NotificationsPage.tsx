import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import Footer from "../components/ui/Footer";
import Header from "../components/ui/Header";
import PendingAccidentCard from "../components/ui/PendingAccidentCard";
import { accidentService } from "../services/accident.service";
import type { PendingAccident } from "../services/accident.service";

export default function NotificationsPage() {
    const navigate = useNavigate(); const [items, setItems] = useState<PendingAccident[]>([]); const [query, setQuery] = useState(""); const [error, setError] = useState<string | null>(null); const [loading, setLoading] = useState(true);
    const user = (() => { try { return JSON.parse(localStorage.getItem("user") ?? "null") as { nombre?: string; role?: string } | null; } catch { return null; } })();
    useEffect(() => { void accidentService.findPending().then(setItems).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "No fue posible consultar las notificaciones")).finally(() => setLoading(false)); }, []);
    const filtered = useMemo(() => { const search = query.trim().toLocaleLowerCase("es"); return search ? items.filter((item) => `${item.vehicle.plate} ${item.vehicle.type}`.toLocaleLowerCase("es").includes(search)) : items; }, [items, query]);
    return <div className="mx-auto min-h-dvh w-full max-w-md bg-white"><Header nombre={user?.nombre} role={user?.role} /><main className="px-4 pb-28 pt-24"><div className="flex items-center justify-between"><h1 className="text-xl font-bold text-gray-900">Notificaciones</h1><span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-600">{items.length}</span></div><label className="mt-4 block"><span className="sr-only">Buscar notificaciones</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por placa o vehículo" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-400" /></label><section className="mt-4 space-y-3">{loading && <p className="py-10 text-center text-sm text-gray-500">Consultando notificaciones...</p>}{error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</p>}{!loading && !error && filtered.length === 0 && <p className="rounded-xl border border-gray-200 p-6 text-center text-sm text-gray-500">No tienes formularios de accidente pendientes.</p>}{filtered.map((accident) => <PendingAccidentCard key={accident.id} accident={accident} onOpen={() => navigate(`/accidents/${accident.id}/complete`)} />)}</section></main><Footer opcion="notificaciones" /></div>;
}
