import camionetaIcon from "../../icons/camioneta.png";
import carroIcon from "../../icons/carro.png";
import motocargueroIcon from "../../icons/motocarguero.png";
import motocicletaIcon from "../../icons/motocicleta.png";

import type { VehicleType } from "./VehicleTypeStep";

interface VehicleSummaryCardProps {
    type: VehicleType;
    plate?: string;
}

const vehicleInformation = {
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
} satisfies Record<VehicleType, { label: string; icon: string }>;

export default function VehicleSummaryCard({
    type,
    plate,
}: VehicleSummaryCardProps) {
    const vehicle = vehicleInformation[type];

    return (
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
            <img
                src={vehicle.icon}
                alt=""
                aria-hidden="true"
                className="h-12 w-16 object-contain"
            />

            <div>
                <p className="text-xs font-medium text-gray-500">
                    {vehicle.label}
                </p>

                {plate && (
                    <p className="text-xl font-bold text-gray-900">
                        {plate}
                    </p>
                )}
            </div>
        </div>
    );
}
