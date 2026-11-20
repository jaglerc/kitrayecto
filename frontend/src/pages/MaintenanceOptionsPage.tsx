import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import FooterNav from "../components/ui/Footer";
import JourneyHeader from "../components/ui/JourneyHeader";
import MaintenanceEvidencePicker from "../components/ui/MaintenanceEvidencePicker";
import TripHeaderSummary from "../components/ui/TripHeaderSummary";
import fumigationIcon from "../icons/warning-sign.png";
import maintenanceIcon from "../icons/support.png";
import oilIcon from "../icons/cost.png";
import { maintenanceService } from "../services/maintenance.service";
import type {
    MaintenanceClass,
    MaintenanceServiceType,
    MaintenanceStatus,
} from "../services/maintenance.service";
import { storageService } from "../services/storage.service";
import { tripService } from "../services/trip.service";
import type { TripStatus } from "../services/trip.service";

const serviceOptions: Array<{
    value: MaintenanceServiceType;
    description: string;
    icon: string;
}> = [
    { value: "Cambio de aceite", description: "Registra el cambio y actualiza la próxima alerta por kilometraje.", icon: oilIcon },
    { value: "Fumigación", description: "Guarda el servicio y actualiza la próxima fecha de fumigación.", icon: fumigationIcon },
    { value: "Otro", description: "Reporta frenos, llantas, motor u otro servicio del vehículo.", icon: maintenanceIcon },
];

const classOptions: MaintenanceClass[] = ["Preventivo", "Correctivo", "Emergencia"];
const statusOptions: MaintenanceStatus[] = ["Realizado", "Programado"];
const commonCategories = ["Frenos", "Llantas", "Motor", "Carrocería", "General"];

const today = (): string => {
    const date = new Date();
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
    return localDate.toISOString().slice(0, 10);
};

const getUserName = (): string => {
    try {
        const user = JSON.parse(localStorage.getItem("user") ?? "null") as { nombre?: string } | null;
        return user?.nombre ?? "Conductor";
    } catch {
        return "Conductor";
    }
};

const fieldClass = "mt-2 min-h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100";

