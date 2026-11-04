const API = (import.meta.env.VITE_API_URL ?? "http://localhost:3000").replace(/\/+$/, "");

async function remove(path: string): Promise<void> {
    const response = await fetch(`${API}/supervisor/${path}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token") ?? ""}` },
    });
    if (!response.ok) {
        const body = await response.json().catch(() => null) as { message?: string } | null;
        throw new Error(body?.message ?? "No fue posible eliminar el registro. Vuelve a intentarlo.");
    }
}

export const deletionService = {
    userDocument: (id: number, documentId: number) => remove(`users/${id}/documents/${documentId}`),
    legalRecord: (id: number, kind: "insurance" | "technical-inspections", recordId: number) =>
        remove(`vehicles/${id}/${kind}/${recordId}`),
};
