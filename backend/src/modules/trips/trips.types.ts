export interface TripProductInput {
    productName: string;
    unit: string;
    quantity: number;
}

export interface CreateTripInput {
    originId: number;
    observations?: string;
    products: TripProductInput[];
    stops: Array<{ locationId: number; movements: Array<TripCargoMovementInput> }>;
}

export interface TripCargoMovementInput extends TripProductInput { type: "Recogida" | "Entrega"; }

export interface TripLocation { id: number; name: string; }

export interface TripVehicle {
    id: number;
    type: string;
    plate: string;
}

export interface ActiveTrip {
    id: number;
    numberOfDay: number;
    startedAt: string;
    vehicle: TripVehicle;
}

export interface TripStatus {
    hasCheckIn: boolean;
    checkInAuthorized: boolean;
    vehicle: TripVehicle | null;
    activeTrip: ActiveTrip | null;
    completedToday: number;
    nextTripNumber: number;
    canStart: boolean;
    canCheckout: boolean;
    suggestedOriginId: number | null;
}
