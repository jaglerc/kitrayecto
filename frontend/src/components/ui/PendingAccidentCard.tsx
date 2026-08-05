import warningIcon from "../../icons/warning-sign.png";
import type { PendingAccident } from "../../services/accident.service";
interface PendingAccidentCardProps { accident: PendingAccident; onOpen: () => void; }
const formatDate = (value: string) => new Intl.DateTimeFormat("es-CO", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
export default function PendingAccidentCard({ accident, onOpen }: PendingAccidentCardProps) {
    return <article className="rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm"><div className="flex gap-3"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white"><img src={warningIcon} alt="" className="h-7 w-7 object-contain" /></div><div className="min-w-0"><h2 className="text-sm font-semibold text-gray-900">Formulario de accidente pendiente</h2><p className="mt-1 text-xs text-gray-500">Vehículo {accident.vehicle.plate} · {formatDate(accident.reportedAt)}</p><p className="mt-1 text-xs text-gray-600">Completa la información del accidente reportado.</p></div></div><button type="button" onClick={onOpen} className="mt-4 w-full rounded-lg bg-amber-400 py-3 text-sm font-semibold text-gray-900">Completar formulario →</button></article>;
}
