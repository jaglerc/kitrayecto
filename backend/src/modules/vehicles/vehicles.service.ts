import { VehiclesRepository } from "./vehicles.repository.js";

import type {
    DatabaseVehicleType,
    VehicleResponse,
    VehicleType,
} from "./vehicles.types.js";

const vehicleTypeMap: Record<VehicleType, DatabaseVehicleType> = {
    camioneta: "Camioneta",
    motocicleta: "Motocicleta",
    motocarguero: "Motocarguero",
    carro: "Carro",
};

export class VehiclesService {
    static isVehicleType(value: unknown): value is VehicleType {
        return typeof value === "string" && value in vehicleTypeMap;
    }

    static async findByType(
        type: VehicleType
    ): Promise<VehicleResponse[]> {
        const records = await VehiclesRepository.findByType(
            vehicleTypeMap[type]
        );

        return records.map((vehicle) => ({
            id: vehicle.id,
            plate: vehicle.placa,
            type,
        }));
    }
}
