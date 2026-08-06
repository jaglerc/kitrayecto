import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router";

import SupervisorDocumentField from "../components/supervisor/SupervisorDocumentField";
import type { SupervisorDocumentValue } from "../components/supervisor/SupervisorDocumentField";
import SupervisorSidebar from "../components/supervisor/SupervisorSidebar";
import usersIcon from "../icons/supervisor/users.svg";
import { storageService } from "../services/storage.service";
import { supervisorUsersService } from "../services/supervisor-users.service";
import type { SupervisorDocumentType, SupervisorUserDetail, SupervisorUserRole } from "../services/supervisor-users.service";

interface StoredUser { nombre?: string; role?: SupervisorUserRole; }
const getStoredUser = (): StoredUser => {
    try { return JSON.parse(localStorage.getItem("user") ?? "null") ?? {}; }
    catch { return {}; }
};

const documentLabels: Record<SupervisorDocumentType, string> = {
    Foto: "Foto",
    Licencia_conduccion: "Licencia de conducción",
    Cedula: "Cédula",
    Certificado_manipulacion_alimentos: "Certificado de manipulación de alimentos",
};
const documentTypes = Object.keys(documentLabels) as SupervisorDocumentType[];

type EditableUser = Omit<SupervisorUserDetail, "documents" | "createdAt" | "estado" | "id">;

