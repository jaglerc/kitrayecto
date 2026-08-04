import vehicleIcon from "../../icons/1.png";
import plateIcon from "../../icons/2.png";
import checklistIcon from "../../icons/3.png";

type JourneyStep = 1 | 2 | 3;

interface StepperProps {
    currentStep: JourneyStep;
}

const steps = [
    {
        number: 1,
        label: "Vehículo",
        icon: vehicleIcon,
    },
    {
        number: 2,
        label: "Placa",
        icon: plateIcon,
    },
    {
        number: 3,
        label: "Checklist",
        icon: checklistIcon,
    },
] as const;

export default function Stepper({ currentStep }: StepperProps) {
    return (
        <nav
            aria-label="Progreso de inicio de jornada"
            className="w-full py-3"
        >
            <ol className="mx-auto flex w-full max-w-[300px] items-start">
                {steps.map((step, index) => {
                    const isActive = step.number === currentStep;
                    const isCompleted = step.number < currentStep;
                    const isLast = index === steps.length - 1;

                    return (
                        <li
                            key={step.number}
                            className={[
                                "relative flex items-start",
                                isLast ? "shrink-0" : "flex-1",
                            ].join(" ")}
                            aria-current={isActive ? "step" : undefined}
                        >
                            <div className="relative z-10 flex flex-col items-center">
                                <span
                                    className={[
                                        "flex h-7 w-7 items-center justify-center",
                                        "rounded-full transition-colors duration-200",
                                        isActive || isCompleted
                                            ? "bg-amber-400"
                                            : "bg-gray-200 opacity-60",
                                    ].join(" ")}
                                >
                                    <img
                                        src={step.icon}
                                        alt=""
                                        aria-hidden="true"
                                        className="h-4 w-4 object-contain"
                                    />
                                </span>

                                <span
                                    className={[
                                        "mt-1.5 whitespace-nowrap text-[10px]",
                                        isActive
                                            ? "font-semibold text-gray-900"
                                            : "font-medium text-gray-500",
                                    ].join(" ")}
                                >
                                    {step.label}
                                </span>
                            </div>

                            {!isLast && (
                                <span
                                    aria-hidden="true"
                                    className={[
                                        "mt-3.5 h-px flex-1",
                                        "transition-colors duration-200",
                                        isCompleted
                                            ? "bg-amber-400"
                                            : "bg-gray-200",
                                    ].join(" ")}
                                />
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
