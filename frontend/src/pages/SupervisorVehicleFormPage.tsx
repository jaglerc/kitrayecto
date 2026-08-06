import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import SupervisorSidebar from "../components/supervisor/SupervisorSidebar";
import vehicleIcon from "../icons/supervisor/vehicle.svg";
import { storageService } from "../services/storage.service";
import {
    supervisorVehiclesService,
    type DocumentStatus,
    type SupervisorVehicle,
    type SupervisorVehicleInput,
    type VehicleLegalDocumentInput,
    type VehicleType,
} from "../services/supervisor-vehicles.service";

const empty: SupervisorVehicleInput = {
    type: "camioneta", plate: "", transitLicense: null, brand: null, owner: null,
    currentMileage: null, oilControlEnabled: true, oilIntervalKm: 5000,
    oilWarningMarginKm: 500, oilReferenceMileage: null, fumigationRequired: false,
    fumigationFrequencyDays: null, lastFumigationDate: null,
};

const supervisorName = () => {
    try { return JSON.parse(localStorage.getItem("user") ?? "null")?.nombre ?? "Supervisor"; }
    catch { return "Supervisor"; }
};
const nullableNumber = (value: string): number | null => value === "" ? null : Number(value);

interface LegalDocumentDraft {
    number: string;
    type: string;
    provider: string;
    validFrom: string;
    expiresAt: string;
    price: string;
    file: File | null;
}

const emptyDocument = (): LegalDocumentDraft => ({
    number: "", type: "", provider: "", validFrom: "", expiresAt: "", price: "", file: null,
});