export default function SupervisorUserDetailPage() {
    const navigate = useNavigate();
    const currentUser = getStoredUser();
    const userId = Number(useParams().userId);
    const [user, setUser] = useState<SupervisorUserDetail | null>(null);
    const [form, setForm] = useState<EditableUser | null>(null);
    const [files, setFiles] = useState<Partial<Record<SupervisorDocumentType, File>>>({});
    const [documentStatus, setDocumentStatus] = useState<Partial<Record<SupervisorDocumentType, "idle" | "uploading" | "uploaded" | "error">>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const load = async () => {
        setLoading(true); setError(null);
        try {
            const result = await supervisorUsersService.findById(userId);
            setUser(result);
            const { documents: _documents, createdAt: _createdAt, estado: _estado, id: _id, ...editable } = result;
            setForm(editable);
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : "No fue posible consultar el usuario");
        } finally { setLoading(false); }
    };

    useEffect(() => { if (Number.isInteger(userId) && userId > 0) void load(); }, [userId]);

    const update = <K extends keyof EditableUser>(key: K, value: EditableUser[K]) => {
        setForm((current) => current ? { ...current, [key]: value } : current);
        setError(null); setSuccess(null);
    };

    const save = async (event: FormEvent) => {
        event.preventDefault();
        if (!form || saving) return;
        setSaving(true); setError(null); setSuccess(null);
        try {
            await supervisorUsersService.update(userId, {
                cedula: form.cedula,
                nombre: form.nombre,
                segundoNombre: form.segundoNombre,
                apellido: form.apellido,
                fechaExpedicionDocumento: form.fechaExpedicionDocumento,
                ciudadExpedicionDocumento: form.ciudadExpedicionDocumento,
                eps: form.eps,
                telefono: form.telefono,
                categoriaLicencia: form.categoriaLicencia,
                vencimientoLicencia: form.vencimientoLicencia,
                role: form.role,
            });
            setSuccess("Información del usuario actualizada.");
            await load();
        } catch (reason) { setError(reason instanceof Error ? reason.message : "No fue posible actualizar el usuario"); }
        finally { setSaving(false); }
    };

    const changeStatus = async () => {
        if (!user || saving) return;
        const next = !user.estado;
        if (!window.confirm(next ? "¿Deseas reactivar este usuario?" : "¿Deseas desactivar este usuario? No podrá ingresar al sistema.")) return;
        setSaving(true); setError(null); setSuccess(null);
        try {
            await supervisorUsersService.updateStatus(user.id, next);
            setSuccess(next ? "Usuario reactivado." : "Usuario desactivado.");
            await load();
        } catch (reason) { setError(reason instanceof Error ? reason.message : "No fue posible cambiar el estado"); }
        finally { setSaving(false); }
    };

    const replaceDocument = async (type: SupervisorDocumentType) => {
        const file = files[type];
        if (!file) return;
        setDocumentStatus((current) => ({ ...current, [type]: "uploading" }));
        setError(null); setSuccess(null);
        try {
            const uploaded = await storageService.uploadFile(file, "usuarios", userId);
            await supervisorUsersService.createDocument(userId, { tipoDocumento: type, objectKey: uploaded.objectKey });
            setDocumentStatus((current) => ({ ...current, [type]: "uploaded" }));
            setFiles((current) => { const next = { ...current }; delete next[type]; return next; });
            setSuccess(`${documentLabels[type]} actualizado correctamente.`);
            await load();
        } catch (reason) {
            setDocumentStatus((current) => ({ ...current, [type]: "error" }));
            setError(reason instanceof Error ? reason.message : `No fue posible actualizar ${documentLabels[type]}`);
        }
    };

    if (loading && !user) return <div className="min-h-dvh bg-gray-50 p-10 text-center text-gray-500">Consultando usuario...</div>;

    return (
        <div className="min-h-dvh bg-gray-50">
            <SupervisorSidebar name={currentUser.nombre ?? "Supervisor"} active="usuarios" />
            <main className="px-4 py-6 md:ml-64 md:px-8 lg:px-10">
                <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50"><img src={usersIcon} alt="" className="h-7 w-7" /></span><div><p className="text-xs font-medium uppercase tracking-wider text-amber-500">Gestión de usuarios</p><h1 className="text-2xl font-bold text-gray-900">Detalle del usuario</h1><p className="mt-1 text-sm text-gray-500">Consulta y actualiza su información y documentos.</p></div></div>
                    <button type="button" onClick={() => navigate("/supervisor/users")} className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600">Volver a usuarios</button>
                </header>
                {error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</p>}
                {success && <p role="status" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{success}</p>}

                {user && form && <>
                    <section className="mt-6 flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                        <div><p className="text-lg font-bold text-gray-900">{[user.nombre, user.segundoNombre, user.apellido].filter(Boolean).join(" ")}</p><p className="mt-1 text-sm text-gray-500">{user.role} · C.C. {user.cedula}</p></div>
                        <div className="flex items-center gap-3"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${user.estado ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>{user.estado ? "Activo" : "Inactivo"}</span><button type="button" disabled={saving} onClick={() => void changeStatus()} className={`rounded-lg px-4 py-2 text-sm font-semibold ${user.estado ? "border border-red-200 text-red-600" : "bg-emerald-600 text-white"}`}>{user.estado ? "Desactivar" : "Reactivar"}</button></div>
                    </section>

                    <form onSubmit={(event) => void save(event)} className="mt-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <h2 className="mb-4 font-bold text-gray-900">Información del usuario</h2>
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            <Field label="Apellidos" value={form.apellido} required onChange={(value) => update("apellido", value)} /><Field label="Primer nombre" value={form.nombre} required onChange={(value) => update("nombre", value)} /><Field label="Segundo nombre" value={form.segundoNombre ?? ""} onChange={(value) => update("segundoNombre", value || null)} /><Field label="Cédula" value={form.cedula} required onChange={(value) => update("cedula", value.replace(/\D/g, ""))} /><Field label="Fecha de expedición" type="date" value={form.fechaExpedicionDocumento ?? ""} onChange={(value) => update("fechaExpedicionDocumento", value || null)} /><Field label="Ciudad de expedición" value={form.ciudadExpedicionDocumento ?? ""} onChange={(value) => update("ciudadExpedicionDocumento", value || null)} /><Field label="EPS" value={form.eps ?? ""} onChange={(value) => update("eps", value || null)} /><Field label="Celular personal" value={form.telefono ?? ""} onChange={(value) => update("telefono", value || null)} /><Field label="Categoría de licencia" value={form.categoriaLicencia ?? ""} onChange={(value) => update("categoriaLicencia", value || null)} /><Field label="Vencimiento de licencia" type="date" value={form.vencimientoLicencia ?? ""} onChange={(value) => update("vencimientoLicencia", value || null)} />
                            <label className="text-sm font-medium text-gray-700">Rol<select value={form.role} onChange={(event) => update("role", event.target.value as SupervisorUserRole)} className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-3 outline-none focus:border-amber-400"><option value="Conductor">Conductor</option><option value="Supervisor">Supervisor</option>{currentUser.role === "Administrador" && <option value="Administrador">Administrador</option>}</select></label>
                        </div>
                        <div className="mt-5 flex justify-end"><button type="submit" disabled={saving} className="rounded-xl bg-amber-400 px-6 py-3 text-sm font-bold text-gray-900 disabled:opacity-50">{saving ? "Guardando..." : "Guardar cambios"}</button></div>
                    </form>

                    <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><h2 className="font-bold text-gray-900">Documentos vigentes</h2><p className="mt-1 text-sm text-gray-500">Al guardar uno nuevo, reemplazará al archivo anterior.</p><div className="mt-4 grid gap-4 xl:grid-cols-2">
                        {documentTypes.map((type) => {
                            const currentDocument = user.documents.find((document) => document.tipoDocumento === type);
                            const value: SupervisorDocumentValue = { type, file: files[type] ?? null };
                            return <div key={type} className="space-y-2"><SupervisorDocumentField label={documentLabels[type]} value={value} status={documentStatus[type] ?? "idle"} onChange={(next) => { setFiles((current) => ({ ...current, [type]: next.file ?? undefined })); setDocumentStatus((current) => ({ ...current, [type]: "idle" })); }} /><p className="truncate px-1 text-xs text-gray-500">Actual: {currentDocument?.nombreArchivo ?? "Sin documento"}</p>{files[type] && <button type="button" onClick={() => void replaceDocument(type)} disabled={documentStatus[type] === "uploading"} className="w-full rounded-lg border border-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-700">Guardar este documento</button>}</div>;
                        })}
                    </div></section>
                </>}
            </main>
        </div>
    );
}

function Field({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
    return <label className="text-sm font-medium text-gray-700">{label}{required && <span className="text-red-500"> *</span>}<input type={type} value={value} required={required} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-3 outline-none focus:border-amber-400" /></label>;
}
