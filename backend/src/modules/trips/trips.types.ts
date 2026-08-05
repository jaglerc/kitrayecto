export interface TripProductInput {
    productName: string;
    unit: string;
    quantity: number;
}

export interface CreateTripInput {
    observations?: string;
    products: TripProductInput[];
}

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
}
