import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import Footer from "../components/ui/Footer";
import JourneyHeader from "../components/ui/JourneyHeader";
import TripCargoForm from "../components/ui/TripCargoForm";
import TripHeaderSummary from "../components/ui/TripHeaderSummary";
import { tripService } from "../services/trip.service";
import type { TripLocation, TripStatus } from "../services/trip.service";
import { offlineSyncService } from "../services/offline-sync.service";

type ProductName = "Huevos" | "Alimento balanceado";
type MovementType = "Recogida" | "Entrega";

interface MovementDraft {
    type: MovementType;
    productName: ProductName;
    quantity: string;
}

interface StopDraft {
    locationId: string;
    movements: MovementDraft[];
}

const products = [
    { name: "Huevos" as const, unit: "Unidades" },
    { name: "Alimento balanceado" as const, unit: "Kilogramos" },
];

const unitByProduct: Record<ProductName, string> = {
    Huevos: "Unidades",
    "Alimento balanceado": "Kilogramos",
};

const createEmptyMovement = (): MovementDraft => ({
    type: "Entrega",
    productName: "Huevos",
    quantity: "",
});

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
        void Promise.all([
            tripService.findStatus(),
            tripService.findLocations(),
        ]).then(([tripStatus, availableLocations]) => {
            setStatus(tripStatus);
            setLocations(availableLocations);
            setOriginId(String(
                tripStatus.suggestedOriginId ?? availableLocations[0]?.id ?? ""
            ));
        }).catch((requestError: unknown) => {
            setError(
                requestError instanceof Error
                    ? requestError.message
                    : "No fue posible cargar los datos del viaje"
            );
        });
    }, []);

    const initialCargo = [
        ...(Number(eggs) > 0
            ? [{ productName: "Huevos", unit: "Unidades", quantity: Number(eggs) }]
            : []),
        ...(Number(balancedFeed) > 0
            ? [{
                productName: "Alimento balanceado",
                unit: "Kilogramos",
                quantity: Number(balancedFeed),
            }]
            : []),
    ];

    const hasValidStops = stops.length > 0 && stops.every((stop) =>
        Boolean(stop.locationId) && stop.movements.every((movement) =>
            !movement.quantity || Number(movement.quantity) > 0
        )
    );
    const canSave = Boolean(
        status?.canStart && originId && hasValidStops && observations.length <= 300
    );

    const updateStop = (stopIndex: number, changes: Partial<StopDraft>) => {
        setStops((currentStops) => currentStops.map((stop, index) =>
            index === stopIndex ? { ...stop, ...changes } : stop
        ));
    };

    const updateMovement = (
        stopIndex: number,
        movementIndex: number,
        changes: Partial<MovementDraft>
    ) => {
        setStops((currentStops) => currentStops.map((stop, index) => {
            if (index !== stopIndex) return stop;

            return {
                ...stop,
                movements: stop.movements.map((movement, itemIndex) =>
                    itemIndex === movementIndex
                        ? { ...movement, ...changes }
                        : movement
                ),
            };
        }));
    };

    const createTrip = async () => {
        if (!canSave || isSaving) return;

        setIsSaving(true);
        setError(null);

        try {
            const input = {
                originId: Number(originId),
                observations,
                products: initialCargo,
                stops: stops.map((stop) => ({
                    locationId: Number(stop.locationId),
                    movements: stop.movements
                        .filter((movement) => Number(movement.quantity) > 0)
                        .map((movement) => ({
                            productName: movement.productName,
                            unit: unitByProduct[movement.productName],
                            quantity: Number(movement.quantity),
                            type: movement.type,
                        })),
                })),
            };

            await offlineSyncService.enqueueAndSync("trip", {
                input,
                vehicle: status?.vehicle ?? null,
            });

            navigate("/home");
        } catch (requestError) {
            setError(
                requestError instanceof Error
                    ? requestError.message
                    : "No fue posible registrar el viaje"
            );
        } finally {
            setIsSaving(false);
        }
    };

    const user = (() => {
        try {
            return JSON.parse(localStorage.getItem("user") ?? "null") as {
                nombre?: string;
            } | null;
        } catch {
            return null;
        }
    })();

    return (
        <div className="mx-auto min-h-dvh w-full max-w-2xl bg-white md:my-6 md:min-h-[calc(100dvh-3rem)] md:rounded-2xl md:border md:border-gray-100 md:shadow-sm">
            <JourneyHeader
                title="Registrar viaje"
                onBack={() => navigate("/home")}
            />
            <main className="space-y-3 px-4 pb-28 md:px-8">
                {error && (
                    <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                        {error}
                    </p>
                )}
                {!status && !error && (
                    <p className="py-10 text-center text-sm text-gray-500">
                        Consultando jornada...
                    </p>
                )}
                {status && !status.hasCheckIn && (
                    <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                        Primero debes realizar el check-in de un vehículo.
                    </p>
                )}
                {status?.vehicle && status.activeTrip && (
                    <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                        Ya tienes un viaje en curso. Debes terminarlo antes de registrar otro.
                    </p>
                )}

                {status?.vehicle && !status.activeTrip && (
                    <>
                        <TripHeaderSummary
                            type={status.vehicle.type}
                            plate={status.vehicle.plate}
                            driverName={user?.nombre ?? "Conductor"}
                        />
                        <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
                            <h2 className="text-sm font-bold text-gray-900">
                                Viaje {status.nextTripNumber}
                            </h2>
                            <label className="block text-xs font-semibold">
                                Origen
                                <select
                                    value={originId}
                                    onChange={(event) => setOriginId(event.target.value)}
                                    className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm"
                                >
                                    {locations.map((location) => (
                                        <option key={location.id} value={location.id}>
                                            {location.name}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <div>
                                <p className="mb-2 text-xs font-semibold">
                                    Carga inicial en el origen (opcional)
                                </p>
                                <TripCargoForm
                                    eggs={eggs}
                                    balancedFeed={balancedFeed}
                                    onEggsChange={setEggs}
                                    onBalancedFeedChange={setBalancedFeed}
                                />
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between gap-3">
                                    <h3 className="text-xs font-bold">Paradas del recorrido</h3>
                                    <button
                                        type="button"
                                        disabled={stops.length >= 20}
                                        onClick={() => setStops((currentStops) => [
                                            ...currentStops,
                                            {
                                                locationId: "",
                                                movements: [createEmptyMovement()],
                                            },
                                        ])}
                                        className="rounded-lg border px-3 py-2 text-xs font-semibold disabled:opacity-50"
                                    >
                                        Añadir parada
                                    </button>
                                </div>

                                {stops.map((stop, stopIndex) => (
                                    <fieldset
                                        key={stopIndex}
                                        className="space-y-3 rounded-xl border border-gray-200 p-3"
                                    >
                                        <div className="flex justify-between text-xs font-semibold">
                                            <legend>Parada {stopIndex + 1}</legend>
                                            <button
                                                type="button"
                                                onClick={() => setStops((currentStops) =>
                                                    currentStops.filter((_, index) => index !== stopIndex)
                                                )}
                                                aria-label={`Eliminar parada ${stopIndex + 1}`}
                                                className="text-red-600"
                                            >
                                                Quitar
                                            </button>
                                        </div>
                                        <label className="sr-only" htmlFor={`location-${stopIndex}`}>
                                            Ubicación de parada {stopIndex + 1}
                                        </label>
                                        <select
                                            id={`location-${stopIndex}`}
                                            value={stop.locationId}
                                            onChange={(event) => updateStop(stopIndex, {
                                                locationId: event.target.value,
                                            })}
                                            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                                        >
                                            <option value="">Selecciona ubicación</option>
                                            {locations.map((location) => (
                                                <option key={location.id} value={location.id}>
                                                    {location.name}
                                                </option>
                                            ))}
                                        </select>

                                        {stop.movements.map((movement, movementIndex) => (
                                            <div
                                                key={movementIndex}
                                                className="grid grid-cols-1 gap-2 sm:grid-cols-3"
                                            >
                                                <label className="sr-only" htmlFor={`movement-type-${stopIndex}-${movementIndex}`}>
                                                    Tipo de movimiento
                                                </label>
                                                <select
                                                    id={`movement-type-${stopIndex}-${movementIndex}`}
                                                    value={movement.type}
                                                    onChange={(event) => updateMovement(stopIndex, movementIndex, {
                                                        type: event.target.value as MovementType,
                                                    })}
                                                    className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-xs"
                                                >
                                                    <option>Entrega</option>
                                                    <option>Recogida</option>
                                                </select>
                                                <label className="sr-only" htmlFor={`product-${stopIndex}-${movementIndex}`}>
                                                    Producto
                                                </label>
                                                <select
                                                    id={`product-${stopIndex}-${movementIndex}`}
                                                    value={movement.productName}
                                                    onChange={(event) => updateMovement(stopIndex, movementIndex, {
                                                        productName: event.target.value as ProductName,
                                                    })}
                                                    className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-xs"
                                                >
                                                    {products.map((product) => (
                                                        <option key={product.name} value={product.name}>
                                                            {product.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="flex gap-2">
                                                    <label className="sr-only" htmlFor={`quantity-${stopIndex}-${movementIndex}`}>
                                                        Cantidad
                                                    </label>
                                                    <input
                                                        id={`quantity-${stopIndex}-${movementIndex}`}
                                                        type="number"
                                                        min="0.01"
                                                        step="0.01"
                                                        value={movement.quantity}
                                                        onChange={(event) => updateMovement(stopIndex, movementIndex, {
                                                            quantity: event.target.value,
                                                        })}
                                                        placeholder="Cantidad"
                                                        className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                                                    />
                                                    {stop.movements.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => updateStop(stopIndex, {
                                                                movements: stop.movements.filter((_, index) => index !== movementIndex),
                                                            })}
                                                            aria-label="Quitar movimiento"
                                                            className="px-2 text-red-600"
                                                        >
                                                            ×
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => updateStop(stopIndex, {
                                                movements: [...stop.movements, createEmptyMovement()],
                                            })}
                                            className="text-left text-xs font-semibold text-amber-700"
                                        >
                                            Añadir movimiento de carga
                                        </button>
                                    </fieldset>
                                ))}

                                {stops.length === 0 && (
                                    <p className="text-xs text-gray-500">
                                        Añade al menos una parada. Puedes repetir ubicaciones.
                                    </p>
                                )}
                            </div>

                            <label className="block text-xs font-semibold">
                                Observaciones (opcional)
                                <textarea
                                    maxLength={300}
                                    value={observations}
                                    onChange={(event) => setObservations(event.target.value)}
                                    className="mt-2 h-20 w-full rounded-lg border border-gray-200 p-3 text-sm"
                                />
                            </label>

                            <button
                                type="button"
                                onClick={() => void createTrip()}
                                disabled={!canSave || isSaving}
                                className="w-full rounded-lg bg-amber-400 py-3 text-sm font-semibold disabled:opacity-50"
                            >
                                {isSaving ? "Registrando..." : "Registrar recorrido"}
                            </button>
                        </section>
                    </>
                )}
            </main>
            <Footer />
        </div>
    );
}
