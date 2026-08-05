import type { TripIncidentType } from "../../services/trip-incident.service";

interface TripIncidentTypeSelectorProps { value: TripIncidentType; onChange: (value: TripIncidentType) => void; }

export default function TripIncidentTypeSelector({ value, onChange }: TripIncidentTypeSelectorProps) {
    return <fieldset><legend className="text-xs font-semibold text-gray-900">1. Tipo de reporte <span className="text-amber-500">*</span></legend><div className="mt-2 grid grid-cols-2 overflow-hidden rounded-lg border border-gray-200"><button type="button" onClick={() => onChange("Novedad")} className={`py-2 text-xs font-semibold ${value === "Novedad" ? "bg-amber-400 text-gray-900" : "bg-white text-gray-600"}`}>Novedad</button><button type="button" onClick={() => onChange("Critica")} className={`py-2 text-xs font-semibold ${value === "Critica" ? "bg-red-500 text-white" : "bg-white text-gray-600"}`}>Crítica</button></div></fieldset>;
}
