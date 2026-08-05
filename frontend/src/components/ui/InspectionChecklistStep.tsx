import type { Vehicle } from "../../services/vehicle.service";
import type {
    InspectionAnswer,
    InspectionTemplate,
} from "../../services/inspection.service";

import InspectionItem from "./InspectionItem";
import VehicleSummaryCard from "./VehicleSummaryCard";

interface InspectionChecklistStepProps {
    mode: "check-in" | "check-out";
    vehicle: Vehicle;
    templates: InspectionTemplate[];
    answers: Record<number, InspectionAnswer>;
    isLoading: boolean;
    error: string | null;
    mileage: string;
    onMileageChange: (mileage: string) => void;
    onAnswerChange: (
        templateId: number,
        answer: InspectionAnswer
    ) => void;
}

export default function InspectionChecklistStep({
    mode,
    vehicle,
    templates,
    answers,
    isLoading,
    error,
    mileage,
    onMileageChange,
    onAnswerChange,
}: InspectionChecklistStepProps) {
    return (
        <section className="mt-4 space-y-3">
            <VehicleSummaryCard
                type={vehicle.type}
                plate={vehicle.plate}
            />

            <div className="rounded-xl border border-gray-200 bg-white p-3">
                <label
                    htmlFor="inspection-mileage"
                    className="text-xs font-semibold text-gray-900"
                >
                    {mode === "check-in"
                        ? "Kilometraje inicial"
                        : "Kilometraje final"}
                </label>
                <div className="mt-2 flex items-center rounded-lg border border-gray-200 px-3 focus-within:border-amber-400">
                    <input
                        id="inspection-mileage"
                        type="number"
                        min="0"
                        step="1"
                        inputMode="numeric"
                        value={mileage}
                        onChange={(event) => onMileageChange(event.target.value)}
                        placeholder="Ej. 72450"
                        className="min-w-0 flex-1 py-2 text-sm outline-none"
                    />
                    <span className="text-xs font-medium text-gray-500">km</span>
                </div>
            </div>

            <div className="rounded-xl border border-amber-100 bg-amber-50 p-3">
                <h2 className="text-xs font-semibold text-gray-900">
                    Antes de comenzar
                </h2>

                <ul className="mt-1 list-inside list-disc space-y-1 text-[10px] leading-4 text-gray-600 marker:text-amber-400">
                    <li>Revisa cada elemento del vehículo antes de salir.</li>
                    <li>Marca el estado de cada ítem.</li>
                    <li>Describe cualquier novedad encontrada.</li>
                </ul>
            </div>

            <div className="grid grid-cols-3 rounded-lg border border-gray-200 bg-white px-2 py-2 text-center text-[9px]">
                <span className="text-green-600">○ Sin novedad</span>
                <span className="text-amber-500">○ Con novedad</span>
                <span className="text-red-500">○ Crítica</span>
            </div>

            <h2 className="text-sm font-semibold text-gray-900">
                3. Realiza el checklist de {mode === "check-in" ? "entrada" : "salida"}
            </h2>

            {isLoading && (
                <p className="rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-500">
                    Consultando checklist...
                </p>
            )}

            {error && (
                <p
                    role="alert"
                    className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600"
                >
                    {error}
                </p>
            )}

            {!isLoading && !error && templates.length === 0 && (
                <p className="rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-500">
                    No hay ítems configurados para este tipo de vehículo.
                </p>
            )}

            {!isLoading && !error && templates.length > 0 && (
                <div className="space-y-2">
                    {templates.map((template) => (
                        <InspectionItem
                            key={template.id}
                            template={template}
                            answer={answers[template.id]}
                            onChange={(answer) => {
                                onAnswerChange(template.id, answer);
                            }}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}