export default function SupervisorVehicleFormPage() {
    const navigate = useNavigate();
    const { vehicleId } = useParams();
    const id = Number(vehicleId);
    const editing = Number.isInteger(id) && id > 0;
    const [form, setForm] = useState<SupervisorVehicleInput>(empty);
    const [vehicle, setVehicle] = useState<SupervisorVehicle | null>(null);
    const [loading, setLoading] = useState(editing);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [insurance, setInsurance] = useState<LegalDocumentDraft>(emptyDocument);
    const [technicalInspection, setTechnicalInspection] = useState<LegalDocumentDraft>(emptyDocument);

    useEffect(() => {
        if (!editing) return;
        supervisorVehiclesService.findById(id)
            .then((data) => { setVehicle(data); setForm(data); })
            .catch((reason) => setError(reason instanceof Error ? reason.message : "No fue posible consultar el vehículo"))
            .finally(() => setLoading(false));
    }, [editing, id]);

    const set = <K extends keyof SupervisorVehicleInput>(key: K, value: SupervisorVehicleInput[K]) =>
        setForm((current) => ({ ...current, [key]: value }));

    const uploadDocument = async (vehicleId: number, draft: LegalDocumentDraft, kind: "insurance" | "technical") => {
        if (!draft.file) throw new Error("Adjunta el documento PDF");
        const uploaded = await storageService.uploadFile(draft.file, "vehiculos", vehicleId);
        const input = draftToInput(draft, uploaded.objectKey);
        return kind === "insurance"
            ? supervisorVehiclesService.addInsurance(vehicleId, input)
            : supervisorVehiclesService.addTechnicalInspection(vehicleId, input);
    };

    const submit = async (event: React.FormEvent) => {
        event.preventDefault(); setSaving(true); setError(null); setSuccess(null);
        try {
            if (!editing) {
                if (!insurance.number || !insurance.expiresAt || !insurance.file) throw new Error("Completa y adjunta el seguro del vehículo");
                if (!technicalInspection.number || !technicalInspection.expiresAt || !technicalInspection.file) throw new Error("Completa y adjunta la revisión técnico-mecánica");
            }
            let result = editing ? await supervisorVehiclesService.update(id, form) : await supervisorVehiclesService.create(form);
            setVehicle(result); setForm(result);
            if (editing) {
                setSuccess("Vehículo actualizado correctamente");
            } else {
                navigate(`/supervisor/vehicles/${result.id}`, { replace: true });
                try {
                    result = await uploadDocument(result.id, insurance, "insurance");
                    setVehicle(result); setForm(result);
                    result = await uploadDocument(result.id, technicalInspection, "technical");
                    setVehicle(result); setForm(result);
                    setInsurance(emptyDocument()); setTechnicalInspection(emptyDocument());
                    setSuccess("Vehículo y documentación registrados correctamente");
                } catch (documentError) {
                    setError(`El vehículo fue creado, pero no se completó toda la documentación: ${documentError instanceof Error ? documentError.message : "error al guardar documentos"}`);
                    setSuccess("Puedes completar el documento pendiente desde esta misma pantalla.");
                }
            }
        } catch (reason) { setError(reason instanceof Error ? reason.message : "No fue posible guardar"); }
        finally { setSaving(false); }
    };

    const toggleStatus = async () => {
        if (!vehicle) return;
        setSaving(true); setError(null);
        try {
            const result = await supervisorVehiclesService.updateStatus(vehicle.id, !vehicle.active);
            setVehicle(result); setForm(result); setSuccess(result.active ? "Vehículo activado" : "Vehículo desactivado");
        } catch (reason) { setError(reason instanceof Error ? reason.message : "No fue posible cambiar el estado"); }
        finally { setSaving(false); }
    };

    if (loading) return <div className="p-10 text-center">Consultando vehículo...</div>;

    return <div className="min-h-dvh bg-gray-50">
        <SupervisorSidebar name={supervisorName()} active="vehiculos" />
        <main className="px-4 py-6 md:ml-64 md:px-8 lg:px-10">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50"><img src={vehicleIcon} alt="" className="h-7 w-7" /></span><div><p className="text-xs uppercase tracking-wider text-amber-500">Gestión de flota</p><h1 className="text-2xl font-bold">{editing ? vehicle?.plate ?? "Vehículo" : "Registrar vehículo"}</h1><p className="text-sm text-gray-500">Datos, controles preventivos y documentación legal.</p></div></div>
                <div className="flex gap-2"><button type="button" onClick={() => navigate("/supervisor/vehicles")} className="rounded-xl border bg-white px-5 py-3">Volver</button>{vehicle && <button type="button" onClick={toggleStatus} disabled={saving} className={`rounded-xl px-5 py-3 font-semibold ${vehicle.active ? "border border-red-200 bg-red-50 text-red-600" : "bg-emerald-100 text-emerald-700"}`}>{vehicle.active ? "Desactivar" : "Activar"}</button>}</div>
            </header>
            {error && <Message danger>{error}</Message>}{success && <Message>{success}</Message>}
            <form onSubmit={submit} className="mt-6 space-y-6">
                <Card title="Información del vehículo"><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Field label="Tipo de vehículo *"><select value={form.type} onChange={(e) => set("type", e.target.value as VehicleType)} className="control"><option value="camioneta">Camioneta</option><option value="motocicleta">Motocicleta</option><option value="motocarguero">Motocarguero</option><option value="carro">Carro</option></select></Field>
                    <Field label="Placa *"><input required value={form.plate} onChange={(e) => set("plate", e.target.value)} className="control uppercase" /></Field>
                    <Field label="Kilometraje actual (opcional)"><input min={0} type="number" value={form.currentMileage ?? ""} onChange={(e) => set("currentMileage", nullableNumber(e.target.value))} placeholder="Se establecerá en la primera lectura" className="control" /></Field>
                    <Field label="Marca"><input value={form.brand ?? ""} onChange={(e) => set("brand", e.target.value || null)} className="control" /></Field>
                    <Field label="Licencia de tránsito"><input value={form.transitLicense ?? ""} onChange={(e) => set("transitLicense", e.target.value || null)} className="control" /></Field>
                    <Field label="Propietario"><input value={form.owner ?? ""} onChange={(e) => set("owner", e.target.value || null)} className="control" /></Field>
                </div><p className="mt-4 rounded-xl bg-blue-50 p-3 text-sm text-blue-700">Si no conoces el kilometraje, puede quedar pendiente. La primera inspección o registro autorizado establecerá la lectura inicial.</p></Card>

                <Card title="Control de cambio de aceite" description="Genera alertas usando el kilometraje acumulado del vehículo." toggle={<Toggle checked={form.oilControlEnabled} onChange={(value) => set("oilControlEnabled", value)} />}>
                    {form.oilControlEnabled && <div className="grid gap-4 md:grid-cols-3"><Field label="Intervalo de cambio (km) *"><input required min={500} type="number" value={form.oilIntervalKm ?? ""} onChange={(e) => set("oilIntervalKm", nullableNumber(e.target.value))} className="control" /></Field><Field label="Avisar cuando falten (km) *"><input required min={0} type="number" value={form.oilWarningMarginKm ?? ""} onChange={(e) => set("oilWarningMarginKm", nullableNumber(e.target.value))} className="control" /></Field><Field label="Kilometraje del último cambio"><input min={0} max={form.currentMileage ?? undefined} disabled={form.currentMileage === null} type="number" value={form.oilReferenceMileage ?? ""} onChange={(e) => set("oilReferenceMileage", nullableNumber(e.target.value))} placeholder={form.currentMileage === null ? "Registra primero el kilometraje" : "Vacío si no se conoce"} className="control disabled:bg-gray-100" /></Field></div>}
                    {vehicle?.oilControlEnabled && <Alert status={vehicle.oilStatus} text={vehicle.nextOilChangeKm === null ? "Falta registrar un cambio de aceite de referencia." : `Próximo cambio: ${vehicle.nextOilChangeKm.toLocaleString("es-CO")} km · ${vehicle.oilRemainingKm?.toLocaleString("es-CO")} km restantes.`} />}
                </Card>

                <Card title="Control de fumigación" description="La alerta se calcula por fecha y frecuencia." toggle={<Toggle checked={form.fumigationRequired} onChange={(value) => set("fumigationRequired", value)} />}>
                    {form.fumigationRequired && <div className="grid gap-4 md:grid-cols-2"><Field label="Frecuencia (días) *"><input required min={1} type="number" value={form.fumigationFrequencyDays ?? ""} onChange={(e) => set("fumigationFrequencyDays", nullableNumber(e.target.value))} className="control" /></Field><Field label="Última fumigación"><input type="date" value={form.lastFumigationDate ?? ""} onChange={(e) => set("lastFumigationDate", e.target.value || null)} className="control" /></Field></div>}
                    {vehicle?.fumigationRequired && <Alert status={vehicle.fumigationStatus} text={vehicle.nextFumigationDate ? `Próxima fumigación: ${vehicle.nextFumigationDate}` : "Falta registrar una fumigación de referencia."} />}
                </Card>

                <LegalDocuments
                    vehicle={vehicle}
                    insurance={insurance}
                    technicalInspection={technicalInspection}
                    onInsuranceChange={setInsurance}
                    onTechnicalChange={setTechnicalInspection}
                    onChange={(updated, message) => { setVehicle(updated); setForm(updated); setSuccess(message); setError(null); }}
                    onError={setError}
                />

                <footer className="sticky bottom-0 flex justify-end border-t bg-white/95 p-4 shadow-lg"><button disabled={saving} className="min-w-56 rounded-xl bg-amber-400 px-6 py-3 font-bold hover:bg-amber-500 disabled:opacity-50">{saving ? "Guardando..." : editing ? "Guardar cambios" : "Registrar vehículo"}</button></footer>
            </form>
        </main>
    </div>;
}

