import { useRef } from "react";

interface MaintenanceEvidencePickerProps {
    file: File | null;
    onChange: (file: File | null) => void;
}

export default function MaintenanceEvidencePicker({ file, onChange }: MaintenanceEvidencePickerProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    return (
        <section>
            <label className="block text-sm font-semibold text-gray-800" htmlFor="maintenance-evidence">
                Factura o soporte <span className="font-normal text-gray-400">(opcional)</span>
            </label>
            <p className="mt-1 text-xs text-gray-500">Puedes adjuntar una foto o un PDF de hasta 50 MB.</p>
            <input
                ref={inputRef}
                id="maintenance-evidence"
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="sr-only"
                onChange={(event) => onChange(event.target.files?.[0] ?? null)}
            />
            <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="min-h-11 rounded-lg border border-dashed border-gray-300 px-4 text-sm font-medium text-gray-700 hover:border-amber-400"
                >
                    {file ? "Cambiar archivo" : "Seleccionar archivo"}
                </button>
                {file && (
                    <div className="flex min-w-0 items-center gap-2 text-sm text-gray-600">
                        <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-gray-100 text-[10px] font-bold text-gray-600">
                            {file.type === "application/pdf" ? "PDF" : "IMG"}
                        </span>
                        <span className="max-w-52 truncate">{file.name}</span>
                        <button type="button" onClick={() => onChange(null)} className="rounded px-2 py-1 text-gray-500 hover:bg-gray-100" aria-label="Quitar archivo">
                            Quitar
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}
