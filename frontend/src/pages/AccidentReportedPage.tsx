import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import Footer from "../components/ui/Footer";
import JourneyHeader from "../components/ui/JourneyHeader";
import TripHeaderSummary from "../components/ui/TripHeaderSummary";
import { accidentService } from "../services/accident.service";
import type { AccidentDetail } from "../services/accident.service";

export default function AccidentReportedPage() {
    const navigate = useNavigate(); const id = Number(useParams().accidentId); const [accident, setAccident] = useState<AccidentDetail | null>(null); const [error, setError] = useState<string | null>(null);
    useEffect(() => { void accidentService.findById(id).then(setAccident).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "No fue posible consultar el reporte")); }, [id]);
    return <div className="mx-auto min-h-dvh w-full max-w-md bg-white"><JourneyHeader title="Reportar accidente" onBack={() => navigate("/home")} /><main className="space-y-4 px-4 pb-28"><section className="rounded-xl border border-red-200 bg-red-50 p-4"><h1 className="text-base font-bold text-red-700">Alerta de accidente registrada</h1><p className="mt-2 text-sm text-red-600">El reporte quedó disponible para seguimiento y tienes un formulario pendiente por completar.</p></section>{error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</p>}{accident && <><TripHeaderSummary type={accident.vehicle.type} plate={accident.vehicle.plate} driverName={accident.driverName} /><section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"><p className="font-semibold">Formulario pendiente</p><p className="mt-1 text-xs">Completa los datos del accidente desde Notificaciones.</p></section><button type="button" onClick={() => navigate("/notifications")} className="w-full rounded-lg bg-amber-400 py-3 text-sm font-semibold">Ir a notificaciones →</button></>}</main><Footer /></div>;
}
