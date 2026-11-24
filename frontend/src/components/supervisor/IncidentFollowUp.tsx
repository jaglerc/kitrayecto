import { useState, type FormEvent } from "react";
import { caseStatuses, supervisorIncidentsService, type CaseStatus, type SupervisorIncident } from "../../services/supervisor-incidents.service";

function showBoolean(value: boolean | null) {
    return value === null ? "Pendiente" : value ? "Sí" : "No";
}

export default function IncidentFollowUp({ item, assignees, onSaved }: { item: SupervisorIncident; assignees: { id: number; name: string }[]; onSaved: () => void }) {
    const [status, setStatus] = useState<CaseStatus>(item.status);
    const [note, setNote] = useState("");
    const [assigneeId, setAssigneeId] = useState(item.assigneeId);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    async function save(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (saving || !note.trim()) return;
        setSaving(true);
        setError("");
        try {
            await supervisorIncidentsService.record(item, { status, note, assigneeId });
            setNote("");
            onSaved();
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : "No fue posible guardar");
        } finally {
            setSaving(false);
        }
    }

    return <details className="mt-4 border-t border-gray-200 pt-4">
        <summary className="cursor-pointer text-sm font-semibold">Gestionar seguimiento · {item.status}</summary>
        <p className="mt-3 text-sm">Responsable: {item.assignee ?? "Por asignar"}</p>
        {item.category === "accidente" && item.formCompleted && <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div><dt className="font-semibold">Ubicación</dt><dd>{item.accidentDetails.location}</dd></div>
            <div><dt className="font-semibold">Hora reportada</dt><dd>{item.accidentDetails.time}</dd></div>
            <div><dt className="font-semibold">Conductor lesionado</dt><dd>{showBoolean(item.accidentDetails.driverInjured)}</dd></div>
            <div><dt className="font-semibold">Daños al vehículo</dt><dd>{showBoolean(item.accidentDetails.vehicleDamaged)}</dd></div>
            <div><dt className="font-semibold">Terceros involucrados</dt><dd>{showBoolean(item.accidentDetails.thirdParties)}</dd></div>
        </dl>}
        <form onSubmit={save} className="mt-4 grid gap-3 text-sm">
            <fieldset disabled={saving} className="grid gap-3">
                <label className="grid gap-1">Estado del caso
                    <select value={status} onChange={(event) => setStatus(event.target.value as CaseStatus)} className="rounded-lg border p-2">
                        {caseStatuses.map((option) => <option key={option}>{option}</option>)}
                    </select>
                </label>
                <label className="grid gap-1">{status === "Cerrado" ? "Nota de resolución" : "Nota de seguimiento"}
                    <textarea required maxLength={2000} rows={3} value={note} onChange={(event) => setNote(event.target.value)} className="rounded-lg border p-2" />
                </label>
                <label className="grid gap-1">Asignar responsable
                    <select value={assigneeId ?? ""} onChange={(event) => setAssigneeId(event.target.value ? Number(event.target.value) : null)} className="rounded-lg border p-2">
                        <option value="">Por asignar</option>
                        {item.assigneeId !== null && !assignees.some((person) => person.id === item.assigneeId) &&
                            <option value={item.assigneeId}>{item.assignee} (inactivo)</option>}
                        {assignees.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
                    </select>
                </label>
                <button disabled={!note.trim()} className="w-fit rounded-lg bg-amber-400 px-4 py-2 font-semibold disabled:opacity-50">{saving ? "Guardando…" : "Guardar seguimiento"}</button>
            </fieldset>
            {error && <p role="alert" className="text-red-700">{error}</p>}
        </form>
        {item.history.length > 0 && <section className="mt-5">
            <h2 className="text-sm font-semibold">Historial de seguimiento</h2>
            <ol className="mt-2 space-y-3 border-l border-gray-200 pl-4">
                {item.history.map((event) => <li key={event.id} className="text-sm">
                    <p className="font-semibold">{event.status} · {event.author}</p>
                    <time className="text-gray-600">{new Date(event.createdAt).toLocaleString("es-CO", { timeZone: "America/Bogota" })}</time>
                    <p className="whitespace-pre-wrap break-words">{event.note}</p>
                    {event.assignee && <p className="text-gray-600">Responsable: {event.assignee}</p>}
                </li>)}
            </ol>
        </section>}
    </details>;
}
