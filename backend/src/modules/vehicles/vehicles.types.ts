export type VehicleType =
    | "camioneta"
    | "motocicleta"
    | "motocarguero"
    | "camión"
    | "carro";

export type DatabaseVehicleType =
    | "Camioneta"
    | "Motocicleta"
    | "Motocarguero"
    | "Camión"
    | "Carro";

export interface VehicleRecord {
    id: number;
    placa: string;
}

export interface VehicleResponse {
    id: number;
    plate: string;
    type: VehicleType;
}
