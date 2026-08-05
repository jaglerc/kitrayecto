import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import ChecklistDetailItem from "../components/ui/ChecklistDetailItem";
import Footer from "../components/ui/Footer";
import InspectionStatusSummary from "../components/ui/InspectionStatusSummary";
import JourneyHeader from "../components/ui/JourneyHeader";
import camionetaIcon from "../icons/camioneta.png";
import carroIcon from "../icons/carro.png";
import motocargueroIcon from "../icons/motocarguero.png";
import motocicletaIcon from "../icons/motocicleta.png";
import { inspectionService } from "../services/inspection.service";
import type { InspectionDetail } from "../services/inspection.service";

const vehicleIcons = { camioneta: camionetaIcon, carro: carroIcon, motocarguero: motocargueroIcon, motocicleta: motocicletaIcon };
const vehicleLabels = { camioneta: "Camioneta", carro: "Carro", motocarguero: "Motocarguero", motocicleta: "Motocicleta" };

export default function InspectionDetailPage() {
    const navigate = useNavigate();
    const { inspectionId } = useParams();
    const [inspection, setInspection] = useState<InspectionDetail | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const id = Number(inspectionId);
        if (!Number.isInteger(id) || id <= 0) {
            setError("El checklist no es válido");
            return;
        }
        void inspectionService.findById(id).then(setInspection).catch((requestError: unknown) => {
            setError(requestError instanceof Error ? requestError.message : "No fue posible consultar el checklist");
        });
    }, [inspectionId]);

    const date = inspection ? new Date(inspection.createdAt).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" }) : "";

    return (
        <div className="mx-auto min-h-dvh w-full max-w-md bg-white">
            <JourneyHeader title="Checklist completo" onBack={() => navigate("/home")} />
            <main className="space-y-3 px-4 pb-28">
                {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">{error}</p>}
                {!inspection && !error && <p className="py-10 text-center text-sm text-gray-500">Consultando checklist...</p>}
                {inspection && (
                    <>
                        <section className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                            <img src={vehicleIcons[inspection.vehicle.type]} alt="" className="h-14 w-20 object-contain" />
                            <div className="min-w-0 flex-1"><p className="text-[10px] text-gray-500">{vehicleLabels[inspection.vehicle.type]}</p><p className="text-xl font-bold text-gray-900">{inspection.vehicle.plate}</p><p className="text-[10px] text-gray-500">{date}</p></div>
                            <div className="border-l border-gray-100 pl-4 text-right"><p className="text-[10px] text-gray-500">{inspection.operation === "Check_in" ? "Kilometraje inicial" : "Kilometraje final"}</p><p className="text-lg font-semibold text-gray-900">{inspection.mileage === null ? "Sin registrar" : `${inspection.mileage.toLocaleString("es-CO")} km`}</p></div>
                        </section>
                        <InspectionStatusSummary statuses={inspection.answers.map((answer) => answer.status)} />
                        <section>
                            <h2 className="text-sm font-bold text-gray-900">Detalle del checklist</h2>
                            <p className="mb-3 text-[10px] text-gray-500">Consulta el resultado de cada ítem.</p>
                            <div className="space-y-2">{inspection.answers.map((answer, index) => <ChecklistDetailItem key={answer.id} answer={answer} index={index} inspectionId={inspection.id} />)}</div>
                        </section>
                    </>
                )}
            </main>
            <Footer />
        </div>
    );
}
