import { useState } from "react";
import { useNavigate } from "react-router";

import Footer from "../components/ui/Footer";
import InspectionChecklistStep from "../components/ui/InspectionChecklistStep";
import JourneyHeader from "../components/ui/JourneyHeader";
import PlateSelectionStep from "../components/ui/PlateSelectionStep";
import Stepper from "../components/ui/Stepper";
import VehicleTypeStep from "../components/ui/VehicleTypeStep";
import type { VehicleType } from "../components/ui/VehicleTypeStep";
import { inspectionService } from "../services/inspection.service";
import type {
    InspectionAnswer,
    InspectionTemplate,
} from "../services/inspection.service";
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

    const [templates, setTemplates] =
        useState<InspectionTemplate[]>([]);

    const [answers, setAnswers] =
        useState<Record<number, InspectionAnswer>>({});

    const [isLoadingVehicles, setIsLoadingVehicles] =
        useState(false);

    const [vehiclesError, setVehiclesError] =
        useState<string | null>(null);

    const [isLoadingTemplates, setIsLoadingTemplates] =
        useState(false);

    const [templatesError, setTemplatesError] =
        useState<string | null>(null);

    const selectedVehicle = vehicles.find(
        (vehicle) => vehicle.id === selectedVehicleId
    );

    const handleBack = () => {
        if (currentStep === 3) {
            setCurrentStep(2);
            setTemplatesError(null);
            return;
        }

        if (currentStep === 2) {
            setCurrentStep(1);
            setVehiclesError(null);
            return;
        }

        navigate("/home");
    };

    const handleSelectType = (type: VehicleType) => {
        if (type !== selectedType) {
            setVehicles([]);
            setSelectedVehicleId(null);
            setTemplates([]);
            setAnswers({});
        }

        setSelectedType(type);
        setVehiclesError(null);
        setTemplatesError(null);
    };

    const handleSelectVehicle = (vehicleId: number) => {
        if (vehicleId !== selectedVehicleId) {
            setTemplates([]);
            setAnswers({});
        }

        setSelectedVehicleId(vehicleId);
        setTemplatesError(null);
    };

    const loadVehicles = async (type: VehicleType) => {
        setCurrentStep(2);
        setIsLoadingVehicles(true);
        setVehiclesError(null);

        try {
            const response = await vehicleService.findByType(type);
            setVehicles(response);
        } catch (requestError: unknown) {
            setVehicles([]);

            setVehiclesError(
                requestError instanceof Error
                    ? requestError.message
                    : "No fue posible consultar los vehículos"
            );
        } finally {
            setIsLoadingVehicles(false);
        }
    };

    const loadTemplates = async (type: VehicleType) => {
        setCurrentStep(3);
        setIsLoadingTemplates(true);
        setTemplatesError(null);

        try {
            const response =
                await inspectionService.findTemplatesByVehicleType(type);

            setTemplates(response);
        } catch (requestError: unknown) {
            setTemplates([]);

            setTemplatesError(
                requestError instanceof Error
                    ? requestError.message
                    : "No fue posible consultar el checklist"
            );
        } finally {
            setIsLoadingTemplates(false);
        }
    };

    const handleContinue = () => {
        if (currentStep === 1 && selectedType) {
            void loadVehicles(selectedType);
            return;
        }

        if (
            currentStep === 2 &&
            selectedType &&
            selectedVehicleId
        ) {
            void loadTemplates(selectedType);
        }
    };

    const handleAnswerChange = (
        templateId: number,
        answer: InspectionAnswer
    ) => {
        setAnswers((currentAnswers) => ({
            ...currentAnswers,
            [templateId]: answer,
        }));
    };

    const canContinue =
        currentStep === 1
            ? selectedType !== null
            : currentStep === 2
                ? selectedVehicleId !== null
                : false;

    const isLoading =
        isLoadingVehicles || isLoadingTemplates;

    return (
        <div className="relative mx-auto min-h-dvh w-full max-w-md bg-white">
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
                        isLoading={isLoadingVehicles}
                        error={vehiclesError}
                        onSelect={handleSelectVehicle}
                    />
                )}

                {currentStep === 3 && selectedVehicle && (
                    <InspectionChecklistStep
                        mode="check-in"
                        vehicle={selectedVehicle}
                        templates={templates}
                        answers={answers}
                        isLoading={isLoadingTemplates}
                        error={templatesError}
                        onAnswerChange={handleAnswerChange}
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
