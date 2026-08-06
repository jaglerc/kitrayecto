import { useNavigate } from "react-router";

import FooterNav from "../components/ui/Footer";
import Header from "../components/ui/Header";
import oilIcon from "../icons/cost.png";
import maintenanceIcon from "../icons/support.png";
import fumigationIcon from "../icons/warning-sign.png";

const getUser = () => {
    try { return JSON.parse(localStorage.getItem("user") ?? "null") as { nombre?: string } | null; }
    catch { return null; }
};

export default function MaintenanceOptionsPage() {
    const navigate = useNavigate();
    const user = getUser();
    const options = [
        { title: "Cambio de aceite", description: "Registra el cambio y actualiza el próximo kilometraje.", icon: oilIcon },
        { title: "Fumigación", description: "Registra el servicio y calcula la próxima fecha.", icon: fumigationIcon },
        { title: "Otro mantenimiento", description: "Reporta cualquier otro servicio realizado al vehículo.", icon: maintenanceIcon },
    ];
    return <div className="min-h-dvh bg-gray-50 pb-24 pt-24"><Header nombre={user?.nombre ?? "Conductor"} role="Conductor" /><main className="mx-auto w-full max-w-md px-4"><button type="button" onClick={() => navigate(-1)} className="mb-4 rounded-full border bg-white px-4 py-2 text-sm">← Volver</button><p className="text-xs font-semibold uppercase tracking-wider text-amber-500">Mi jornada</p><h1 className="mt-1 text-2xl font-bold text-gray-900">Reportar mantenimiento</h1><p className="mt-2 text-sm text-gray-500">Selecciona el servicio que deseas registrar.</p><section className="mt-6 space-y-3">{options.map((option) => <button key={option.title} type="button" className="flex w-full items-center gap-4 rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:border-amber-400"><span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-amber-50"><img src={option.icon} alt="" className="h-8 w-8 object-contain" /></span><span><strong className="block text-base text-gray-900">{option.title}</strong><span className="mt-1 block text-xs leading-relaxed text-gray-500">{option.description}</span><span className="mt-2 block text-xs font-semibold text-amber-500">Formulario en la siguiente etapa →</span></span></button>)}</section></main><FooterNav /></div>;
}
