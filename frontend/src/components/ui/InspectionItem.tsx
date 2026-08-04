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
import cameraIcon from "../../icons/camera.svg";
import galleryIcon from "../../icons/gallery.svg";

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
        if (status === "Sin novedad") {
            answer?.evidenceFiles.forEach((evidence) => {
                URL.revokeObjectURL(evidence.previewUrl);
            });
        }

        onChange({
            status,
            observation:
                status === "Sin novedad"
                    ? ""
                    : answer?.observation ?? "",
            evidenceFiles:
                status === "Sin novedad"
                    ? []
                    : answer?.evidenceFiles ?? [],
        });
    };

    const addEvidenceFiles = (files: FileList | null) => {
        if (!files || !answer) return;

        const availableSlots = 3 - answer.evidenceFiles.length;
        const selectedFiles = Array.from(files)
            .filter((file) => file.type.startsWith("image/"))
            .slice(0, availableSlots)
            .map((file) => ({
                id: crypto.randomUUID(),
                file,
                previewUrl: URL.createObjectURL(file),
            }));

        onChange({
            ...answer,
            evidenceFiles: [...answer.evidenceFiles, ...selectedFiles],
        });
    };

    const removeEvidence = (evidenceId: string) => {
        if (!answer) return;

        const evidence = answer.evidenceFiles.find(
            (item) => item.id === evidenceId
        );
        if (evidence) URL.revokeObjectURL(evidence.previewUrl);

        onChange({
            ...answer,
            evidenceFiles: answer.evidenceFiles.filter(
                (item) => item.id !== evidenceId
            ),
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

                    <div className="mt-2">
                        <p className="text-[10px] font-semibold text-gray-700">
                            {answer.status === "Crítica"
                                ? "Adjuntar evidencia obligatoria"
                                : "Adjuntar evidencia"}
                        </p>

                        <div className="mt-2 grid grid-cols-2 gap-2">
                            <label
                                htmlFor={`camera-${template.id}`}
                                className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-[10px] font-medium text-gray-700"
                            >
                                <img src={cameraIcon} alt="" className="h-4 w-4" />
                                Tomar foto
                            </label>
                            <input
                                id={`camera-${template.id}`}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                capture="environment"
                                className="sr-only"
                                disabled={answer.evidenceFiles.length >= 3}
                                onChange={(event) => {
                                    addEvidenceFiles(event.target.files);
                                    event.target.value = "";
                                }}
                            />

                            <label
                                htmlFor={`gallery-${template.id}`}
                                className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-[10px] font-medium text-gray-700"
                            >
                                <img src={galleryIcon} alt="" className="h-4 w-4" />
                                Galería
                            </label>
                            <input
                                id={`gallery-${template.id}`}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                multiple
                                className="sr-only"
                                disabled={answer.evidenceFiles.length >= 3}
                                onChange={(event) => {
                                    addEvidenceFiles(event.target.files);
                                    event.target.value = "";
                                }}
                            />
                        </div>

                        {answer.evidenceFiles.length > 0 && (
                            <div className="mt-2 grid grid-cols-3 gap-2">
                                {answer.evidenceFiles.map((evidence) => (
                                    <div key={evidence.id} className="relative overflow-hidden rounded-lg border border-gray-200">
                                        <img
                                            src={evidence.previewUrl}
                                            alt="Vista previa de evidencia"
                                            className="h-20 w-full object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeEvidence(evidence.id)}
                                            aria-label="Eliminar evidencia"
                                            className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-xs text-white"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <p className="mt-1 text-right text-[9px] text-gray-400">
                            {answer.evidenceFiles.length}/3 imágenes
                        </p>
                    </div>
                </div>
            )}
        </article>
    );
}
