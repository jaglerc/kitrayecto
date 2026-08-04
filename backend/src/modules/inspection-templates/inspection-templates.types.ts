export type InspectionVehicleType =
    | "camioneta"
    | "motocicleta"
    | "motocarguero"
    | "carro";

export type DatabaseInspectionVehicleType =
    | "Camioneta"
    | "Motocicleta"
    | "Motocarguero"
    | "Carro";

export interface InspectionTemplateRecord {
    id: number;
    tipo_vehiculo: DatabaseInspectionVehicleType;
    titulo: string;
    descripcion: string;
}

export interface InspectionTemplateResponse {
    id: number;
    vehicleType: InspectionVehicleType;
    title: string;
    description: string;
}
