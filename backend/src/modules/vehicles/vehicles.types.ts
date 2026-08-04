export type VehicleType =
    | "camioneta"
    | "motocicleta"
    | "motocarguero"
    | "carro";

export type DatabaseVehicleType =
    | "Camioneta"
    | "Motocicleta"
    | "Motocarguero"
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