function LegalDocuments({ vehicle, insurance, technicalInspection, onInsuranceChange, onTechnicalChange, onChange, onError }: {
    vehicle: SupervisorVehicle | null;
    insurance: LegalDocumentDraft;
    technicalInspection: LegalDocumentDraft;
    onInsuranceChange: (draft: LegalDocumentDraft) => void;
    onTechnicalChange: (draft: LegalDocumentDraft) => void;
    onChange: (vehicle: SupervisorVehicle, message: string) => void;
    onError: (message: string | null) => void;
}) {
    const saveExisting = async (draft: LegalDocumentDraft, kind: "insurance" | "technical") => {
        if (!vehicle || !draft.file) throw new Error("Adjunta el documento antes de guardar");
        const uploaded = await storageService.uploadFile(draft.file, "vehiculos", vehicle.id);
        return kind === "insurance"
            ? supervisorVehiclesService.addInsurance(vehicle.id, draftToInput(draft, uploaded.objectKey))
            : supervisorVehiclesService.addTechnicalInspection(vehicle.id, draftToInput(draft, uploaded.objectKey));
    };

    return <Card title="Documentación legal" description="Los documentos se guardan de forma privada y se abren mediante enlaces temporales.">
        {vehicle
            ? <div className="mb-5"><DocumentStatusBadge status={vehicle.documentationStatus} /><span className="ml-3 text-sm text-gray-600">{vehicle.availableForJourney ? "Disponible para iniciar jornada" : "No disponible para conductores hasta completar documentos vigentes"}</span></div>
            : <p className="mb-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">Adjunta ambos documentos. Al registrar, el sistema creará el vehículo y guardará su documentación automáticamente.</p>}
        <div className="grid gap-6 xl:grid-cols-2">
            <LegalDocumentForm title="Seguro del vehículo" draft={insurance} onDraftChange={onInsuranceChange} includeProvider onSave={vehicle ? async () => { const updated = await saveExisting(insurance, "insurance"); onInsuranceChange(emptyDocument()); onChange(updated, "Seguro registrado correctamente"); } : undefined} onError={onError} />
            <LegalDocumentForm title="Revisión técnico-mecánica" draft={technicalInspection} onDraftChange={onTechnicalChange} onSave={vehicle ? async () => { const updated = await saveExisting(technicalInspection, "technical"); onTechnicalChange(emptyDocument()); onChange(updated, "Revisión técnico-mecánica registrada correctamente"); } : undefined} onError={onError} />
        </div>
        {vehicle && <div className="mt-6 grid gap-6 xl:grid-cols-2"><History title="Historial de seguros" rows={vehicle.insurances.map((item) => ({ id: item.id, name: item.policyNumber, expiresAt: item.expiresAt, status: item.status, url: item.document?.downloadUrl }))} /><History title="Historial técnico-mecánico" rows={vehicle.technicalInspections.map((item) => ({ id: item.id, name: item.number, expiresAt: item.expiresAt, status: item.status, url: item.document?.downloadUrl }))} /></div>}
    </Card>;
}

