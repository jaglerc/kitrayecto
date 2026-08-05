import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import Footer from "../components/ui/Footer";
import JourneyHeader from "../components/ui/JourneyHeader";
import camionetaIcon from "../icons/camioneta.png";
import carroIcon from "../icons/carro.png";
import motocicletaIcon from "../icons/motocicleta.png";
import motocargueroIcon from "../icons/motocarguero.png";
import warningIcon from "../icons/warning-sign.png";
import { accidentService } from "../services/accident.service";
import type { AccidentDetail } from "../services/accident.service";

const vehicleData = {
    camioneta: { label: "Camioneta", icon: camionetaIcon },
    carro: { label: "Carro", icon: carroIcon },
    motocicleta: { label: "Motocicleta", icon: motocicletaIcon },
    motocarguero: { label: "Motocarguero", icon: motocargueroIcon },
};

interface DataRowProps { icon: string; label: string; value: string | null; }
function DataRow({ icon, label, value }: DataRowProps) {
    return <div className="grid grid-cols-[20px_1fr_1.15fr] items-start gap-2 text-xs"><span aria-hidden="true" className="text-center text-sm text-gray-500">{icon}</span><span className="text-gray-500">{label}</span><strong className="break-words font-semibold text-gray-900">{value || "No registrado"}</strong></div>;
}

export default function AccidentReportedPage() {
    const navigate = useNavigate();
    const id = Number(useParams().accidentId);
    const [accident, setAccident] = useState<AccidentDetail | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        void accidentService.findById(id)
            .then(setAccident)
            .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "No fue posible consultar el reporte"));
    }, [id]);

    const vehicle = accident ? vehicleData[accident.vehicle.type] : null;

    return <div className="mx-auto min-h-dvh w-full max-w-md bg-white">
        <JourneyHeader title="Reportar accidente" onBack={() => navigate("/home")} />
        <main className="space-y-3 px-4 pb-28">
            <section className="flex items-center gap-4 rounded-xl border border-red-300 bg-red-50 p-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white">
                    <img src={warningIcon} alt="" className="h-8 w-8 object-contain" />
                </div>
                <div><h1 className="text-sm font-bold text-gray-900">Se registró la alerta del accidente</h1><p className="mt-1 text-xs leading-relaxed text-gray-600">El reporte quedó disponible para seguimiento.</p></div>
            </section>

            {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</p>}

            {accident && <>
                <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <h2 className="mb-4 text-sm font-bold text-gray-900">Tus datos</h2>
                    <div className="space-y-3">
                        <DataRow icon="👤" label="Conductor:" value={accident.driverName} />
                        <DataRow icon="🪪" label="Cédula:" value={accident.driverDocument} />
                        <DataRow icon="📱" label="Número de celular:" value={accident.driverPhone} />
                        <DataRow icon="⚕" label="EPS:" value={accident.driverEps} />
                    </div>
                    <p className="mt-4 border-t border-gray-100 pt-3 text-[10px] leading-relaxed text-gray-400">La información de la aseguradora todavía no está registrada en el sistema.</p>
                </section>

                <section className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                    {vehicle && <img src={vehicle.icon} alt="" className="h-14 w-20 object-contain" />}
                    <div><p className="text-[10px] text-gray-500">Vehículo</p><p className="text-sm font-bold text-gray-900">{vehicle?.label} – {accident.vehicle.plate}</p></div>
                </section>

                <section className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-amber-400 font-bold text-amber-500">i</span>
                    <div><p className="text-xs font-bold text-gray-900">Tienes un formulario pendiente.</p><p className="mt-1 text-[11px] leading-relaxed text-gray-600">Completa la información del accidente desde Notificaciones.</p></div>
                </section>

                <button type="button" onClick={() => navigate("/notifications")} className="w-full rounded-lg bg-amber-400 py-3 text-sm font-semibold text-gray-900 shadow-sm">Ir a notificaciones <span className="ml-2">→</span></button>
            </>}
        </main>
        <Footer />
    </div>;
}