export default function MaintenanceOptionsPage() {
    const navigate = useNavigate();
    const driverName = getUserName();
    const [tripStatus, setTripStatus] = useState<TripStatus | null>(null);
    const [selectedService, setSelectedService] = useState<MaintenanceServiceType | null>(null);
    const [serviceClass, setServiceClass] = useState<MaintenanceClass>("Preventivo");
    const [category, setCategory] = useState("General");
    const [otherCategory, setOtherCategory] = useState("");
    const [serviceDate, setServiceDate] = useState(today);
    const [mileage, setMileage] = useState("");
    const [provider, setProvider] = useState("");
    const [description, setDescription] = useState("");
    const [cost, setCost] = useState("");
    const [nextServiceDate, setNextServiceDate] = useState("");
    const [nextServiceMileage, setNextServiceMileage] = useState("");
    const [status, setStatus] = useState<MaintenanceStatus>("Realizado");
    const [observations, setObservations] = useState("");
    const [evidence, setEvidence] = useState<File | null>(null);
    const [savedId, setSavedId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        void tripService.findStatus()
            .then(setTripStatus)
            .catch((requestError: unknown) => {
                setError(requestError instanceof Error ? requestError.message : "No fue posible consultar el vehículo de la jornada");
            });
    }, []);

    const changeService = (service: MaintenanceServiceType) => {
        setSelectedService(service);
        setCategory(service === "Cambio de aceite" ? "Aceite" : service === "Fumigación" ? "Fumigación" : "General");
        setError(null);
    };

    const canSave = Boolean(
        selectedService &&
        tripStatus?.vehicle &&
        serviceDate &&
        description.trim() &&
        cost !== "" &&
        Number.isFinite(Number(cost)) &&
        Number(cost) >= 0 &&
        (status !== "Realizado" || selectedService !== "Cambio de aceite" || Number.isInteger(Number(mileage))) &&
        (selectedService !== "Otro" || (category === "General" ? otherCategory.trim() : category))
    );

    const save = async () => {
        if (isSaving || !canSave || !selectedService || !tripStatus?.vehicle) return;
        setIsSaving(true);
        setError(null);

        try {
            let maintenanceId = savedId;
            if (maintenanceId === null) {
                const created = await maintenanceService.create({
                    serviceType: selectedService,
                    serviceClass,
                    category: selectedService === "Otro" && category === "General" ? otherCategory : category,
                    serviceDate,
                    mileage: mileage === "" ? null : Number(mileage),
                    provider: provider.trim(),
                    description: description.trim(),
                    cost: Number(cost),
                    nextServiceDate: nextServiceDate || null,
                    nextServiceMileage: nextServiceMileage === "" ? null : Number(nextServiceMileage),
                    status,
                    observations: observations.trim(),
                });
                maintenanceId = created.id;
                setSavedId(created.id);
            }

            if (evidence && maintenanceId !== null) {
                const uploaded = await storageService.uploadFile(evidence, "mantenimientos", maintenanceId);
                await maintenanceService.attachEvidence(maintenanceId, uploaded);
            }

            navigate("/home");
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : "No fue posible guardar el mantenimiento");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-dvh bg-gray-50">
            <div className="mx-auto min-h-dvh w-full max-w-3xl bg-white shadow-sm">
                <JourneyHeader title="Reportar mantenimiento" onBack={() => navigate(-1)} />
                <main className="space-y-5 px-4 pb-28 pt-3 sm:px-6">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">Mi jornada</p>
                        <h1 className="mt-1 text-2xl font-bold text-gray-900">Mantenimiento del vehículo</h1>
                        <p className="mt-1 text-sm text-gray-500">Registra el servicio para conservar el historial y las próximas alertas.</p>
                    </div>

                    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

                    {!tripStatus && !error && <p className="rounded-xl border border-gray-200 p-4 text-sm text-gray-500">Consultando el vehículo de la jornada…</p>}
                    {tripStatus && !tripStatus.vehicle && (
                        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                            Debes registrar el ingreso del vehículo a tu jornada antes de reportar un mantenimiento.
                        </p>
                    )}

                    {tripStatus?.vehicle && (
                        <>
                            <TripHeaderSummary type={tripStatus.vehicle.type} plate={tripStatus.vehicle.plate} driverName={driverName} />

                            {!selectedService ? (
                                <section className="grid gap-3 sm:grid-cols-3" aria-label="Tipo de mantenimiento">
                                    {serviceOptions.map((option) => (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => changeService(option.value)}
                                            className="flex min-h-32 items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-amber-400 hover:bg-amber-50/40 focus-visible:outline-2 focus-visible:outline-amber-400 sm:flex-col sm:items-start"
                                        >
                                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-50">
                                                <img src={option.icon} alt="" className="h-7 w-7 object-contain" />
                                            </span>
                                            <span>
                                                <strong className="block text-sm text-gray-900">{option.value === "Otro" ? "Otro mantenimiento" : option.value}</strong>
                                                <span className="mt-1 block text-xs leading-relaxed text-gray-500">{option.description}</span>
                                            </span>
                                        </button>
                                    ))}
                                </section>
                            ) : (
                                <section className="space-y-5 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
                                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
                                        <div>
                                            <p className="text-xs text-gray-500">Servicio seleccionado</p>
                                            <h2 className="text-lg font-bold text-gray-900">{selectedService === "Otro" ? "Otro mantenimiento" : selectedService}</h2>
                                        </div>
                                        {!savedId && <button type="button" onClick={() => setSelectedService(null)} className="min-h-10 rounded-lg px-3 text-sm font-medium text-amber-700 hover:bg-amber-50">Cambiar servicio</button>}
                                    </div>

                                    <fieldset>
                                        <legend className="text-sm font-semibold text-gray-800">Clase de mantenimiento</legend>
                                        <div className="mt-2 grid grid-cols-3 gap-2">
                                            {classOptions.map((option) => (
                                                <button key={option} type="button" onClick={() => setServiceClass(option)} className={`min-h-10 rounded-lg border px-2 text-xs font-semibold sm:text-sm ${serviceClass === option ? "border-amber-400 bg-amber-50 text-amber-800" : "border-gray-200 text-gray-600"}`}>
                                                    {option}
                                                </button>
                                            ))}
                                        </div>
                                    </fieldset>

                                    {selectedService === "Otro" ? (
                                        <div>
                                            <label className="text-sm font-semibold text-gray-800" htmlFor="maintenance-category">Categoría</label>
                                            <select id="maintenance-category" value={category} onChange={(event) => setCategory(event.target.value)} className={fieldClass}>
                                                {commonCategories.map((option) => <option key={option} value={option}>{option}</option>)}
                                            </select>
                                            {category === "General" && <input maxLength={60} value={otherCategory} onChange={(event) => setOtherCategory(event.target.value)} placeholder="Especifica el servicio" className={fieldClass} aria-label="Especifica la categoría" />}
                                        </div>
                                    ) : (
                                        <div>
                                            <p className="text-sm font-semibold text-gray-800">Categoría</p>
                                            <p className="mt-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 text-sm font-medium text-amber-800">{selectedService === "Cambio de aceite" ? "Aceite" : "Fumigación"}</p>
                                        </div>
                                    )}

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <label className="text-sm font-semibold text-gray-800">Fecha del servicio
                                            <input type="date" value={serviceDate} onChange={(event) => setServiceDate(event.target.value)} className={fieldClass} required />
                                        </label>
                                        <label className="text-sm font-semibold text-gray-800">Estado
                                            <select value={status} onChange={(event) => setStatus(event.target.value as MaintenanceStatus)} className={fieldClass}>
                                                {statusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                                            </select>
                                        </label>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <label className="text-sm font-semibold text-gray-800">Kilometraje <span className="font-normal text-gray-400">{selectedService === "Cambio de aceite" && status === "Realizado" ? "(obligatorio)" : "(opcional)"}</span>
                                            <div className="mt-2 flex min-h-11 items-center rounded-lg border border-gray-200 px-3 focus-within:border-amber-400">
                                                <input type="number" min="0" step="1" inputMode="numeric" value={mileage} onChange={(event) => setMileage(event.target.value)} className="min-w-0 flex-1 py-2 text-sm outline-none" placeholder="Ej. 72450" />
                                                <span className="text-xs text-gray-400">km</span>
                                            </div>
                                        </label>
                                        <label className="text-sm font-semibold text-gray-800">Taller o proveedor <span className="font-normal text-gray-400">(opcional)</span>
                                            <input maxLength={120} value={provider} onChange={(event) => setProvider(event.target.value)} className={fieldClass} placeholder="Nombre del taller" />
                                        </label>
                                    </div>

                                    <label className="block text-sm font-semibold text-gray-800">Descripción del servicio
                                        <textarea maxLength={1000} value={description} onChange={(event) => setDescription(event.target.value)} className={`${fieldClass} min-h-24 resize-y py-3`} placeholder="Describe el trabajo realizado o programado" required />
                                        <span className="mt-1 block text-right text-xs font-normal text-gray-400">{description.length}/1000</span>
                                    </label>

                                    <label className="block text-sm font-semibold text-gray-800">Costo del mantenimiento
                                        <div className="mt-2 flex min-h-11 items-center rounded-lg border border-gray-200 px-3 focus-within:border-amber-400">
                                            <span className="text-sm text-gray-500">$</span>
                                            <input type="number" min="0" step="100" inputMode="decimal" value={cost} onChange={(event) => setCost(event.target.value)} className="min-w-0 flex-1 px-2 py-2 text-sm outline-none" placeholder="0" required />
                                            <span className="text-xs text-gray-400">COP</span>
                                        </div>
                                        <span className="mt-1 block text-xs font-normal text-gray-400">Escribe 0 si el servicio no tuvo costo.</span>
                                    </label>

                                    <div>
                                        <p className="text-sm font-semibold text-gray-800">Próximo mantenimiento <span className="font-normal text-gray-400">(opcional)</span></p>
                                        <div className="mt-2 grid gap-3 sm:grid-cols-2">
                                            <label className="text-xs font-medium text-gray-600">Por fecha
                                                <input type="date" value={nextServiceDate} onChange={(event) => setNextServiceDate(event.target.value)} className={fieldClass} />
                                            </label>
                                            <label className="text-xs font-medium text-gray-600">Por kilometraje
                                                <div className="mt-2 flex min-h-11 items-center rounded-lg border border-gray-200 px-3 focus-within:border-amber-400">
                                                    <input type="number" min="0" step="1" inputMode="numeric" value={nextServiceMileage} onChange={(event) => setNextServiceMileage(event.target.value)} className="min-w-0 flex-1 py-2 text-sm outline-none" placeholder="Ej. 80000" />
                                                    <span className="text-xs text-gray-400">km</span>
                                                </div>
                                            </label>
                                        </div>
                                    </div>

                                    <MaintenanceEvidencePicker file={evidence} onChange={setEvidence} />

                                    <label className="block text-sm font-semibold text-gray-800">Observaciones <span className="font-normal text-gray-400">(opcional)</span>
                                        <textarea maxLength={300} value={observations} onChange={(event) => setObservations(event.target.value)} className={`${fieldClass} min-h-20 resize-y py-3`} placeholder="Información adicional" />
                                        <span className="mt-1 block text-right text-xs font-normal text-gray-400">{observations.length}/300</span>
                                    </label>

                                    {savedId !== null && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">El mantenimiento ya se guardó. Puedes reintentar la carga del comprobante.</p>}
                                    <button type="button" onClick={() => void save()} disabled={!canSave || isSaving} className="min-h-12 w-full rounded-xl bg-amber-400 px-4 text-sm font-bold text-gray-900 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50">
                                        {isSaving ? "Guardando…" : savedId ? "Adjuntar comprobante y finalizar →" : "Registrar mantenimiento →"}
                                    </button>
                                </section>
                            )}
                        </>
                    )}
                </main>
                <FooterNav />
            </div>
        </div>
    );
}
