import { useEffect, useState } from "react";

import Footer from "../components/ui/Footer";
import Header from "../components/ui/Header";
import WelcomeBanner from "../components/ui/WelcomeBanner"
import QuickActions from "../components/ui/QuickActions"
import TodaySummary from "../components/ui/TodaySummary";
import { inspectionService } from "../services/inspection.service";
import type { TodayInspection } from "../services/inspection.service";

interface UsuarioGuardado {
    id: number;
    nombre: string;
    role: string;
}
export default function Home() {
    const [todayInspection, setTodayInspection] = useState<TodayInspection | null>(null);
    const [isLoadingSummary, setIsLoadingSummary] = useState(true);
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

    if (!usuario) return null;

    return (
        <div className="min-h-dvh bg-white">
            <Header nombre={usuario.nombre} role={usuario.role} />
            <main className="px-2 pb-24 pt-24">
                <div>
                    <WelcomeBanner
                        nombre={usuario.nombre}
                        hasTodayInspection={todayInspection !== null}
                    />

                    <section className="flex ">
                        <QuickActions/>

                    </section>

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
        </div>
    )
}
