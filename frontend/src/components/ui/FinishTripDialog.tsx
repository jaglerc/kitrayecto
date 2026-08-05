interface FinishTripDialogProps {
    isOpen: boolean;
    isFinishing: boolean;
    tripNumber: number;
    onCancel: () => void;
    onConfirm: () => void;
}

export default function FinishTripDialog({ isOpen, isFinishing, tripNumber, onCancel, onConfirm }: FinishTripDialogProps) {
    if (!isOpen) return null;
    return <div role="presentation" className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-5"><section role="dialog" aria-modal="true" aria-labelledby="finish-trip-title" className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl"><h2 id="finish-trip-title" className="text-base font-bold text-gray-900">¿Terminar el viaje {tripNumber}?</h2><p className="mt-2 text-sm leading-5 text-gray-500">Se registrará automáticamente la fecha y hora de finalización. Esta acción no se puede deshacer.</p><div className="mt-5 grid grid-cols-2 gap-3"><button type="button" disabled={isFinishing} onClick={onCancel} className="rounded-lg border border-gray-300 py-3 text-sm font-semibold text-gray-700">Cancelar</button><button type="button" disabled={isFinishing} onClick={onConfirm} className="rounded-lg bg-amber-400 py-3 text-sm font-semibold text-gray-900 disabled:opacity-50">{isFinishing ? "Terminando..." : "Sí, terminar"}</button></div></section></div>;
}
