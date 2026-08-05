import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import Footer from "../components/ui/Footer";
import JourneyHeader from "../components/ui/JourneyHeader";
import TripHeaderSummary from "../components/ui/TripHeaderSummary";
import TripIncidentEvidencePicker from "../components/ui/TripIncidentEvidencePicker";
import TripIncidentTypeSelector from "../components/ui/TripIncidentTypeSelector";
import { storageService } from "../services/storage.service";
import { tripIncidentService } from "../services/trip-incident.service";
import type { TripIncidentType } from "../services/trip-incident.service";
import { tripService } from "../services/trip.service";
import type { TripStatus } from "../services/trip.service";

export default function TripIncidentPage() {
    const navigate = useNavigate();
    const [status, setStatus] = useState<TripStatus | null>(null);
    const [type, setType] = useState<TripIncidentType>("Novedad");
    const [description, setDescription] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const user = (() => { try { return JSON.parse(localStorage.getItem("user") ?? "null") as { nombre?: string } | null; } catch { return null; } })();

    useEffect(() => { void tripService.findStatus().then(setStatus).catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : "No fue posible consultar el viaje")); }, []);
    const evidenceRequired = type === "Critica";
    const canSave = Boolean(status?.activeTrip && description.trim() && description.trim().length <= 300 && (!evidenceRequired || files.length > 0));
    const save = async () => {
        if (!status?.activeTrip || !canSave || isSaving) return;
        setIsSaving(true); setError(null);
        try {
            const evidences = await Promise.all(files.map((file) => storageService.uploadImage(file, "novedades", status.activeTrip!.id)));
            await tripIncidentService.create({ type, description, evidences });
            navigate("/home");
        } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "No fue posible registrar la novedad"); }
        finally { setIsSaving(false); }
    };

    return <div className="mx-auto min-h-dvh w-full max-w-md bg-white"><JourneyHeader title="Novedades en mi jornada" onBack={() => navigate("/home")} /><main className="space-y-3 px-4 pb-28">{error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</p>}{!status && !error && <p className="py-10 text-center text-sm text-gray-500">Consultando viaje activo...</p>}{status && !status.activeTrip && <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">Debes iniciar un viaje antes de registrar una novedad.</p>}{status?.activeTrip && <><TripHeaderSummary type={status.activeTrip.vehicle.type} plate={status.activeTrip.vehicle.plate} driverName={user?.nombre ?? "Conductor"} /><section className={`space-y-5 rounded-xl border bg-white p-4 shadow-sm ${type === "Critica" ? "border-red-200" : "border-gray-200"}`}><div><h2 className="text-sm font-bold text-gray-900">Registrar novedad</h2><p className="mt-1 text-[10px] text-gray-500">Cuéntanos qué sucedió durante tu jornada.</p></div><TripIncidentTypeSelector value={type} onChange={(selected) => { setType(selected); setError(null); }} /><label className="block text-xs font-semibold text-gray-900">2. Descripción de la novedad <span className="text-amber-500">*</span><textarea maxLength={300} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Describe claramente lo ocurrido..." className="mt-2 h-28 w-full resize-none rounded-lg border border-gray-200 p-3 text-sm outline-none focus:border-amber-400" /><span className="block text-right text-[9px] text-gray-400">{description.length}/300</span></label><TripIncidentEvidencePicker files={files} onChange={setFiles} required={evidenceRequired} /><button type="button" onClick={() => void save()} disabled={!canSave || isSaving} className={`w-full rounded-lg py-3 text-sm font-semibold disabled:opacity-50 ${type === "Critica" ? "bg-red-500 text-white" : "bg-amber-400 text-gray-900"}`}>{isSaving ? "Guardando..." : type === "Critica" ? "Guardar novedad crítica →" : "Guardar novedad →"}</button></section></>}</main><Footer /></div>;
}
