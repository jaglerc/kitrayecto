import { useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface Props {
    label: string;
    title: string;
    description: string;
    confirmation?: string;
    disabled?: boolean;
    onDelete: () => Promise<void>;
    onDeleted: () => void;
}

export default function DeleteAction({ label, title, description, confirmation, disabled, onDelete, onDeleted }: Props) {
    const dialog = useRef<HTMLDialogElement>(null);
    const busy = useRef(false);
    const [pending, setPending] = useState(false);
    const [value, setValue] = useState("");
    const [error, setError] = useState<string | null>(null);
    const titleId = useId();
    const descriptionId = useId();

    const close = () => { if (!busy.current) dialog.current?.close(); };
    const remove = async () => {
        if (busy.current || (confirmation && value.trim() !== confirmation)) return;
        busy.current = true; setPending(true); setError(null);
        try {
            await onDelete();
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : "No fue posible eliminar. Vuelve a intentarlo.");
            busy.current = false; setPending(false);
            return;
        }
        busy.current = false; setPending(false);
        dialog.current?.close();
        onDeleted();
    };

    return <>
        <button type="button" disabled={disabled || pending} onClick={() => { setValue(""); setError(null); dialog.current?.showModal(); }} className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-50">{label}</button>
        {createPortal(<dialog ref={dialog} aria-labelledby={titleId} aria-describedby={descriptionId} aria-busy={pending} onCancel={(event) => { if (busy.current) event.preventDefault(); }} className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border-0 bg-white p-6 shadow-xl backdrop:bg-gray-950/50">
            <h2 id={titleId} className="text-xl font-bold text-gray-900">{title}</h2>
            <div id={descriptionId} className="mt-3 space-y-3 text-sm leading-6 text-gray-600"><p className="break-words">{description}</p><p className="font-semibold text-red-700">Esta acción es permanente y no se puede deshacer.</p></div>
            {confirmation && <label className="mt-5 block text-sm font-medium text-gray-700">Para confirmar, escribe <strong className="break-all">{confirmation}</strong><input value={value} disabled={pending} onChange={(event) => setValue(event.target.value)} autoComplete="off" spellCheck={false} className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-3 outline-none focus:border-red-500" /></label>}
            {error && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" autoFocus disabled={pending} onClick={close} className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 disabled:opacity-50">Cancelar</button><button type="button" disabled={pending || Boolean(confirmation && value.trim() !== confirmation)} onClick={() => void remove()} className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50">{pending ? "Eliminando..." : "Eliminar definitivamente"}</button></div>
        </dialog>, document.body)}
    </>;
}
