import { useState } from "react";
import type { InspectionDetail } from "../../services/inspection.service";

type DetailAnswer = InspectionDetail["answers"][number];
interface ChecklistDetailItemProps { answer: DetailAnswer; index: number; }
const isCritical = (status: string) => status.toLowerCase().includes("cr");

export default function ChecklistDetailItem({ answer, index }: ChecklistDetailItemProps) {
    const [isOpen, setIsOpen] = useState(index < 3);
    const color = isCritical(answer.status) ? "red" : answer.status === "Con novedad" ? "amber" : "green";
    const badgeClass = color === "red" ? "bg-red-50 text-red-700" : color === "amber" ? "bg-amber-50 text-amber-700" : "bg-green-50 text-green-700";
    const iconClass = color === "red" ? "border-red-500 text-red-500" : color === "amber" ? "border-amber-500 text-amber-500" : "border-green-500 text-green-600";
    return (
        <article className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <button type="button" onClick={() => setIsOpen((current) => !current)} aria-expanded={isOpen} className="flex w-full items-center gap-2 p-3 text-left">
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${iconClass}`}>✓</span>
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-700">{index + 1}</span>
                <span className="min-w-0 flex-1"><span className="block text-xs font-semibold text-gray-900">{answer.title}</span><span className="mt-0.5 block text-[10px] leading-4 text-gray-500">{answer.description}</span></span>
                <span className={`shrink-0 rounded px-2 py-1 text-[9px] font-medium ${badgeClass}`}>{answer.status}</span>
                <span aria-hidden="true" className="text-gray-500">{isOpen ? "⌃" : "⌄"}</span>
            </button>
            {isOpen && <div className="mx-3 mb-3 rounded-lg border border-gray-100 bg-gray-50 p-3"><p className="text-[10px] font-semibold text-gray-700">Resultado registrado</p><p className={`mt-1 text-[10px] font-medium ${color === "red" ? "text-red-600" : color === "amber" ? "text-amber-600" : "text-green-600"}`}>{answer.observation?.trim() || "Sin novedades registradas."}</p></div>}
        </article>
    );
}
