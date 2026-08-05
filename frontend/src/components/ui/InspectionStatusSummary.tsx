import type { InspectionStatus } from "../../services/inspection.service";

interface InspectionStatusSummaryProps { statuses: InspectionStatus[]; }
const isCritical = (status: string) => status.toLowerCase().includes("cr");

export default function InspectionStatusSummary({ statuses }: InspectionStatusSummaryProps) {
    const withoutIssues = statuses.filter((status) => status === "Sin novedad").length;
    const withIssues = statuses.filter((status) => status === "Con novedad").length;
    const critical = statuses.filter(isCritical).length;
    return (
        <section className="grid grid-cols-3 divide-x divide-gray-100 rounded-xl border border-gray-200 bg-white py-3 shadow-sm">
            <div className="text-center"><p className="text-xl font-bold text-green-600">✓ {withoutIssues}</p><p className="text-[10px] text-gray-500">Sin novedad</p></div>
            <div className="text-center"><p className="text-xl font-bold text-amber-500">! {withIssues}</p><p className="text-[10px] text-gray-500">Con novedad</p></div>
            <div className="text-center"><p className="text-xl font-bold text-red-500">△ {critical}</p><p className="text-[10px] text-gray-500">Crítica</p></div>
        </section>
    );
}
