import { useEffect, useState } from "react";

import SupervisorSidebar from "../components/supervisor/SupervisorSidebar";
import type {
    CostDocument,
    SupervisorCostsResult,
    SupervisorExpense,
    VehicleCostDocuments,
} from "../services/supervisor-costs.service";
import { supervisorCostsService } from "../services/supervisor-costs.service";

const currency = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
});

const getCurrentMonth = (): string => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const dateLabel = (value: string | null): string => {
    if (!value) return "Sin fecha registrada";
    const [year, month, day] = value.slice(0, 10).split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleDateString("es-CO", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
};

const getSupervisorName = (): string => {
    try {
        const user = JSON.parse(localStorage.getItem("user") ?? "null") as { nombre?: string } | null;
        return user?.nombre ?? "Supervisor";
    } catch {
        return "Supervisor";
    }
};

export default function SupervisorCostsPage() {
    const [month, setMonth] = useState(getCurrentMonth);
    const [vehicleId, setVehicleId] = useState<number | null>(null);
    const [data, setData] = useState<SupervisorCostsResult | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        void supervisorCostsService.find(month, vehicleId)
            .then((result) => {
                if (isMounted) {
                    setData(result);
                    setError(null);
                }
            })
            .catch((requestError: unknown) => {
                if (isMounted) {
                    setError(requestError instanceof Error
                        ? requestError.message
                        : "No fue posible consultar los costos");
                }
            })
            .finally(() => {
                if (isMounted) setIsLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [month, vehicleId]);

    const updateMonth = (value: string) => {
        if (!value) return;
        setIsLoading(true);
        setError(null);
        setMonth(value);
    };

    const updateVehicle = (value: string) => {
        setIsLoading(true);
        setError(null);
        setVehicleId(value ? Number(value) : null);
    };

    const documents = data?.documents.filter((vehicle) => (
        vehicleId === null || vehicle.vehicleId === vehicleId
    )) ?? [];

    return (
        <div className="min-h-dvh bg-gray-50">
            <SupervisorSidebar name={getSupervisorName()} active="costos" />

            <main className="mx-auto max-w-7xl px-4 py-6 md:ml-64 md:px-8 lg:px-10">
                <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-amber-600">
                            Administración
                        </p>
                        <h1 className="mt-1 text-2xl font-bold text-gray-900 md:text-3xl">
                            Costos
                        </h1>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">
                            Consulta los gastos operativos del mes y los costos de los documentos vehiculares.
                        </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 sm:min-w-80">
                        <label className="text-xs font-semibold text-gray-600">
                            Mes de gastos
                            <input
                                type="month"
                                value={month}
                                onChange={(event) => updateMonth(event.target.value)}
                                className="mt-1.5 min-h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none focus:border-amber-400"
                            />
                        </label>
                        <label className="text-xs font-semibold text-gray-600">
                            Vehículo
                            <select
                                value={vehicleId ?? ""}
                                onChange={(event) => updateVehicle(event.target.value)}
                                className="mt-1.5 min-h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none focus:border-amber-400"
                            >
                                <option value="">Toda la flota</option>
                                {data?.vehicles.map((vehicle) => (
                                    <option key={vehicle.id} value={vehicle.id}>{vehicle.plate}</option>
                                ))}
                            </select>
                        </label>
                    </div>
                </header>

                {error && (
                    <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        <p>{error}</p>
                        {error.includes("mantenimientos_vehiculo") && (
                            <p className="mt-1">La base de datos debe tener creada la tabla de mantenimientos antes de consultar estos costos.</p>
                        )}
                    </div>
                )}

                <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Resumen de gastos mensuales">
                    <SummaryCard label="Gasto mensual" value={currency.format(data?.totals.total ?? 0)} accent />
                    <SummaryCard label="Combustible" value={currency.format(data?.totals.fuel ?? 0)} />
                    <SummaryCard label="Mantenimientos" value={currency.format(data?.totals.maintenance ?? 0)} />
                    <SummaryCard label="Movimientos" value={String(data?.totals.records ?? 0)} />
                </section>

                <section className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-4 py-4 sm:px-5">
                        <div>
                            <h2 className="font-bold text-gray-900">Detalle de gastos</h2>
                            <p className="mt-1 text-xs text-gray-500">Incluye combustible registrado y mantenimientos realizados durante el mes.</p>
                        </div>
                        {data && <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">{data.expenses.length} movimientos</span>}
                    </div>

                    {isLoading ? (
                        <p className="px-4 py-12 text-center text-sm text-gray-500">Consultando movimientos…</p>
                    ) : !data || data.expenses.length === 0 ? (
                        <p className="px-4 py-12 text-center text-sm text-gray-500">No hay gastos registrados para los filtros seleccionados.</p>
                    ) : (
                        <ExpenseList expenses={data.expenses} />
                    )}
                </section>

                <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
                    <div>
                        <h2 className="font-bold text-gray-900">Documentos vehiculares</h2>
                        <p className="mt-1 text-xs leading-relaxed text-gray-500">
                            SOAT y revisión técnico-mecánica se muestran por separado y no se suman al gasto mensual.
                        </p>
                    </div>

                    {isLoading ? (
                        <p className="py-10 text-center text-sm text-gray-500">Consultando documentos…</p>
                    ) : documents.length === 0 ? (
                        <p className="py-10 text-center text-sm text-gray-500">No hay documentos para el vehículo seleccionado.</p>
                    ) : (
                        <div className="mt-4 grid gap-4 xl:grid-cols-2">
                            <DocumentGroup
                                title="SOAT"
                                emptyText="Sin SOAT registrado"
                                documents={documents}
                                pick={(vehicle) => vehicle.soat}
                            />
                            <DocumentGroup
                                title="Revisión técnico-mecánica"
                                emptyText="Sin revisión registrada"
                                documents={documents}
                                pick={(vehicle) => vehicle.technicalInspection}
                            />
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}

interface SummaryCardProps {
    label: string;
    value: string;
    accent?: boolean;
}

function SummaryCard({ label, value, accent = false }: SummaryCardProps) {
    return (
        <article className={`rounded-2xl border p-4 shadow-sm ${accent ? "border-amber-300 bg-amber-50" : "border-gray-200 bg-white"}`}>
            <p className="text-xs font-medium text-gray-500">{label}</p>
            <p className="mt-2 break-words text-xl font-bold text-gray-900">{value}</p>
        </article>
    );
}

function ExpenseList({ expenses }: { expenses: SupervisorExpense[] }) {
    return (
        <>
            <div className="divide-y divide-gray-100 sm:hidden">
                {expenses.map((expense) => (
                    <ExpenseCard key={expense.id} expense={expense} />
                ))}
            </div>
            <div className="hidden overflow-x-auto sm:block">
                <table className="w-full min-w-[680px] text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                        <tr>
                            <th className="px-5 py-3 font-semibold">Fecha</th>
                            <th className="px-5 py-3 font-semibold">Vehículo</th>
                            <th className="px-5 py-3 font-semibold">Categoría</th>
                            <th className="px-5 py-3 font-semibold">Detalle</th>
                            <th className="px-5 py-3 text-right font-semibold">Costo</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {expenses.map((expense) => (
                            <tr key={expense.id} className="align-top">
                                <td className="whitespace-nowrap px-5 py-4 text-gray-600">{dateLabel(expense.occurredAt)}</td>
                                <td className="whitespace-nowrap px-5 py-4 font-semibold text-gray-800">{expense.plate}</td>
                                <td className="px-5 py-4"><ExpenseBadge category={expense.category} /></td>
                                <td className="max-w-md px-5 py-4 text-gray-600">{expense.description}</td>
                                <td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-gray-900">{currency.format(expense.amount)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}

function ExpenseCard({ expense }: { expense: SupervisorExpense }) {
    return (
        <article className="space-y-2 p-4">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{expense.plate}</p>
                    <p className="mt-0.5 text-xs text-gray-500">{dateLabel(expense.occurredAt)}</p>
                </div>
                <p className="shrink-0 text-sm font-bold text-gray-900">{currency.format(expense.amount)}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <ExpenseBadge category={expense.category} />
                <p className="min-w-0 flex-1 text-xs leading-relaxed text-gray-600">{expense.description}</p>
            </div>
        </article>
    );
}

function ExpenseBadge({ category }: { category: SupervisorExpense["category"] }) {
    return (
        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${category === "Combustible" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-800"}`}>
            {category}
        </span>
    );
}

interface DocumentGroupProps {
    title: string;
    emptyText: string;
    documents: VehicleCostDocuments[];
    pick: (vehicle: VehicleCostDocuments) => CostDocument | null;
}

function DocumentGroup({ title, emptyText, documents, pick }: DocumentGroupProps) {
    const entries = documents.flatMap((vehicle) => {
        const document = pick(vehicle);
        return document ? [{ vehicle, document }] : [];
    });

    return (
        <section className="rounded-xl border border-gray-100 bg-gray-50/70 p-3 sm:p-4">
            <h3 className="text-sm font-bold text-gray-800">{title}</h3>
            {entries.length === 0 ? (
                <p className="py-6 text-center text-xs text-gray-500">{emptyText}</p>
            ) : (
                <ul className="mt-2 divide-y divide-gray-200">
                    {entries.map(({ vehicle, document }) => (
                        <li key={vehicle.vehicleId} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-900">{vehicle.plate}</p>
                                <p className="mt-0.5 text-xs text-gray-500">Vigencia hasta {dateLabel(document.expiresAt)}</p>
                                <p className="text-[11px] text-gray-400">N.º {document.number}</p>
                            </div>
                            <p className="text-sm font-semibold text-gray-800 sm:text-right">
                                {document.amount === null ? "Sin costo registrado" : currency.format(document.amount)}
                            </p>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
