import camionetaIcon from "../../icons/camioneta.png";
import carroIcon from "../../icons/carro.png";
import motocargueroIcon from "../../icons/motocarguero.png";
import motocicletaIcon from "../../icons/motocicleta.png";

import type { TodayInspection } from "../../services/inspection.service";

interface TodaySummaryProps {
    inspection: TodayInspection;
}

const vehicleIcons = {
    camioneta: camionetaIcon,
    carro: carroIcon,
    motocarguero: motocargueroIcon,
    motocicleta: motocicletaIcon,
};

const vehicleLabels = {
    camioneta: "Camioneta",
    carro: "Carro",
    motocarguero: "Motocarguero",
    motocicleta: "Motocicleta",
};

const statusClasses = {
    "Sin novedad": "bg-green-50 text-green-700",
    "Con novedad": "bg-amber-50 text-amber-700",
    "Crítica": "bg-red-50 text-red-700",
};

export default function TodaySummary({ inspection }: TodaySummaryProps) {
    const date = new Date(inspection.createdAt).toLocaleDateString("es-CO", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    return (
        <section className="mt-5">
            <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900">Resumen de hoy</h2>
                <time className="text-[10px] text-gray-500">{date}</time>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center gap-3 border-b border-gray-100 p-3">
                    <img
                        src={vehicleIcons[inspection.vehicle.type]}
                        alt=""
                        className="h-12 w-16 object-contain"
                    />
                    <div className="min-w-0 flex-1">
                        <p className="text-[10px] text-gray-500">
                            {vehicleLabels[inspection.vehicle.type]}
                        </p>
                        <p className="text-base font-bold text-gray-900">
                            {inspection.vehicle.plate}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-gray-500">Kilometraje inicial</p>
                        <p className="text-sm font-semibold text-gray-900">
                            {inspection.mileage === null
                                ? "Sin registrar"
                                : `${inspection.mileage.toLocaleString("es-CO")} km`}
                        </p>
                    </div>
                </div>

                <div className="p-3">
                    <div className="mb-2 flex items-center justify-between">
                        <h3 className="text-xs font-semibold text-gray-900">
                            Checklist de entrada
                        </h3>
                        <span className="text-[10px] text-gray-500">
                            {inspection.answers.length} elementos
                        </span>
                    </div>

                    <div className="divide-y divide-gray-100">
                        {inspection.answers.map((answer) => (
                            <div key={answer.id} className="flex items-center justify-between gap-2 py-2">
                                <span className="min-w-0 flex-1 truncate text-[10px] text-gray-700">
                                    {answer.title}
                                </span>
                                <span className={`rounded px-2 py-1 text-[9px] font-medium ${statusClasses[answer.status]}`}>
                                    {answer.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
