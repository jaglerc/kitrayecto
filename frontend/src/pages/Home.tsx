import { useEffect, useState } from "react";

import Footer from "../components/ui/Footer";
import Header from "../components/ui/Header";
import WelcomeBanner from "../components/ui/WelcomeBanner"
import QuickActions from "../components/ui/QuickActions"
import TodaySummary from "../components/ui/TodaySummary";
import { inspectionService } from "../services/inspection.service";
import type { TodayInspection } from "../services/inspection.service";
import FinishTripDialog from "../components/ui/FinishTripDialog";
import { tripService } from "../services/trip.service";
import type { TripStatus } from "../services/trip.service";
import { useNavigate } from "react-router";
import { offlineSyncService } from "../services/offline-sync.service";
import {
    OFFLINE_QUEUE_CHANGED_EVENT,
    getOfflineUserId,
    offlineDatabaseService,
} from "../services/offline-database.service";
import { offlinePreparationService } from "../services/offline-preparation.service";

interface UsuarioGuardado {
    id: number;
    nombre: string;
    role: string;
}
export default function Home() {
    const navigate = useNavigate();
    const [todayInspection, setTodayInspection] = useState<TodayInspection | null>(null);
    const [isLoadingSummary, setIsLoadingSummary] = useState(true);
    const [tripStatus, setTripStatus] = useState<TripStatus | null>(null);
    const [showFinishTrip, setShowFinishTrip] = useState(false);
    const [isFinishingTrip, setIsFinishingTrip] = useState(false);
    const [tripActionError, setTripActionError] = useState<string | null>(null);
    const [pendingCount, setPendingCount] = useState(0);
    const [syncError, setSyncError] = useState<string | null>(null);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isPreparingOffline, setIsPreparingOffline] = useState(false);
    const [preparationMessage, setPreparationMessage] = useState<string | null>(null);
    const usuarioGuardado = localStorage.getItem("user");

    const usuario: UsuarioGuardado | null = usuarioGuardado ?JSON.parse(usuarioGuardado) : null;

    useEffect(() => {
        let isMounted = true;

        void inspectionService.findToday()
            .then((inspection) => {
                if (isMounted) setTodayInspection(inspection);
            })
            .catch(() => {
                if (isMounted) setTodayInspection(null);
            })
            .finally(() => {
                if (isMounted) setIsLoadingSummary(false);
            });

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        void tripService.findStatus().then(setTripStatus).catch(() => setTripStatus(null));
    }, []);

    useEffect(() => {
        const refreshQueue = () => {
            const userId = getOfflineUserId();
            if (userId) {
                void Promise.all([
                    offlineDatabaseService.countPending(userId),
                    offlineDatabaseService.listOperations(userId),
                ]).then(([count, operations]) => {
                    setPendingCount(count);
                    setSyncError(operations.find((operation) => operation.status === "failed")?.lastError ?? null);
                });
            }
            setIsOnline(navigator.onLine);
        };
        const refreshConnection = () => {
            refreshQueue();
            void tripService.findStatus().then(setTripStatus).catch(() => undefined);
        };
        window.addEventListener(OFFLINE_QUEUE_CHANGED_EVENT, refreshQueue);
        window.addEventListener("online", refreshConnection);
        window.addEventListener("offline", refreshQueue);
        refreshQueue();
        return () => {
            window.removeEventListener(OFFLINE_QUEUE_CHANGED_EVENT, refreshQueue);
            window.removeEventListener("online", refreshConnection);
            window.removeEventListener("offline", refreshQueue);
        };
    }, []);

    const finishTrip = async () => {
        if (!tripStatus?.activeTrip || isFinishingTrip) return;
        setIsFinishingTrip(true);
        setTripActionError(null);
        try {
            await offlineSyncService.enqueueAndSync("finish-trip", {
                tripId: tripStatus.activeTrip.id > 0 ? tripStatus.activeTrip.id : null,
                tripOperationId: tripStatus.activeTrip.clientOperationId ?? null,
            });
            setTripStatus(await tripService.findStatus());
            setShowFinishTrip(false);
        } catch (requestError) {
            setTripActionError(requestError instanceof Error ? requestError.message : "No fue posible terminar el viaje");
        } finally {
            setIsFinishingTrip(false);
        }
    };

    const reportAccident = async () => {
        setTripActionError(null);
        try {
            if (!tripStatus?.vehicle) throw new Error("No hay un vehículo de jornada guardado en este dispositivo");
            const operation = await offlineSyncService.enqueueAndSync("accident-report", {
                    vehicle: tripStatus.vehicle,
                    driverName: usuario?.nombre ?? "Conductor",
                    reportedAt: new Date().toISOString(),
                });
            const accident = operation.result as { id?: number } | null;
            navigate(`/accidents/reported/${accident?.id ?? operation.id}`);
        } catch (requestError) {
            setTripActionError(requestError instanceof Error ? requestError.message : "No fue posible reportar el accidente");
        }
    };

    const prepareOfflineUse = async () => {
        if (isPreparingOffline) return;
        setIsPreparingOffline(true);
        setPreparationMessage(null);
        try {
            await offlinePreparationService.prepare();
            setPreparationMessage("Listo. Vehículos, checklists, ubicaciones y jornada guardados para uso sin conexión.");
        } catch (error) {
            setPreparationMessage(error instanceof Error ? error.message : "No fue posible preparar los datos");
        } finally {
            setIsPreparingOffline(false);
        }
    };

    if (!usuario) return null;

    return (
        <div className="min-h-dvh bg-white">
            <Header nombre={usuario.nombre} role={usuario.role} />
            <main className="px-2 pb-24 pt-24">
                {(!isOnline || pendingCount > 0 || syncError) && (
                    <section className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900" aria-live="polite">
                        <span>{!isOnline ? "Sin conexión. " : ""}{pendingCount > 0 ? `${pendingCount} registro(s) pendiente(s) de sincronizar.` : "Los registros se guardarán en este dispositivo."}{syncError ? ` Error: ${syncError}` : ""}</span>
                        {isOnline && pendingCount > 0 && (
                            <button type="button" onClick={() => void offlineSyncService.retryFailed()} className="font-semibold underline">Reintentar sincronización</button>
                        )}
                    </section>
                )}
                {isOnline && (
                    <section className="mb-3 rounded-xl border border-gray-200 bg-white p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs text-gray-600">Antes de salir, guarda los datos que necesitarás si pierdes conexión.</p>
                            <button type="button" onClick={() => void prepareOfflineUse()} disabled={isPreparingOffline} className="min-h-10 rounded-lg bg-gray-900 px-3 text-xs font-semibold text-white disabled:opacity-60">
                                {isPreparingOffline ? "Preparando…" : "Preparar uso sin conexión"}
                            </button>
                        </div>
                        {preparationMessage && <p role="status" className="mt-2 text-xs text-gray-600">{preparationMessage}</p>}
                    </section>
                )}
                <div>
                    <WelcomeBanner
                        nombre={usuario.nombre}
                        hasTodayInspection={todayInspection !== null}
                        canCheckout={tripStatus?.canCheckout ?? false}
                        journeyFinished={Boolean(todayInspection && tripStatus && !tripStatus.hasCheckIn && tripStatus.completedToday > 0)}
                    />

                    <section className="flex ">
                        <QuickActions tripStatus={tripStatus} onFinishTrip={() => setShowFinishTrip(true)} onReportAccident={() => void reportAccident()} />

                    </section>

                    {tripActionError && <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">{tripActionError}</p>}

                    {isLoadingSummary && (
                        <p className="mt-5 rounded-xl border border-gray-200 bg-white p-4 text-center text-xs text-gray-500">
                            Consultando resumen de hoy...
                        </p>
                    )}

                    {todayInspection && (
                        <TodaySummary inspection={todayInspection} />
                    )}

                </div>

            </main>
            <Footer/>
            <FinishTripDialog isOpen={showFinishTrip} isFinishing={isFinishingTrip} tripNumber={tripStatus?.activeTrip?.numberOfDay ?? 0} onCancel={() => setShowFinishTrip(false)} onConfirm={() => void finishTrip()} />
        </div>
    )
}
