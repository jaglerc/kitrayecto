import { useEffect, useRef, useState } from "react";
import cameraIcon from "../../icons/camera.svg";
import galleryIcon from "../../icons/gallery.svg";

interface TripIncidentEvidencePickerProps { files: File[]; onChange: (files: File[]) => void; required: boolean; }

export default function TripIncidentEvidencePicker({ files, onChange, required }: TripIncidentEvidencePickerProps) {
    const cameraRef = useRef<HTMLInputElement>(null);
    const galleryRef = useRef<HTMLInputElement>(null);
    const [previews, setPreviews] = useState<string[]>([]);
    useEffect(() => { const urls = files.map((file) => URL.createObjectURL(file)); setPreviews(urls); return () => urls.forEach(URL.revokeObjectURL); }, [files]);
    const addFiles = (selected: File[]) => onChange([...files, ...selected].slice(0, 3));
    return <fieldset><legend className="text-xs font-semibold text-gray-900">3. Adjuntar evidencia {required ? <span className="text-red-500">*</span> : <span className="font-normal text-gray-400">(opcional)</span>}</legend><p className="mt-1 text-[10px] text-gray-500">Puedes adjuntar hasta tres fotografías.</p><input ref={cameraRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) addFiles([file]); event.target.value = ""; }} /><input ref={galleryRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(event) => { addFiles(Array.from(event.target.files ?? [])); event.target.value = ""; }} /><div className="mt-3 grid grid-cols-2 gap-2"><button type="button" disabled={files.length >= 3} onClick={() => cameraRef.current?.click()} className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 py-2 text-xs disabled:opacity-40"><img src={cameraIcon} alt="" className="h-4 w-4" />Tomar foto</button><button type="button" disabled={files.length >= 3} onClick={() => galleryRef.current?.click()} className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 py-2 text-xs disabled:opacity-40"><img src={galleryIcon} alt="" className="h-4 w-4" />Abrir galería</button></div>{previews.length > 0 && <div className="mt-3 grid grid-cols-3 gap-2">{previews.map((preview, index) => <div key={preview} className="relative h-24 overflow-hidden rounded-lg border border-gray-200"><img src={preview} alt={`Evidencia ${index + 1}`} className="h-full w-full object-cover" /><button type="button" onClick={() => onChange(files.filter((_, fileIndex) => fileIndex !== index))} aria-label={`Eliminar evidencia ${index + 1}`} className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-gray-900/80 text-white">×</button></div>)}</div>}</fieldset>;
}
