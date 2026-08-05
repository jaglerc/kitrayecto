import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import Footer from "../components/ui/Footer";
import JourneyHeader from "../components/ui/JourneyHeader";
import TripCargoForm from "../components/ui/TripCargoForm";
import TripHeaderSummary from "../components/ui/TripHeaderSummary";
import calendarIcon from "../icons/calendar-trip.svg";
import routeIcon from "../icons/route-trip.svg";
import dataIcon from "../icons/clipboard.png";
import { tripService } from "../services/trip.service";
import type { TripStatus } from "../services/trip.service";

export default function RegisterTripPage() {
    const navigate = useNavigate();
    const [status, setStatus] = useState<TripStatus | null>(null);
    const [eggs, setEggs] = useState("");
    const [balancedFeed, setBalancedFeed] = useState("");
    const [observations, setObservations] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        void tripService.findStatus().then(setStatus).catch((requestError: unknown) => {
            setError(requestError instanceof Error ? requestError.message : "No fue posible consultar el viaje");
        });
    }, []);

    const canSave = Boolean(status?.canStart && (Number(eggs) > 0 || Number(balancedFeed) > 0) && observations.length <= 300);
    const save = async () => {
        if (!canSave || isSaving) return;
        setIsSaving(true);
        setError(null);
        try {
            await tripService.create({
                observations,
                products: [
                    ...(Number(eggs) > 0 ? [{ productName: "Huevos", unit: "Unidades", quantity: Number(eggs) }] : []),
                    ...(Number(balancedFeed) > 0 ? [{ productName: "Alimento balanceado", unit: "Kilogramos", quantity: Number(balancedFeed) }] : []),
                ],
            });
            navigate("/home");
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : "No fue posible registrar el viaje");
        } finally {
            setIsSaving(false);
        }
    };

    const user = (() => {
        try { return JSON.parse(localStorage.getItem("user") ?? "null") as { nombre?: string } | null; }
        catch { return null; }
    })();

    return (
        <div className="mx-auto min-h-dvh w-full max-w-md bg-white">
            <JourneyHeader title="Registrar viaje" onBack={() => navigate("/home")} />
            <main className="space-y-3 px-4 pb-28">
                {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</p>}
                {!status && !error && <p className="py-10 text-center text-sm text-gray-500">Consultando jornada...</p>}
                {status && !status.hasCheckIn && <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">Primero debes realizar el check-in de un vehículo.</p>}
                {status && status.hasCheckIn && !status.checkInAuthorized && <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">La ruta no está autorizada porque el check-in tiene una novedad crítica.</p>}
                {status?.activeTrip && <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">Ya tienes el viaje {status.activeTrip.numberOfDay} en curso. Debes terminarlo antes de registrar otro.</p>}

                {status?.vehicle && !status.activeTrip && (
                    <>
                        <TripHeaderSummary type={status.vehicle.type} plate={status.vehicle.plate} driverName={user?.nombre ?? "Conductor"} />
                        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                            <h2 className="mb-4 flex items-center gap-2 text-xs font-bold text-gray-900"><img src={dataIcon} alt="" className="h-5 w-5 object-contain" />Datos del viaje</h2>
                            <label className="block text-xs font-semibold text-gray-900">1. Fecha y hora<div className="mt-2 flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"><img src={calendarIcon} alt="" className="h-5 w-5" /><span className="text-sm font-normal text-gray-600">{new Date().toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" })}</span></div></label>
                            <label className="mt-4 block text-xs font-semibold text-gray-900">2. Viaje del día<div className="mt-2 flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"><img src={routeIcon} alt="" className="h-5 w-5" /><input readOnly value={`Viaje ${status.nextTripNumber}`} className="min-w-0 flex-1 bg-transparent text-sm font-normal outline-none" /></div></label>
                            <div className="mt-5"><TripCargoForm eggs={eggs} balancedFeed={balancedFeed} onEggsChange={setEggs} onBalancedFeedChange={setBalancedFeed} /></div>
                            <label className="mt-5 block text-xs font-semibold text-gray-900">4. Observaciones <span className="font-normal text-gray-400">(opcional)</span><textarea maxLength={300} value={observations} onChange={(event) => setObservations(event.target.value)} placeholder="Escribe cualquier observación relevante del viaje..." className="mt-2 h-24 w-full resize-none rounded-lg border border-gray-200 p-3 text-sm outline-none focus:border-amber-400" /><span className="block text-right text-[9px] text-gray-400">{observations.length}/300</span></label>
                            <button type="button" onClick={() => void save()} disabled={!canSave || isSaving} className="mt-4 w-full rounded-lg bg-amber-400 py-3 text-sm font-semibold text-gray-900 disabled:opacity-50">{isSaving ? "Registrando..." : "Registrar viaje →"}</button>
                        </section>
                    </>
                )}
            </main>
            <Footer />
        </div>
    );
}
