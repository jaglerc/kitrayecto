import arrowBackIcon from "../../icons/arrow-back.svg";
import helpIcon from "../../icons/help-circle.svg";

interface JourneyHeaderProps {
    title?: string;
    onBack: () => void;
    onHelp?: () => void;
}

export default function JourneyHeader({
    title = "Iniciar mi jornada",
    onBack,
    onHelp,
}: JourneyHeaderProps) {
    return (
        <header className="relative flex h-16 w-full items-center justify-between bg-white px-4">
            <button type="button" onClick={onBack} aria-label="Regresar" className="flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400">
                <img src={arrowBackIcon} alt="Regresar" className="h-6 w-6 object-contain" />
            </button>

            <h1 className="pointer-events-none absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-base font-semibold text-gray-900">
                {title}
            </h1>

            <button type="button" onClick={onHelp} aria-label="Ayuda" className="flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400">     
                <img src={helpIcon} alt="" aria-hidden="true" className="h-6 w-6 object-contain" />
            </button>
        </header>
    );
}