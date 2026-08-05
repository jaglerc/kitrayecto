import { Link } from "react-router";
interface WelcomeBannerProps {
    nombre: string;
    hasTodayInspection?: boolean;
}

export default function WelcomeBanner({
    nombre,
    hasTodayInspection = false,
}: WelcomeBannerProps) {
    return (
        <section className="relative min-h-44 overflow-hidden rounded-xl border border-gray-200 bg-white py-4 shadow-sm px-6">
            
            <div className="relative z-10 w-[48%]">
                <h1 className="text-lg font-semibold text-gray-900">
                    Bienvenido, {nombre}
                </h1>

                <p className="mt-2 max-w-[180px] text-xs leading-relaxed text-gray-500">
                    Aquí puedes gestionar tu jornada, registrar tus viajes
                    y el estado de tu vehículo.
                </p>

                <Link to={hasTodayInspection ? "/home" : "/StartJourneyPage"} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2 text-xs font-semibold text-gray-900 transition hover:bg-amber-500">
                    {hasTodayInspection ? "Jornada iniciada" : "Iniciar mi jornada"}
                    <span aria-hidden="true">→</span>
                </Link>
            </div>

            <img
                src="/vehiculos-aviario-logo.png"
                alt="Vehículos El Aviario"
                className="pointer-events-none absolute bottom-1 right-[-3%] w-[55%] object-contain"
            />
        </section>
    );
}
