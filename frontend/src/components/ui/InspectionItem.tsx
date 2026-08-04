import batteryIcon from "../../icons/inspection-battery.svg";
import bodyworkIcon from "../../icons/inspection-bodywork.svg";
import brakesIcon from "../../icons/inspection-brakes.svg";
import cabinIcon from "../../icons/inspection-cabin.svg";
import cargoIcon from "../../icons/inspection-cargo.svg";
import cleaningIcon from "../../icons/inspection-cleaning.svg";
import documentsIcon from "../../icons/inspection-documents.svg";
import engineIcon from "../../icons/inspection-engine.svg";
import fluidsIcon from "../../icons/inspection-fluids.svg";
import observationsIcon from "../../icons/inspection-observations.svg";
import safetyIcon from "../../icons/inspection-safety.svg";
import tiresIcon from "../../icons/inspection-tires.svg";
import windowsIcon from "../../icons/inspection-windows.svg";
import checklistItemIcon from "../../icons/to-do-list.png";

import type {
    InspectionAnswer,
    InspectionStatus,
    InspectionTemplate,
} from "../../services/inspection.service";

interface InspectionItemProps {
    template: InspectionTemplate;
    answer?: InspectionAnswer;
    onChange: (answer: InspectionAnswer) => void;
}

const normalizeTitle = (title: string) => {
    return title
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
};

const inspectionIconsByTitle: Record<string, string> = {
    "documentos y pico y placa": documentsIcon,
    "carroceria": bodyworkIcon,
    "vidrios, luces y espejos": windowsIcon,
    "llantas": tiresIcon,
    "liquidos": fluidsIcon,
    "cabina": cabinIcon,
    "seguridad": safetyIcon,
    "carga": cargoIcon,
    "limpieza": cleaningIcon,
    "bateria": batteryIcon,
    "frenos": brakesIcon,
    "motor": engineIcon,
    "observaciones": observationsIcon,
};

const statuses: Array<{
    value: InspectionStatus;
    color: string;
    selectedColor: string;
}> = [
    {
        value: "Sin novedad",
        color: "border-green-500",
        selectedColor: "border-green-500 bg-green-500",
    },
    {
        value: "Con novedad",
        color: "border-amber-400",
        selectedColor: "border-amber-400 bg-amber-400",
    },
    {
        value: "Crítica",
        color: "border-red-500",
        selectedColor: "border-red-500 bg-red-500",
    },
];

export default function InspectionItem({
    template,
    answer,
    onChange,
}: InspectionItemProps) {
    const itemIcon =
        inspectionIconsByTitle[normalizeTitle(template.title)] ??
        checklistItemIcon;

    const showsObservation =
        answer?.status === "Con novedad" ||
        answer?.status === "Crítica";

    const selectStatus = (status: InspectionStatus) => {
        onChange({
            status,
            observation:
                status === "Sin novedad"
                    ? ""
                    : answer?.observation ?? "",
        });
    };

    return (
        <article
            className={[
                "rounded-xl border bg-white p-3",
                answer?.status === "Crítica"
                    ? "border-red-200 bg-red-50/40"
                    : answer?.status === "Con novedad"
                        ? "border-amber-200 bg-amber-50/40"
                        : "border-gray-200",
            ].join(" ")}
        >
            <div className="flex items-center gap-3">
                <img
                    src={itemIcon}
                    alt=""
                    aria-hidden="true"
                    className="h-8 w-8 shrink-0 object-contain"
                />

                <div className="min-w-0 flex-1">
                    <h3 className="text-xs font-semibold text-gray-900">
                        {template.title}
                    </h3>

                    <p className="mt-0.5 text-[10px] leading-4 text-gray-500">
                        {template.description}
                    </p>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                    {statuses.map((status) => {
                        const isSelected =
                            answer?.status === status.value;

                        return (
                            <button
                                key={status.value}
                                type="button"
                                onClick={() => selectStatus(status.value)}
                                aria-label={`${status.value}: ${template.title}`}
                                aria-pressed={isSelected}
                                className={[
                                    "h-4 w-4 rounded-full border-2 p-0.5",
                                    isSelected
                                        ? status.selectedColor
                                        : status.color,
                                ].join(" ")}
                            >
                                {isSelected && (
                                    <span className="block h-full w-full rounded-full bg-white" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {showsObservation && answer && (
                <div className="mt-3 rounded-lg border border-gray-200 bg-white p-3">
                    <label
                        htmlFor={`observation-${template.id}`}
                        className="text-xs font-semibold text-gray-800"
                    >
                        {answer.status === "Crítica"
                            ? "Registrar novedad crítica"
                            : "Registrar novedad"}
                    </label>

                    <p className="mt-0.5 text-[10px] text-gray-500">
                        Describe la novedad encontrada en este ítem.
                    </p>

                    <textarea
                        id={`observation-${template.id}`}
                        value={answer.observation}
                        maxLength={300}
                        onChange={(event) => {
                            onChange({
                                ...answer,
                                observation: event.target.value,
                            });
                        }}
                        className="mt-2 min-h-20 w-full resize-none rounded-lg border border-gray-200 p-2 text-xs outline-none focus:border-amber-400"
                        placeholder="Escribe una descripción..."
                    />

                    <p className="text-right text-[9px] text-gray-400">
                        {answer.observation.length}/300
                    </p>
                </div>
            )}
        </article>
    );
}