function draftToInput(draft: LegalDocumentDraft, objectKey: string): VehicleLegalDocumentInput {
    return { number: draft.number, type: draft.type || null, provider: draft.provider || null, validFrom: draft.validFrom || null, expiresAt: draft.expiresAt, price: draft.price ? Number(draft.price) : null, objectKey, fileName: draft.file?.name ?? "documento.pdf" };
}

function LegalDocumentForm({ title, draft, onDraftChange, includeProvider = false, onSave, onError }: { title: string; draft: LegalDocumentDraft; onDraftChange: (draft: LegalDocumentDraft) => void; includeProvider?: boolean; onSave?: () => Promise<void>; onError: (message: string | null) => void }) {
    const [saving, setSaving] = useState(false);
    const setDraft = <K extends keyof LegalDocumentDraft>(key: K, value: LegalDocumentDraft[K]) => onDraftChange({ ...draft, [key]: value });
    const submit = async () => {
        if (!onSave) return;
        if (!draft.file) { onError("Adjunta el documento antes de guardar"); return; }
        setSaving(true); onError(null);
        try { await onSave(); }
        catch (reason) { onError(reason instanceof Error ? reason.message : "No fue posible guardar el documento"); }
        finally { setSaving(false); }
    };
    return <section className="rounded-2xl border p-5"><h3 className="font-bold">{title}</h3><div className="mt-4 grid gap-3 sm:grid-cols-2"><Field label="Número *"><input required={!onSave} value={draft.number} onChange={(e) => setDraft("number", e.target.value)} className="control" /></Field>{includeProvider && <><Field label="Tipo de póliza"><input value={draft.type} onChange={(e) => setDraft("type", e.target.value)} className="control" /></Field><Field label="Aseguradora"><input value={draft.provider} onChange={(e) => setDraft("provider", e.target.value)} className="control" /></Field></>}<Field label="Inicio de vigencia"><input type="date" value={draft.validFrom} onChange={(e) => setDraft("validFrom", e.target.value)} className="control" /></Field><Field label="Vencimiento *"><input required={!onSave} type="date" value={draft.expiresAt} onChange={(e) => setDraft("expiresAt", e.target.value)} className="control" /></Field><Field label="Valor"><input min={0} type="number" value={draft.price} onChange={(e) => setDraft("price", e.target.value)} className="control" /></Field><Field label="Documento PDF *"><input key={draft.file?.name ?? "empty"} required={!onSave} type="file" accept="application/pdf" onChange={(e) => setDraft("file", e.target.files?.[0] ?? null)} className="control" /></Field></div>{onSave && <button type="button" disabled={saving || !draft.number || !draft.expiresAt || !draft.file} onClick={submit} className="mt-4 w-full rounded-xl bg-amber-400 px-4 py-3 font-semibold disabled:opacity-50">{saving ? "Guardando documento..." : "Guardar documento"}</button>}</section>;
}

