import type { VehicleType } from "../components/ui/VehicleTypeStep";
import { inspectionService } from "./inspection.service";
import { tripService } from "./trip.service";
import { vehicleService } from "./vehicle.service";

const vehicleTypes: VehicleType[] = [
    "camioneta",
    "motocicleta",
    "motocarguero",
    "carro",
];

export const offlinePreparationService = {
    async prepare(): Promise<void> {
        if (!navigator.onLine) {
            throw new Error("Conéctate a internet para preparar el uso sin conexión");
        }

        await Promise.all([
            tripService.findLocations(),
            tripService.findStatus(),
            inspectionService.findToday(),
            ...vehicleTypes.flatMap((type) => [
                vehicleService.findByType(type),
                inspectionService.findTemplatesByVehicleType(type),
            ]),
        ]);
    },
};
