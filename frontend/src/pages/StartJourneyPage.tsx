import { useState } from "react";
import { useNavigate } from "react-router";

import Footer from "../components/ui/Footer";
import JourneyHeader from "../components/ui/JourneyHeader";
import PlateSelectionStep from "../components/ui/PlateSelectionStep";
import Stepper from "../components/ui/Stepper";
import VehicleTypeStep from "../components/ui/VehicleTypeStep";
import type { VehicleType } from "../components/ui/VehicleTypeStep";
import { vehicleService } from "../services/vehicle.service";
import type { Vehicle } from "../services/vehicle.service";

type JourneyStep = 1 | 2 | 3;

export default function StartJourneyPage() {
    const navigate = useNavigate();

    const [currentStep, setCurrentStep] =
        useState<JourneyStep>(1);

    const [selectedType, setSelectedType] =
        useState<VehicleType | null>(null);

    const [vehicles, setVehicles] =
        useState<Vehicle[]>([]);

    const [selectedVehicleId, setSelectedVehicleId] =
        useState<number | null>(null);

    const [isLoading, setIsLoading] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(1);
            setError(null);
            return;
        }

        navigate("/home");
    };

    const handleSelectType = (type: VehicleType) => {
        if (type !== selectedType) {
            setVehicles([]);
            setSelectedVehicleId(null);
        }

        setSelectedType(type);
        setError(null);
    };

    const handleContinue = async () => {
        if (currentStep === 1) {
            if (!selectedType) return;

            setCurrentStep(2);
            setIsLoading(true);
            setError(null);

            try {
                const response = await vehicleService.findByType(
                    selectedType
                );

                setVehicles(response);
            } catch (requestError: unknown) {
                setVehicles([]);

                setError(
                    requestError instanceof Error
                        ? requestError.message
                        : "No fue posible consultar los vehículos"
                );
            } finally {
                setIsLoading(false);
            }

            return;
        }

        if (currentStep === 2 && selectedVehicleId) {
            setCurrentStep(3);
        }
    };

    const canContinue =
        currentStep === 1
            ? selectedType !== null
            : currentStep === 2
                ? selectedVehicleId !== null
                : false;

    return (
        <div>
            <JourneyHeader
                title="Iniciar mi jornada"
                onBack={handleBack}
            />

            <main className="px-4 pb-28">
                <Stepper currentStep={currentStep} />

                {currentStep === 1 && (
                    <VehicleTypeStep
                        selectedType={selectedType}
                        onSelect={handleSelectType}
                    />
                )}

                {currentStep === 2 && selectedType && (
                    <PlateSelectionStep
                        selectedType={selectedType}
                        vehicles={vehicles}
                        selectedVehicleId={selectedVehicleId}
                        isLoading={isLoading}
                        error={error}
                        onSelect={setSelectedVehicleId}
                    />
                )}

                {canContinue && (
                    <button
                        type="button"
                        onClick={handleContinue}
                        disabled={isLoading}
                        className="mt-3 flex w-full items-center justify-center gap-3 rounded-lg bg-amber-400 px-4 py-3 text-sm font-semibold text-gray-900 transition-colors hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Continuar
                        <span aria-hidden="true">→</span>
                    </button>
                )}
            </main>

            <Footer />
        </div>
    );
}