function History({ title, rows }: { title: string; rows: Array<{ id: number; name: string; expiresAt: string | null; status: DocumentStatus; url?: string }> }) { return <section><h3 className="mb-3 font-bold">{title}</h3><div className="space-y-2">{rows.length === 0 ? <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500">Sin registros.</p> : rows.map((row) => <div key={row.id} className="flex items-center justify-between gap-3 rounded-xl border p-3"><div><p className="font-medium">{row.name}</p><p className="text-xs text-gray-500">Vence: {row.expiresAt ?? "Sin fecha"}</p></div><div className="flex items-center gap-2"><DocumentStatusBadge status={row.status} />{row.url && <a href={row.url} target="_blank" rel="noreferrer" className="rounded-lg border px-3 py-2 text-sm font-semibold">Abrir PDF</a>}</div></div>)}</div></section>; }
function DocumentStatusBadge({ status }: { status: DocumentStatus }) { const styles = status === "expired" ? "bg-red-100 text-red-700" : status === "upcoming" ? "bg-amber-100 text-amber-700" : status === "valid" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-700"; const text = status === "expired" ? "Vencido" : status === "upcoming" ? "Próximo a vencer" : status === "valid" ? "Vigente" : "Incompleto"; return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${styles}`}>{text}</span>; }
function Card({ title, description, toggle, children }: { title: string; description?: string; toggle?: React.ReactNode; children: React.ReactNode }) { return <section className="rounded-2xl border bg-white p-6 shadow-sm"><div className="mb-5 flex items-start justify-between"><div><h2 className="text-lg font-bold">{title}</h2>{description && <p className="text-sm text-gray-500">{description}</p>}</div>{toggle}</div>{children}</section>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="grid gap-2 text-sm font-medium text-gray-700"><span>{label}</span>{children}</label>; }
function Toggle({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) { return <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className={`relative h-7 w-12 rounded-full transition ${checked ? "bg-amber-400" : "bg-gray-300"}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${checked ? "left-6" : "left-1"}`} /></button>; }
function Alert({ status, text }: { status: string; text: string }) { const danger = status === "overdue"; const warning = status === "upcoming" || status === "pending"; return <p className={`mt-5 rounded-xl border p-3 text-sm ${danger ? "border-red-200 bg-red-50 text-red-700" : warning ? "border-amber-200 bg-amber-50 text-amber-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{text}</p>; }
function Message({ danger = false, children }: { danger?: boolean; children: React.ReactNode }) { return <p className={`mt-5 rounded-xl border p-3 ${danger ? "border-red-200 bg-red-50 text-red-600" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{children}</p>; }
