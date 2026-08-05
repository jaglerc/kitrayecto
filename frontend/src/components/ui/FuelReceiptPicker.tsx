import { useEffect, useRef, useState } from "react";
import cameraIcon from "../../icons/camera.svg";
import galleryIcon from "../../icons/gallery.svg";

interface FuelReceiptPickerProps { file: File | null; onChange: (file: File | null) => void; }

export default function FuelReceiptPicker({ file, onChange }: FuelReceiptPickerProps) {
    const cameraRef = useRef<HTMLInputElement>(null);
    const galleryRef = useRef<HTMLInputElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!file) { setPreviewUrl(null); return; }
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    const select = (selected?: File) => { if (selected) onChange(selected); };
    return <fieldset><legend className="text-xs font-semibold text-gray-900">11. Foto del recibo <span className="text-amber-500">*</span></legend><p className="mt-1 text-[10px] text-gray-500">El recibo debe ser legible y completo.</p><input ref={cameraRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="hidden" onChange={(event) => select(event.target.files?.[0])} /><input ref={galleryRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => select(event.target.files?.[0])} /><div className="mt-3 grid grid-cols-2 gap-3">{previewUrl ? <div className="relative h-28 overflow-hidden rounded-xl border border-gray-200"><img src={previewUrl} alt="Vista previa del recibo" className="h-full w-full object-cover" /><button type="button" onClick={() => onChange(null)} aria-label="Eliminar foto" className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-gray-900/80 text-white">×</button></div> : <button type="button" onClick={() => cameraRef.current?.click()} className="flex h-28 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300"><img src={cameraIcon} alt="" className="h-6 w-6" /><span className="text-xs font-medium">Tomar foto</span></button>}<button type="button" onClick={() => galleryRef.current?.click()} className="flex h-28 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300"><img src={galleryIcon} alt="" className="h-6 w-6" /><span className="text-xs font-medium">Abrir galería</span></button></div></fieldset>;
}
