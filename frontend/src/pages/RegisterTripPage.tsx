import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import Footer from "../components/ui/Footer";
import JourneyHeader from "../components/ui/JourneyHeader";
import TripCargoForm from "../components/ui/TripCargoForm";
import TripHeaderSummary from "../components/ui/TripHeaderSummary";
import { tripService } from "../services/trip.service";
import type { TripLocation, TripStatus } from "../services/trip.service";

type MovementDraft = { type: "Recogida" | "Entrega"; productName: "Huevos" | "Alimento balanceado"; quantity: string };
type StopDraft = { locationId: string; movements: MovementDraft[] };
const products = [
    { name: "Huevos" as const, unit: "Unidades" },
    { name: "Alimento balanceado" as const, unit: "Kilogramos" },
];

export default function RegisterTripPage() {
    const navigate = useNavigate();
    const [status, setStatus] = useState<TripStatus | null>(null);
    const [locations, setLocations] = useState<TripLocation[]>([]);
    const [originId, setOriginId] = useState("");
    const [eggs, setEggs] = useState("");
    const [balancedFeed, setBalancedFeed] = useState("");
    const [stops, setStops] = useState<StopDraft[]>([]);
    const [observations, setObservations] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        void Promise.all([tripService.findStatus(), tripService.findLocations()]).then(([tripStatus, places]) => {
            setStatus(tripStatus);
            setLocations(places);
            setOriginId(String(tripStatus.suggestedOriginId ?? places[0]?.id ?? ""));
        }).catch((requestError: unknown) => {
            setError(requestError instanceof Error ? requestError.message : "No fue posible cargar los datos del viaje");
        });
    }, []);

    const cargo = [
        ...(Number(eggs) > 0 ? [{ productName: "Huevos", unit: "Unidades", quantity: Number(eggs) }] : []),
        ...(Number(balancedFeed) > 0 ? [{ productName: "Alimento balanceado", unit: "Kilogramos", quantity: Number(balancedFeed) }] : []),
    ];
    const validStops = stops.length > 0 && stops.every((stop) => stop.locationId && stop.movements.every((movement) => !movement.quantity || Number(movement.quantity) > 0));
    const canSave = Boolean(status?.canStart && originId && validStops && observations.length <= 300);

    const save = async () => {
        if (!canSave || isSaving) return;
        setIsSaving(true);
        setError(null);
        try {
            await tripService.create({
                originId: Number(originId), observations, products: cargo,
                stops: stops.map((stop) => {
                    const movements = stop.movements.filter((movement) => Number(movement.quantity) > 0).map((movement) => {
                        const product = products.find((item) => item.name === movement.productName)!;
                        return { productName: product.name, unit: product.unit, quantity: Number(movement.quantity), type: movement.type };
                    });
                    return { locationId: Number(stop.locationId), movements };
                }),
            });
            navigate("/home");
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : "No fue posible registrar el viaje");
        } finally { setIsSaving(false); }
    };

    const user = (() => { try { return JSON.parse(localStorage.getItem("user") ?? "null") as { nombre?: string } | null; } catch { return null; } })();
    const updateStop = (index: number, value: Partial<StopDraft>) => setStops((current) => current.map((stop, i) => i === index ? { ...stop, ...value } : stop));
    const updateMovement = (stopIndex: number, movementIndex: number, value: Partial<MovementDraft>) => setStops((current) => current.map((stop, i) => i === stopIndex ? { ...stop, movements: stop.movements.map((movement, j) => j === movementIndex ? { ...movement, ...value } : movement) } : stop));

    return <div className="mx-auto min-h-dvh w-full max-w-2xl bg-white md:my-6 md:min-h-[calc(100dvh-3rem)] md:rounded-2xl md:border md:border-gray-100 md:shadow-sm">
        <JourneyHeader title="Registrar viaje" onBack={() => navigate("/home")} />
        <main className="space-y-3 px-4 pb-28">
            {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</p>}
            {!status && !error && <p className="py-10 text-center text-sm text-gray-500">Consultando jornada...</p>}
            {status && !status.hasCheckIn && <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">Primero debes realizar el check-in de un vehículo.</p>}
                {status?.vehicle && !status.activeTrip && <>
                <TripHeaderSummary type={status.vehicle.type} plate={status.vehicle.plate} driverName={user?.nombre ?? "Conductor"} />
                <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
                    <h2 className="text-sm font-bold text-gray-900">Viaje {status.nextTripNumber}</h2>
                    <label className="block text-xs font-semibold">Origen<select value={originId} onChange={(event) => setOriginId(event.target.value)} className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm">{locations.map((place) => <option key={place.id} value={place.id}>{place.name}</option>)}</select></label>
                    <div><p className="mb-2 text-xs font-semibold">Carga inicial en el origen (opcional)</p><TripCargoForm eggs={eggs} balancedFeed={balancedFeed} onEggsChange={setEggs} onBalancedFeedChange={setBalancedFeed} /></div>
                    <div className="space-y-3"><div className="flex items-center justify-between"><h3 className="text-xs font-bold">Paradas del recorrido</h3><button type="button" disabled={stops.length >= 20} onClick={() => setStops((current) => [...current, { locationId: "", movements: [{ type: "Entrega", productName: "Huevos", quantity: "" }] }])} className="rounded-lg border px-3 py-2 text-xs font-semibold">Añadir parada</button></div>
                        {stops.map((stop, index) => <div key={index} className="space-y-2 rounded-xl border border-gray-200 p-3"><div className="flex justify-between text-xs font-semibold"><span>Parada {index + 1}</span><button type="button" onClick={() => setStops((current) => current.filter((_, i) => i !== index))} aria-label={`Eliminar parada ${index + 1}`} className="text-red-600">Quitar</button></div>
                            <select value={stop.locationId} onChange={(event) => updateStop(index, { locationId: event.target.value })} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"><option value="">Selecciona ubicación</option>{locations.map((place) => <option key={place.id} value={place.id}>{place.name}</option>)}</select>
                            {stop.movements.map((movement, movementIndex) => <div key={movementIndex} className="grid grid-cols-1 gap-2 sm:grid-cols-3"><select aria-label="Tipo de movimiento" value={movement.type} onChange={(event) => updateMovement(index, movementIndex, { type: event.target.value as MovementDraft["type"] })} className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-xs"><option>Entrega</option><option>Recogida</option></select><select aria-label="Producto" value={movement.productName} onChange={(event) => updateMovement(index, movementIndex, { productName: event.target.value as MovementDraft["productName"] })} className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-xs">{products.map((product) => <option key={product.name}>{product.name}</option>)}</select><div className="flex gap-2"><input type="number" min="0.01" step="0.01" value={movement.quantity} onChange={(event) => updateMovement(index, movementIndex, { quantity: event.target.value })} placeholder="Cantidad" className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm" />{stop.movements.length > 1 && <button type="button" onClick={() => updateStop(index, { movements: stop.movements.filter((_, i) => i !== movementIndex) })} aria-label="Quitar movimiento" className="px-2 text-red-600">×</button>}</div></div>)}
                            <button type="button" onClick={() => updateStop(index, { movements: [...stop.movements, { type: "Entrega", productName: "Huevos", quantity: "" }] })} className="text-left text-xs font-semibold text-amber-700">Añadir movimiento de carga</button>
                        </div>)}
                        {stops.length === 0 && <p className="text-xs text-gray-500">Añade al menos una parada. Puedes repetir ubicaciones.</p>}
                    </div>
                    <label className="block text-xs font-semibold">Observaciones (opcional)<textarea maxLength={300} value={observations} onChange={(event) => setObservations(event.target.value)} className="mt-2 h-20 w-full rounded-lg border border-gray-200 p-3 text-sm" /></label>
                    <button type="button" onClick={() => void save()} disabled={!canSave || isSaving} className="w-full rounded-lg bg-amber-400 py-3 text-sm font-semibold disabled:opacity-50">{isSaving ? "Registrando..." : "Registrar recorrido"}</button>
                </section>
            </>}
        </main><Footer />
    </div>;
}
