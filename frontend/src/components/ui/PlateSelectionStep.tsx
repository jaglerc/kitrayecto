import camionetaIcon from "../../icons/camioneta.png";
import carroIcon from "../../icons/carro.png";
import motocargueroIcon from "../../icons/motocarguero.png";
import motocicletaIcon from "../../icons/motocicleta.png";

import type { Vehicle } from "../../services/vehicle.service";
import type { VehicleType } from "./VehicleTypeStep";

interface PlateSelectionStepProps {
    selectedType: VehicleType;
    vehicles: Vehicle[];
    selectedVehicleId: number | null;
    isLoading: boolean;
    error: string | null;
    onSelect: (vehicleId: number) => void;
}

interface VehicleInformation {
    label: string;
    icon: string;
}

const vehicleInformation: Record<VehicleType, VehicleInformation> = {
    camioneta: {
        label: "Camioneta",
        icon: camionetaIcon,
    },
    motocicleta: {
        label: "Motocicleta",
        icon: motocicletaIcon,
    },
    motocarguero: {
        label: "Motocarguero",
        icon: motocargueroIcon,
    },
    carro: {
        label: "Carro",
        icon: carroIcon,
    },
};

export default function PlateSelectionStep({
    selectedType,
    vehicles,
    selectedVehicleId,
    isLoading,
    error,
    onSelect,
}: PlateSelectionStepProps) {
    const selectedTypeInformation =
        vehicleInformation[selectedType];

    return (
        <section className="mt-4 rounded-xl border border-gray-200 bg-white p-3">
            <h2 className="text-sm font-semibold text-gray-900">
                2. Selecciona la placa
            </h2>

            <div className="mt-3 flex items-center gap-3 rounded-lg border border-gray-200 p-3">
                <img
                    src={selectedTypeInformation.icon}
                    alt=""
                    aria-hidden="true"
                    className="h-10 w-14 object-contain"
                />

                <div>
                    <p className="text-xs text-gray-500">
                        Vehículo seleccionado:
                    </p>

                    <p className="font-semibold text-gray-900">
                        {selectedTypeInformation.label}
                    </p>
                </div>
            </div>

            <h3 className="mt-4 text-xs font-semibold text-gray-900">
                Placas disponibles
            </h3>

            {isLoading && (
                <p className="mt-3 text-sm text-gray-500">
                    Consultando vehículos...
                </p>
            )}

            {error && (
                <p
                    role="alert"
                    className="mt-3 text-sm text-red-600"
                >
                    {error}
                </p>
            )}

            {!isLoading && !error && vehicles.length === 0 && (
                <p className="mt-3 text-sm text-gray-500">
                    No hay vehículos disponibles de este tipo.
                </p>
            )}

            {!isLoading && !error && vehicles.length > 0 && (
                <div className="mt-2 space-y-2">
                    {vehicles.map((vehicle) => {
                        const isSelected =
                            vehicle.id === selectedVehicleId;

                        return (
                            <button
                                key={vehicle.id}
                                type="button"
                                onClick={() => onSelect(vehicle.id)}
                                aria-pressed={isSelected}
                                className={[
                                    "flex w-full items-center gap-3",
                                    "rounded-lg border px-3 py-3",
                                    "text-left transition-colors",
                                    isSelected
                                        ? "border-amber-400 bg-amber-50"
                                        : "border-gray-200 bg-white",
                                ].join(" ")}
                            >
                                <span
                                    aria-hidden="true"
                                    className={[
                                        "flex h-5 w-5 items-center",
                                        "justify-center rounded-full border",
                                        isSelected
                                            ? "border-amber-400 bg-amber-400 text-white"
                                            : "border-gray-300",
                                    ].join(" ")}
                                >
                                    {isSelected && "✓"}
                                </span>

                                <span className="font-semibold text-gray-900">
                                    {vehicle.plate}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
