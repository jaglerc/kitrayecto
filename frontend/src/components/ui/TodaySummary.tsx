import { useNavigate } from "react-router";

import camionetaIcon from "../../icons/camioneta.png";
import carroIcon from "../../icons/carro.png";
import motocargueroIcon from "../../icons/motocarguero.png";
import motocicletaIcon from "../../icons/motocicleta.png";
import type { TodayInspection } from "../../services/inspection.service";

interface TodaySummaryProps { inspection: TodayInspection; }

const vehicleIcons = { camioneta: camionetaIcon, carro: carroIcon, motocarguero: motocargueroIcon, motocicleta: motocicletaIcon };
const vehicleLabels = { camioneta: "Camioneta", carro: "Carro", motocarguero: "Motocarguero", motocicleta: "Motocicleta" };
const isCritical = (status: string) => status.toLowerCase().includes("cr");
const getStatusClasses = (status: string) => isCritical(status)
    ? "bg-red-50 text-red-700"
    : status === "Con novedad" ? "bg-amber-50 text-amber-700" : "bg-green-50 text-green-700";

export default function TodaySummary({ inspection }: TodaySummaryProps) {
    const navigate = useNavigate();
    const hasCritical = inspection.answers.some((answer) => isCritical(answer.status));
    const visibleAnswers = inspection.answers.slice(0, 4);
    const date = new Date(inspection.createdAt).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
    const openDetail = () => navigate(`/inspections/${inspection.id}`);

    return (
        <section className="mt-5">
            {hasCritical && (
                <div className="mb-3 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-3">
                    <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-600 text-lg font-bold text-white">!</span>
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-red-700">Checklist finalizado con novedad crítica</p>
                        <p className="mt-0.5 text-[10px] text-red-600">La ruta no fue autorizada. Revisa el checklist y la novedad reportada.</p>
                    </div>
                    <button type="button" onClick={openDetail} className="shrink-0 rounded-lg border border-red-300 px-3 py-2 text-[10px] font-semibold text-red-700">Ver detalle</button>
                </div>
            )}

            <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900">Resumen de hoy</h2>
                <time className="text-[10px] text-gray-500">{date}</time>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center gap-3 border-b border-gray-100 p-3">
                    <img src={vehicleIcons[inspection.vehicle.type]} alt="" className="h-12 w-16 object-contain" />
                    <div className="min-w-0 flex-1"><p className="text-[10px] text-gray-500">{vehicleLabels[inspection.vehicle.type]}</p><p className="text-base font-bold text-gray-900">{inspection.vehicle.plate}</p></div>
                    <div className="text-right"><p className="text-[10px] text-gray-500">Kilometraje inicial</p><p className="text-sm font-semibold text-gray-900">{inspection.mileage === null ? "Sin registrar" : `${inspection.mileage.toLocaleString("es-CO")} km`}</p></div>
                </div>

                <div className="p-3">
                    <div className="mb-2 flex items-center justify-between"><h3 className="text-xs font-semibold text-gray-900">Checklist de entrada</h3><span className="text-[10px] text-gray-500">{inspection.answers.length} elementos</span></div>
                    <div className="divide-y divide-gray-100">
                        {visibleAnswers.map((answer) => (
                            <div key={answer.id} className="flex items-center justify-between gap-2 py-2">
                                <span className="min-w-0 flex-1 truncate text-[10px] text-gray-700">{answer.title}</span>
                                <span className={`rounded px-2 py-1 text-[9px] font-medium ${getStatusClasses(answer.status)}`}>{answer.status}</span>
                                <span aria-hidden="true" className="text-xs text-gray-400">›</span>
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={openDetail} className="mt-2 flex w-full items-center justify-between border-t border-gray-100 pt-3 text-xs font-medium text-gray-700"><span>Ver checklist completo</span><span aria-hidden="true">›</span></button>
                </div>
            </div>
        </section>
    );
}
