import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import Footer from "../components/ui/Footer";
import JourneyHeader from "../components/ui/JourneyHeader";
import ConsultationRecordCard from "../components/ui/ConsultationRecordCard";
import tripIcon from "../icons/steering-wheel.png";
import fuelIcon from "../icons/cost.png";
import maintenanceIcon from "../icons/support.png";
import accidentIcon from "../icons/warning-sign.png";
import inspectionIcon from "../icons/clipboard.png";
import incidentIcon from "../icons/to-do-list.png";
import { consultationService } from "../services/consultation.service";
import type { ConsultationCategory, ConsultationItem } from "../services/consultation.service";

const meta: Record<ConsultationCategory, { label: string; icon: string }> = {
    trips: { label: "Viajes", icon: tripIcon }, fuel: { label: "Combustible", icon: fuelIcon },
    maintenance: { label: "Mantenimiento", icon: maintenanceIcon }, accidents: { label: "Accidentes", icon: accidentIcon },
    inspections: { label: "Checklist", icon: inspectionIcon }, incidents: { label: "Novedades", icon: incidentIcon },
};
const isCategory = (value: string | undefined): value is ConsultationCategory => Boolean(value && value in meta);

export default function ConsultationListPage() {
    const navigate = useNavigate();
    const routeCategory = useParams().category;
    const category = isCategory(routeCategory) ? routeCategory : "trips";
    const [items, setItems] = useState<ConsultationItem[]>([]);
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => { setLoading(true); setError(null); void consultationService.findAll(category).then(setItems).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "No fue posible consultar los registros")).finally(() => setLoading(false)); }, [category]);
    const filtered = useMemo(() => { const value = query.trim().toLocaleLowerCase("es"); return value ? items.filter((item) => `${item.title} ${item.subtitle} ${item.plate} ${item.status}`.toLocaleLowerCase("es").includes(value)) : items; }, [items, query]);
    const groups = filtered.reduce<Map<string, ConsultationItem[]>>((result, item) => { const date = new Date(item.occurredAt).toLocaleDateString("es-CO", { dateStyle: "long" }); result.set(date, [...(result.get(date) ?? []), item]); return result; }, new Map());

    const openRecord = (item: ConsultationItem) => navigate(category === "inspections" ? `/inspections/${item.id}` : `/consultations/${category}/${item.id}`);
    return <div className="mx-auto min-h-dvh w-full max-w-md bg-white"><JourneyHeader title={`Consultas: ${meta[category].label}`} onBack={() => navigate("/consultations")} /><main className="px-4 pb-28"><div className="flex gap-2 overflow-x-auto pb-2">{(Object.keys(meta) as ConsultationCategory[]).map((option) => <button key={option} type="button" onClick={() => navigate(`/consultations/${option}`)} className={`whitespace-nowrap rounded-lg border px-3 py-2 text-[10px] font-semibold ${option === category ? "border-amber-400 bg-amber-400" : "border-gray-200 bg-white"}`}>{meta[option].label}</button>)}</div><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por palabra o placa" className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-400" />{loading && <p className="py-12 text-center text-sm text-gray-500">Consultando registros...</p>}{error && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</p>}{!loading && !error && filtered.length === 0 && <p className="mt-4 rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-500">Aún no hay registros en esta categoría.</p>}{Array.from(groups.entries()).map(([date, records]) => <section key={date} className="mt-5 space-y-2"><h2 className="text-xs font-bold capitalize text-gray-600">{date}</h2>{records.map((item) => <ConsultationRecordCard key={item.id} item={item} icon={meta[category].icon} onClick={() => openRecord(item)} />)}</section>)}</main><Footer /></div>;
}
