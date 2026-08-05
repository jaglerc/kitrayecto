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

interface UsuarioGuardado {
    id: number;
    nombre: string;
    role: string;
}
export default function Home() {
    const [todayInspection, setTodayInspection] = useState<TodayInspection | null>(null);
    const [isLoadingSummary, setIsLoadingSummary] = useState(true);
    const [tripStatus, setTripStatus] = useState<TripStatus | null>(null);
    const [showFinishTrip, setShowFinishTrip] = useState(false);
    const [isFinishingTrip, setIsFinishingTrip] = useState(false);
    const [tripActionError, setTripActionError] = useState<string | null>(null);
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

    const finishTrip = async () => {
        if (!tripStatus?.activeTrip || isFinishingTrip) return;
        setIsFinishingTrip(true);
        setTripActionError(null);
        try {
            await tripService.finish(tripStatus.activeTrip.id);
            setTripStatus(await tripService.findStatus());
            setShowFinishTrip(false);
        } catch (requestError) {
            setTripActionError(requestError instanceof Error ? requestError.message : "No fue posible terminar el viaje");
        } finally {
            setIsFinishingTrip(false);
        }
    };

    if (!usuario) return null;

    return (
        <div className="min-h-dvh bg-white">
            <Header nombre={usuario.nombre} role={usuario.role} />
            <main className="px-2 pb-24 pt-24">
                <div>
                    <WelcomeBanner
                        nombre={usuario.nombre}
                        hasTodayInspection={todayInspection !== null}
                        canCheckout={tripStatus?.canCheckout ?? false}
                        journeyFinished={Boolean(todayInspection && tripStatus && !tripStatus.hasCheckIn && tripStatus.completedToday > 0)}
                    />

                    <section className="flex ">
                        <QuickActions tripStatus={tripStatus} onFinishTrip={() => setShowFinishTrip(true)} />

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
