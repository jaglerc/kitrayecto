import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { useNavigate } from "react-router";

import SupervisorDocumentField from "../components/supervisor/SupervisorDocumentField";
import type { SupervisorDocumentValue } from "../components/supervisor/SupervisorDocumentField";
import SupervisorSidebar from "../components/supervisor/SupervisorSidebar";
import userAddIcon from "../icons/supervisor/user-add.svg";
import { storageService } from "../services/storage.service";
import { supervisorUsersService } from "../services/supervisor-users.service";
import type {
    SupervisorDocumentType,
    SupervisorUserRole,
} from "../services/supervisor-users.service";

interface StoredUser {
    nombre?: string;
    role?: SupervisorUserRole;
}

interface FormState {
    apellido: string;
    nombre: string;
    segundoNombre: string;
    cedula: string;
    fechaExpedicionDocumento: string;
    ciudadExpedicionDocumento: string;
    eps: string;
    telefono: string;
    requiereManipulacionAlimentos: boolean;
    categoriaLicencia: string;
    vencimientoLicencia: string;
    role: SupervisorUserRole;
    password: string;
}

const initialForm: FormState = {
    apellido: "",
    nombre: "",
    segundoNombre: "",
    cedula: "",
    fechaExpedicionDocumento: "",
    ciudadExpedicionDocumento: "",
    eps: "",
    telefono: "",
    requiereManipulacionAlimentos: false,
    categoriaLicencia: "",
    vencimientoLicencia: "",
    role: "Conductor",
    password: "",
};

const createDocument = (type: SupervisorDocumentType): SupervisorDocumentValue => ({
    type,
    file: null,
});

const initialDocuments = (): Record<SupervisorDocumentType, SupervisorDocumentValue> => ({
    Foto: createDocument("Foto"),
    Licencia_conduccion: createDocument("Licencia_conduccion"),
    Cedula: createDocument("Cedula"),
    Certificado_manipulacion_alimentos: createDocument(
        "Certificado_manipulacion_alimentos"
    ),
});

const getStoredUser = (): StoredUser | null => {
    try {
        return JSON.parse(localStorage.getItem("user") ?? "null") as StoredUser | null;
    } catch {
        return null;
    }
};

