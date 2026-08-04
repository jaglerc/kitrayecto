import { InspectionTemplatesRepository } from "./inspection-templates.repository.js";

import type {
    DatabaseInspectionVehicleType,
    InspectionTemplateResponse,
    InspectionVehicleType,
} from "./inspection-templates.types.js";

const vehicleTypeMap: Record<
    InspectionVehicleType,
    DatabaseInspectionVehicleType
> = {
    camioneta: "Camioneta",
    motocicleta: "Motocicleta",
    motocarguero: "Motocarguero",
    carro: "Carro",
};

export class InspectionTemplatesService {
    static isVehicleType(
        value: unknown
    ): value is InspectionVehicleType {
        return typeof value === "string" && value in vehicleTypeMap;
    }

    static async findByVehicleType(
        vehicleType: InspectionVehicleType
    ): Promise<InspectionTemplateResponse[]> {
        const templates =
            await InspectionTemplatesRepository.findByVehicleType(
                vehicleTypeMap[vehicleType]
            );

        return templates.map((template) => ({
            id: template.id,
            vehicleType,
            title: template.titulo,
            description: template.descripcion,
        }));
    }
}
