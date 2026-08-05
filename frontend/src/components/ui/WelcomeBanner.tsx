import { Link } from "react-router";
interface WelcomeBannerProps {
    nombre: string;
    hasTodayInspection?: boolean;
    canCheckout?: boolean;
    journeyFinished?: boolean;
}

export default function WelcomeBanner({
    nombre,
    hasTodayInspection = false,
    canCheckout = false,
    journeyFinished = false,
}: WelcomeBannerProps) {
    const destination = !hasTodayInspection ? "/StartJourneyPage" : canCheckout ? "/journey/checkout" : "/home";
    const buttonLabel = !hasTodayInspection ? "Iniciar mi jornada" : journeyFinished ? "Jornada finalizada" : canCheckout ? "Finalizar mi jornada" : "Jornada iniciada";
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

                <Link to={destination} aria-disabled={journeyFinished} onClick={(event) => { if (journeyFinished) event.preventDefault(); }} className={`mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold text-gray-900 transition ${journeyFinished ? "cursor-default bg-gray-200 text-gray-500" : "bg-amber-400 hover:bg-amber-500"}`}>
                    {buttonLabel}
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
