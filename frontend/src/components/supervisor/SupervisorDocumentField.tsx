import uploadIcon from "../../icons/supervisor/upload.svg";
import type { SupervisorDocumentType } from "../../services/supervisor-users.service";

export interface SupervisorDocumentValue {
    type: SupervisorDocumentType;
    file: File | null;
}

interface SupervisorDocumentFieldProps {
    label: string;
    value: SupervisorDocumentValue;
    onChange: (value: SupervisorDocumentValue) => void;
    required?: boolean;
    status?: "idle" | "uploading" | "uploaded" | "error";
}

export default function SupervisorDocumentField({
    label,
    value,
    onChange,
    required = false,
    status = "idle",
}: SupervisorDocumentFieldProps) {
    return (
        <article className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                        {label} {required && <span className="text-red-500">*</span>}
                    </h3>
                    <p className="mt-1 text-xs text-gray-500">
                        Imagen o PDF, máximo 2.5 MB.
                    </p>
                </div>

                <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">
                    <img src={uploadIcon} alt="" aria-hidden="true" className="h-5 w-5" />
                    {value.file ? "Cambiar archivo" : "Seleccionar archivo"}
                    <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        className="sr-only"
                        onChange={(event) => {
                            onChange({
                                ...value,
                                file: event.target.files?.[0] ?? null,
                            });
                        }}
                    />
                </label>
            </div>

            {value.file && (
                <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 text-xs">
                    <p className="min-w-0 truncate text-gray-600">{value.file.name}</p>
                    {status === "uploading" && <span className="shrink-0 text-amber-600">Subiendo...</span>}
                    {status === "uploaded" && <span className="shrink-0 text-emerald-700">Guardado</span>}
                    {status === "error" && <span className="shrink-0 text-red-600">No guardado</span>}
                </div>
            )}

        </article>
    );
}
