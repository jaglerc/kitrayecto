import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import Footer from "../components/ui/Footer";
import FuelReceiptPicker from "../components/ui/FuelReceiptPicker";
import JourneyHeader from "../components/ui/JourneyHeader";
import TripHeaderSummary from "../components/ui/TripHeaderSummary";
import calendarIcon from "../icons/calendar-trip.svg";
import { fuelService } from "../services/fuel.service";
import type { FuelType } from "../services/fuel.service";
import { storageService } from "../services/storage.service";
import { tripService } from "../services/trip.service";
import type { TripStatus } from "../services/trip.service";

const fuelTypes: Array<{ value: FuelType; label: string }> = [{ value: "Gasolina", label: "Gasolina" }, { value: "ACPM", label: "ACPM" }, { value: "Gas", label: "Gas" }, { value: "Electrico", label: "Eléctrico" }];

export default function FuelRegistrationPage() {
    const navigate = useNavigate();
    const [status, setStatus] = useState<TripStatus | null>(null);
    const [mileage, setMileage] = useState("");
    const [gallons, setGallons] = useState("");
    const [amount, setAmount] = useState("");
    const [station, setStation] = useState("");
    const [fuelType, setFuelType] = useState<FuelType>("Gasolina");
    const [observations, setObservations] = useState("");
    const [receipt, setReceipt] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const user = (() => { try { return JSON.parse(localStorage.getItem("user") ?? "null") as { nombre?: string } | null; } catch { return null; } })();

    useEffect(() => { void tripService.findStatus().then(setStatus).catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : "No fue posible consultar el viaje")); }, []);
    const canSave = Boolean(status?.activeTrip && Number.isInteger(Number(mileage)) && Number(mileage) >= 0 && Number(gallons) > 0 && Number(amount) > 0 && station.trim() && receipt && observations.length <= 300);
    const save = async () => {
        if (!status?.activeTrip || !receipt || !canSave || isSaving) return;
        setIsSaving(true); setError(null);
        try {
            const evidence = await storageService.uploadImage(receipt, "combustible", status.activeTrip.id);
            await fuelService.create({ currentMileage: Number(mileage), gallons: Number(gallons), amountPaid: Number(amount), serviceStation: station, fuelType, observations, evidence });
            navigate("/home");
        } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "No fue posible registrar el combustible"); }
        finally { setIsSaving(false); }
    };

    return <div className="mx-auto min-h-dvh w-full max-w-md bg-white"><JourneyHeader title="Reportar combustible" onBack={() => navigate("/home")} /><main className="space-y-3 px-4 pb-28">{error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</p>}{!status && !error && <p className="py-10 text-center text-sm text-gray-500">Consultando viaje activo...</p>}{status && !status.activeTrip && <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">Debes iniciar un viaje antes de registrar combustible.</p>}{status?.activeTrip && <><TripHeaderSummary type={status.activeTrip.vehicle.type} plate={status.activeTrip.vehicle.plate} driverName={user?.nombre ?? "Conductor"} /><section className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><div className="grid grid-cols-2 gap-3"><label className="text-xs font-semibold">1. Vehículo<input readOnly value={status.activeTrip.vehicle.type} className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 capitalize text-gray-500" /></label><label className="text-xs font-semibold">2. Placa<input readOnly value={status.activeTrip.vehicle.plate} className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-500" /></label></div><label className="block text-xs font-semibold">3. Conductor<input readOnly value={user?.nombre ?? "Conductor"} className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-500" /></label><label className="block text-xs font-semibold">4. Fecha y hora<div className="mt-2 flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"><img src={calendarIcon} alt="" className="h-5 w-5" /><span className="text-sm font-normal text-gray-600">{new Date().toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" })}</span></div></label><div className="grid grid-cols-2 gap-3"><label className="text-xs font-semibold">5. Kilometraje actual <span className="text-amber-500">*</span><div className="mt-2 flex rounded-lg border border-gray-200 px-3"><input type="number" min="0" step="1" inputMode="numeric" value={mileage} onChange={(event) => setMileage(event.target.value)} placeholder="Kilometraje" className="min-w-0 flex-1 py-2 outline-none" /><span className="self-center text-[10px] text-gray-400">km</span></div></label><label className="text-xs font-semibold">6. Cantidad <span className="text-amber-500">*</span><div className="mt-2 flex rounded-lg border border-gray-200 px-3"><input type="number" min="0.01" step="0.01" inputMode="decimal" value={gallons} onChange={(event) => setGallons(event.target.value)} placeholder="Cantidad" className="min-w-0 flex-1 py-2 outline-none" /><span className="self-center text-[10px] text-gray-400">gal</span></div></label></div><div><p className="text-xs font-semibold">7. Unidad</p><div className="mt-2 rounded-lg border border-amber-400 bg-amber-50 py-2 text-center text-xs font-semibold text-amber-700">Galones</div></div><label className="block text-xs font-semibold">8. Valor pagado <span className="text-amber-500">*</span><div className="mt-2 flex rounded-lg border border-gray-200 px-3"><span className="self-center text-gray-400">$</span><input type="number" min="0.01" step="0.01" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Ingrese valor" className="min-w-0 flex-1 px-2 py-2 outline-none" /></div></label><label className="block text-xs font-semibold">9. Estación de servicio <span className="text-amber-500">*</span><input maxLength={120} value={station} onChange={(event) => setStation(event.target.value)} placeholder="Nombre de la estación" className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-amber-400" /></label><fieldset><legend className="text-xs font-semibold">10. Tipo de combustible <span className="text-amber-500">*</span></legend><div className="mt-2 grid grid-cols-4 gap-2">{fuelTypes.map((type) => <button key={type.value} type="button" onClick={() => setFuelType(type.value)} className={`rounded-lg border px-1 py-2 text-[10px] font-semibold ${fuelType === type.value ? "border-amber-400 bg-amber-50 text-amber-700" : "border-gray-200"}`}>{type.label}</button>)}</div></fieldset><FuelReceiptPicker file={receipt} onChange={setReceipt} /><label className="block text-xs font-semibold">12. Observaciones <span className="font-normal text-gray-400">(opcional)</span><textarea maxLength={300} value={observations} onChange={(event) => setObservations(event.target.value)} placeholder="Agrega observaciones adicionales..." className="mt-2 h-20 w-full resize-none rounded-lg border border-gray-200 p-3 outline-none focus:border-amber-400" /><span className="block text-right text-[9px] text-gray-400">{observations.length}/300</span></label><button type="button" onClick={() => void save()} disabled={!canSave || isSaving} className="w-full rounded-lg bg-amber-400 py-3 text-sm font-semibold text-gray-900 disabled:opacity-50">{isSaving ? "Registrando..." : "Registrar combustible →"}</button></section></>}</main><Footer /></div>;
}
