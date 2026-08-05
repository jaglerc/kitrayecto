import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import Footer from "../components/ui/Footer";
import JourneyHeader from "../components/ui/JourneyHeader";
import camionetaIcon from "../icons/camioneta.png";
import carroIcon from "../icons/carro.png";
import motocargueroIcon from "../icons/motocarguero.png";
import motocicletaIcon from "../icons/motocicleta.png";
import { inspectionService } from "../services/inspection.service";
import type { InspectionDetail } from "../services/inspection.service";

const vehicleIcons = { camioneta: camionetaIcon, carro: carroIcon, motocarguero: motocargueroIcon, motocicleta: motocicletaIcon };
const vehicleLabels = { camioneta: "Camioneta", carro: "Carro", motocarguero: "Motocarguero", motocicleta: "Motocicleta" };
const isCritical = (status: string) => status.toLowerCase().includes("cr");

export default function InspectionAnswerDetailPage() {
    const navigate = useNavigate();
    const { inspectionId, answerId } = useParams();
    const [inspection, setInspection] = useState<InspectionDetail | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const id = Number(inspectionId);
        if (!Number.isInteger(id) || id <= 0) {
            setError("El checklist no es válido");
            return;
        }
        void inspectionService.findById(id).then(setInspection).catch((requestError: unknown) => {
            setError(requestError instanceof Error ? requestError.message : "No fue posible consultar el detalle");
        });
    }, [inspectionId]);

    const answer = inspection?.answers.find((item) => item.id === Number(answerId));
    const critical = answer ? isCritical(answer.status) : false;
    const withIssue = answer?.status === "Con novedad";
    const tone = critical ? "red" : withIssue ? "amber" : "green";
    const title = critical ? "Detalles de la novedad crítica" : withIssue ? "Detalle de la novedad" : "Detalle del checklist";
    const bannerClass = tone === "red" ? "border-red-100 bg-red-50 text-red-700" : tone === "amber" ? "border-amber-100 bg-amber-50 text-amber-700" : "border-green-100 bg-green-50 text-green-700";
    const accentClass = tone === "red" ? "border-red-500" : tone === "amber" ? "border-amber-500" : "border-green-500";
    const date = inspection ? new Date(inspection.createdAt) : null;
    const user = (() => { try { return JSON.parse(localStorage.getItem("user") ?? "null") as { nombre?: string } | null; } catch { return null; } })();

    return (
        <div className="mx-auto min-h-dvh w-full max-w-md bg-white">
            <JourneyHeader title={title} onBack={() => navigate(`/inspections/${inspectionId}`)} />
            <main className="space-y-3 px-4 pb-28">
                {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">{error}</p>}
                {!inspection && !error && <p className="py-10 text-center text-sm text-gray-500">Consultando detalle...</p>}
                {inspection && !answer && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">El elemento solicitado no existe.</p>}
                {inspection && answer && (
                    <>
                        <section className={`flex items-center gap-3 rounded-xl border p-4 ${bannerClass}`}>
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-current/10 text-2xl font-bold">{critical ? "×" : "✓"}</span>
                            <div><h2 className="text-sm font-bold">{critical ? "Ruta no autorizada" : withIssue ? "Novedad registrada" : "Sin novedad"}</h2><p className="mt-1 text-[10px] opacity-80">{critical ? "La ruta no puede iniciarse hasta que esta condición sea atendida." : withIssue ? "Se detectó una novedad en tu vehículo. La ruta puede continuar." : "No se detectaron novedades en este elemento."}</p></div>
                        </section>

                        <section className={`rounded-xl border border-gray-200 border-l-2 bg-white p-4 shadow-sm ${accentClass}`}>
                            <h2 className="border-b border-gray-100 pb-3 text-xs font-bold text-gray-800">{answer.status === "Sin novedad" ? "Resumen de la revisión" : "Resumen de la novedad"}</h2>
                            <div className="grid grid-cols-2 gap-3 py-3"><div><p className="text-[9px] text-gray-500">Elemento revisado</p><p className="text-xs font-semibold text-gray-900">{answer.title}</p></div><div><p className="text-[9px] text-gray-500">Fecha y hora</p><p className="text-xs font-semibold text-gray-900">{date?.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })} · {date?.toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" })}</p></div></div>
                            <p className="text-[9px] font-semibold text-gray-600">Resultado de la revisión</p>
                            <div className="mt-2 rounded-lg bg-gray-50 p-3 text-xs leading-5 text-gray-600">{answer.observation?.trim() || answer.description || "Sin novedades registradas."}</div>
                            <p className="mb-2 mt-4 text-[9px] font-semibold text-gray-600">Evidencia</p>
                            {answer.evidences.length > 0 ? <div className="grid grid-cols-2 gap-2">{answer.evidences.map((evidence) => <a key={evidence.id} href={evidence.url} target="_blank" rel="noreferrer"><img src={evidence.url} alt={evidence.fileName} className="h-28 w-full rounded-lg border border-gray-200 object-cover" /></a>)}</div> : <div className={`rounded-lg border p-3 text-[10px] ${bannerClass}`}>No se requirió evidencia fotográfica para este elemento.</div>}
                        </section>

                        <section className={`rounded-xl border p-4 ${bannerClass}`}><h2 className="text-xs font-bold">Estado actual</h2><p className="mt-1 text-[10px] opacity-80">{critical ? "La ruta está bloqueada temporalmente." : withIssue ? "La novedad quedó registrada correctamente." : "El sistema registró este elemento sin observaciones."}</p></section>

                        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><h2 className="mb-3 text-xs font-bold text-gray-800">Información del vehículo</h2><div className="flex items-center gap-3"><img src={vehicleIcons[inspection.vehicle.type]} alt="" className="h-12 w-16 object-contain" /><div className="min-w-0 flex-1"><p className="text-[9px] text-gray-500">{vehicleLabels[inspection.vehicle.type]}</p><p className="text-sm font-bold">{inspection.vehicle.plate}</p></div><div><p className="text-[9px] text-gray-500">Kilometraje inicial</p><p className="text-sm font-semibold">{inspection.mileage === null ? "Sin registrar" : `${inspection.mileage.toLocaleString("es-CO")} km`}</p></div><div className="text-right"><span className="rounded bg-amber-50 px-2 py-1 text-[8px] text-amber-600">Asignado</span><p className="mt-1 text-[10px] font-semibold">{user?.nombre ?? "Conductor"}</p></div></div></section>

                        <button type="button" onClick={() => navigate("/home")} className="w-full rounded-lg border border-gray-300 bg-white py-3 text-xs font-semibold text-gray-800">Volver al inicio</button>
                    </>
                )}
            </main>
            <Footer />
        </div>
    );
}
