import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import Footer from "../components/ui/Footer";
import InspectionChecklistStep from "../components/ui/InspectionChecklistStep";
import JourneyHeader from "../components/ui/JourneyHeader";
import type { InspectionAnswer, InspectionTemplate, TodayInspection } from "../services/inspection.service";
import { inspectionService } from "../services/inspection.service";
import { storageService } from "../services/storage.service";
import { tripService } from "../services/trip.service";

export default function CheckoutJourneyPage() {
    const navigate = useNavigate();
    const [checkIn, setCheckIn] = useState<TodayInspection | null>(null);
    const [templates, setTemplates] = useState<InspectionTemplate[]>([]);
    const [answers, setAnswers] = useState<Record<number, InspectionAnswer>>({});
    const [mileage, setMileage] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        void Promise.all([inspectionService.findToday(), tripService.findStatus()])
            .then(async ([inspection, tripStatus]) => {
                if (!inspection || !tripStatus.canCheckout) {
                    throw new Error(tripStatus.activeTrip ? "Primero debes terminar el viaje actual" : "Debes completar al menos un viaje antes de finalizar la jornada");
                }
                setCheckIn(inspection);
                setTemplates(await inspectionService.findTemplatesByVehicleType(inspection.vehicle.type));
            })
            .catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : "No fue posible iniciar el check-out"))
            .finally(() => setIsLoading(false));
    }, []);

    const isComplete = Boolean(
        checkIn && mileage !== "" && Number.isInteger(Number(mileage)) && Number(mileage) >= (checkIn.mileage ?? 0) &&
        templates.length > 0 && templates.every((template) => {
            const answer = answers[template.id];
            return answer && (answer.status === "Sin novedad" || answer.observation.trim()) && (!answer.status.toLowerCase().includes("cr") || answer.evidenceFiles.length > 0);
        })
    );

    const save = async () => {
        if (!checkIn || !isComplete || isSaving) return;
        setIsSaving(true); setError(null);
        try {
            const uploadedAnswers = await Promise.all(templates.map(async (template) => {
                const answer = answers[template.id];
                const evidences = await Promise.all(answer.evidenceFiles.map((evidence) => storageService.uploadImage(evidence.file, "inspecciones", checkIn.vehicle.id)));
                return { templateId: template.id, status: answer.status, observation: answer.observation, evidences };
            }));
            await inspectionService.create({ vehicleId: checkIn.vehicle.id, operation: "Check_out", mileage: Number(mileage), answers: uploadedAnswers });
            navigate("/home");
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : "No fue posible finalizar la jornada");
        } finally { setIsSaving(false); }
    };

    return (
        <div className="mx-auto min-h-dvh w-full max-w-md bg-white">
            <JourneyHeader title="Finalizar mi jornada" onBack={() => navigate("/home")} />
            <main className="px-4 pb-28">
                {error && <p role="alert" className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</p>}
                {isLoading && <p className="py-10 text-center text-sm text-gray-500">Preparando checklist de salida...</p>}
                {checkIn && !isLoading && (
                    <>
                        <InspectionChecklistStep mode="check-out" vehicle={checkIn.vehicle} templates={templates} answers={answers} isLoading={false} error={null} mileage={mileage} onMileageChange={setMileage} onAnswerChange={(templateId, answer) => { setAnswers((current) => ({ ...current, [templateId]: answer })); setError(null); }} />
                        <button type="button" onClick={() => void save()} disabled={!isComplete || isSaving} className="mt-3 w-full rounded-lg bg-amber-400 py-3 text-sm font-semibold text-gray-900 disabled:opacity-50">{isSaving ? "Finalizando..." : "Finalizar jornada →"}</button>
                        {!isComplete && <p className="mt-2 text-center text-xs text-gray-500">Registra un kilometraje final válido y completa todos los elementos.</p>}
                    </>
                )}
            </main>
            <Footer />
        </div>
    );
}
