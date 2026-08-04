import camionetaIcon from "../../icons/camioneta.png";
import motocicletaIcon from "../../icons/motocicleta.png";
import motocargueroIcon from "../../icons/motocarguero.png";
import carroIcon from "../../icons/carro.png";

export type VehicleType =
    | "camioneta"
    | "motocicleta"
    | "motocarguero"
    | "carro";

interface VehicleOption {
    type: VehicleType;
    label: string;
    icon: string;
}

interface VehicleTypeStepProps {
    selectedType: VehicleType | null;
    onSelect: (type: VehicleType) => void;
}

const vehicleOptions: VehicleOption[] = [
    {
        type: "camioneta",
        label: "Camioneta",
        icon: camionetaIcon,
    },
    {
        type: "motocicleta",
        label: "Motocicleta",
        icon: motocicletaIcon,
    },
    {
        type: "motocarguero",
        label: "Motocargueros",
        icon: motocargueroIcon,
    },
    {
        type: "carro",
        label: "Carros",
        icon: carroIcon,
    },
];

export default function VehicleTypeStep({
    selectedType,
    onSelect,
}: VehicleTypeStepProps) {
    const selectedVehicle = vehicleOptions.find(
        (vehicle) => vehicle.type === selectedType
    );

    return (
        <section className="mt-4 space-y-3">
            <div className="rounded-xl border border-gray-200 bg-white p-3">
                <h2 className="mb-3 text-sm font-semibold text-gray-900">
                    1. Selecciona el tipo de vehículo
                </h2>

                <div className="grid grid-cols-2 gap-2">
                    {vehicleOptions.map((vehicle) => {
                        const isSelected =
                            vehicle.type === selectedType;

                        return (
                            <button
                                key={vehicle.type}
                                type="button"
                                onClick={() => onSelect(vehicle.type)}
                                aria-pressed={isSelected}
                                className={[
                                    "relative flex min-h-28 flex-col",
                                    "items-center justify-center",
                                    "rounded-xl border p-2",
                                    "transition-colors",
                                    isSelected
                                        ? "border-amber-400 bg-amber-50"
                                        : "border-gray-200 bg-white hover:border-gray-300",
                                ].join(" ")}
                            >
                                {isSelected && (
                                    <span
                                        aria-hidden="true"
                                        className="
                                            absolute right-2 top-2
                                            flex h-5 w-5 items-center
                                            justify-center rounded-full
                                            bg-amber-400 text-xs
                                            font-bold text-white
                                        "
                                    >
                                        ✓
                                    </span>
                                )}

                                <img
                                    src={vehicle.icon}
                                    alt=""
                                    aria-hidden="true"
                                    className="h-14 w-20 object-contain"
                                />

                                <span className="mt-1.5 text-xs font-semibold text-gray-900">
                                    {vehicle.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {selectedVehicle && (
                <div className="rounded-xl border border-gray-200 bg-white p-3">
                    <p className="text-xs font-medium text-gray-500">
                        Vehículo seleccionado
                    </p>

                    <div className="mt-1.5 flex items-center gap-3">
                        <img
                            src={selectedVehicle.icon}
                            alt=""
                            aria-hidden="true"
                            className="h-10 w-14 object-contain"
                        />

                        <p className="text-lg font-semibold text-gray-900">
                            {selectedVehicle.label}
                        </p>
                    </div>
                </div>
            )}
        </section>
    );
}