export default function SupervisorCreateUserPage() {
    const navigate = useNavigate();
    const currentUser = getStoredUser();
    const [form, setForm] = useState<FormState>(initialForm);
    const [documents, setDocuments] = useState(initialDocuments);
    const [createdUserId, setCreatedUserId] = useState<number | null>(null);
    const uploadedTypes = useRef(new Set<SupervisorDocumentType>());
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const update = <Key extends keyof FormState>(key: Key, value: FormState[Key]) => {
        setForm((current) => ({ ...current, [key]: value }));
        setError(null);
    };

    const updateDocument = (
        type: SupervisorDocumentType,
        value: SupervisorDocumentValue
    ) => {
        setDocuments((current) => ({ ...current, [type]: value }));
        setError(null);
    };

    const canSave = Boolean(
        form.apellido.trim() &&
        form.nombre.trim() &&
        form.cedula.trim() &&
        form.password.length >= 8 &&
        (!form.requiereManipulacionAlimentos ||
            documents.Certificado_manipulacion_alimentos.file)
    );

    const saveDocuments = async (userId: number): Promise<void> => {
        const selected = Object.values(documents).filter(
            (document) => document.file && !uploadedTypes.current.has(document.type)
        );

        for (const document of selected) {
            if (!document.file) continue;

            const uploaded = await storageService.uploadFile(
                document.file,
                "usuarios",
                userId
            );

            await supervisorUsersService.createDocument(userId, {
                tipoDocumento: document.type,
                objectKey: uploaded.objectKey,
            });

            uploadedTypes.current.add(document.type);
        }
    };

    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!canSave || isSaving) return;

        setIsSaving(true);
        setError(null);
        setSuccess(null);

        try {
            let userId = createdUserId;

            if (!userId) {
                const created = await supervisorUsersService.create({
                    cedula: form.cedula,
                    nombre: form.nombre,
                    segundoNombre: form.segundoNombre || null,
                    apellido: form.apellido,
                    fechaExpedicionDocumento: form.fechaExpedicionDocumento || null,
                    ciudadExpedicionDocumento: form.ciudadExpedicionDocumento || null,
                    eps: form.eps || null,
                    telefono: form.telefono || null,
                    categoriaLicencia: form.categoriaLicencia || null,
                    vencimientoLicencia: form.vencimientoLicencia || null,
                    role: form.role,
                    password: form.password,
                });

                userId = created.id;
                setCreatedUserId(created.id);
            }

            await saveDocuments(userId);
            setSuccess("Usuario y documentos registrados correctamente.");
            setForm(initialForm);
            setDocuments(initialDocuments());
            setCreatedUserId(null);
            uploadedTypes.current.clear();
        } catch (reason) {
            const fallback = createdUserId
                ? "El usuario ya fue creado, pero falta completar la carga de documentos. Intenta nuevamente."
                : "No fue posible crear el usuario.";
            setError(reason instanceof Error ? reason.message : fallback);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-dvh bg-gray-50">
            <SupervisorSidebar
                name={currentUser?.nombre ?? "Supervisor"}
                active="usuarios"
            />

            <main className="px-4 py-6 md:ml-64 md:px-8 lg:px-10">
                <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50">
                            <img src={userAddIcon} alt="" className="h-7 w-7" />
                        </span>
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wider text-amber-500">
                                Gestión de usuarios
                            </p>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Crear usuario
                            </h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Registra la información y documentación del usuario.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => navigate("/supervisor")}
                        className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600"
                    >
                        Volver al panel
                    </button>
                </header>

                {error && (
                    <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                        {error}
                    </p>
                )}
                {success && (
                    <p role="status" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                        {success}
                    </p>
                )}

                <form onSubmit={(event) => void submit(event)} className="mt-6 space-y-6">
                    <FormSection title="Información personal">
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            <Field label="Apellidos" required value={form.apellido} onChange={(value) => update("apellido", value)} />
                            <Field label="Primer nombre" required value={form.nombre} onChange={(value) => update("nombre", value)} />
                            <Field label="Segundo nombre" value={form.segundoNombre} onChange={(value) => update("segundoNombre", value)} />
                            <Field label="Cédula" required inputMode="numeric" value={form.cedula} onChange={(value) => update("cedula", value.replace(/\D/g, ""))} />
                            <Field label="Fecha de expedición" type="date" value={form.fechaExpedicionDocumento} onChange={(value) => update("fechaExpedicionDocumento", value)} />
                            <Field label="Ciudad de expedición" value={form.ciudadExpedicionDocumento} onChange={(value) => update("ciudadExpedicionDocumento", value)} />
                            <Field label="EPS" value={form.eps} onChange={(value) => update("eps", value)} />
                            <Field label="Celular personal" type="tel" inputMode="tel" value={form.telefono} onChange={(value) => update("telefono", value)} />
                        </div>
                    </FormSection>

                    <FormSection title="Información laboral y acceso">
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            <label className="text-sm font-medium text-gray-700">
                                Rol <span className="text-red-500">*</span>
                                <select value={form.role} onChange={(event) => update("role", event.target.value as SupervisorUserRole)} className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-3 outline-none focus:border-amber-400">
                                    <option value="Conductor">Conductor</option>
                                    <option value="Supervisor">Supervisor</option>
                                    {currentUser?.role === "Administrador" && <option value="Administrador">Administrador</option>}
                                </select>
                            </label>
                            <Field label="Categoría de licencia" value={form.categoriaLicencia} placeholder="Ej. C2" onChange={(value) => update("categoriaLicencia", value)} />
                            <Field label="Vencimiento de licencia" type="date" value={form.vencimientoLicencia} onChange={(value) => update("vencimientoLicencia", value)} />
                            <Field label="Contraseña inicial" required type="password" value={form.password} placeholder="Mínimo 8 caracteres" onChange={(value) => update("password", value)} />
                            <label className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 md:col-span-2">
                                <input type="checkbox" checked={form.requiereManipulacionAlimentos} onChange={(event) => update("requiereManipulacionAlimentos", event.target.checked)} className="h-4 w-4 accent-amber-400" />
                                El conductor requiere manipulación de alimentos
                            </label>
                        </div>
                    </FormSection>

                    <FormSection title="Documentos">
                        <div className="grid gap-4 xl:grid-cols-2">
                            <SupervisorDocumentField label="Foto" value={documents.Foto} onChange={(value) => updateDocument("Foto", value)} />
                            <SupervisorDocumentField label="Licencia de conducción" value={documents.Licencia_conduccion} onChange={(value) => updateDocument("Licencia_conduccion", value)} />
                            <SupervisorDocumentField label="Cédula" value={documents.Cedula} onChange={(value) => updateDocument("Cedula", value)} />
                            {form.requiereManipulacionAlimentos && (
                                <SupervisorDocumentField label="Certificado de manipulación de alimentos" value={documents.Certificado_manipulacion_alimentos} onChange={(value) => updateDocument("Certificado_manipulacion_alimentos", value)} required />
                            )}
                        </div>
                    </FormSection>

                    <div className="flex justify-end rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <button type="submit" disabled={!canSave || isSaving} className="w-full rounded-xl bg-amber-400 px-8 py-3 text-sm font-bold text-gray-900 hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">
                            {isSaving ? "Guardando usuario..." : "Crear usuario"}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}

function FormSection({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-base font-bold text-gray-900">{title}</h2>
            {children}
        </section>
    );
}

interface FieldProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: string;
    inputMode?: "text" | "tel" | "numeric";
    placeholder?: string;
    required?: boolean;
}

function Field({ label, value, onChange, type = "text", inputMode = "text", placeholder, required = false }: FieldProps) {
    return (
        <label className="text-sm font-medium text-gray-700">
            {label} {required && <span className="text-red-500">*</span>}
            <input type={type} inputMode={inputMode} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required={required} className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-3 outline-none focus:border-amber-400" />
        </label>
    );
}
