import { SupervisorCostsRepository } from "./supervisor-costs.repository.js";
import type {
    SupervisorCostsQuery,
    SupervisorCostsResult,
} from "./supervisor-costs.types.js";

export class SupervisorCostsValidationError extends Error {}

export class SupervisorCostsService {
    static async find(query: SupervisorCostsQuery): Promise<SupervisorCostsResult> {
        if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(query.month)) {
            throw new SupervisorCostsValidationError("El mes consultado no es válido");
        }
        if (query.vehicleId !== null && (!Number.isInteger(query.vehicleId) || query.vehicleId <= 0)) {
            throw new SupervisorCostsValidationError("El vehículo seleccionado no es válido");
        }

        const result = await SupervisorCostsRepository.find(query);
        const totals = result.expenses.reduce(
            (current, expense) => {
                if (expense.category === "Combustible") current.fuel += expense.amount;
                else current.maintenance += expense.amount;

                current.total += expense.amount;
                current.records += 1;
                return current;
            },
            { fuel: 0, maintenance: 0, total: 0, records: 0 }
        );

        return {
            month: query.month,
            vehicleId: query.vehicleId,
            totals,
            expenses: result.expenses,
            vehicles: result.documents.map(({ vehicleId, plate }) => ({ id: vehicleId, plate })),
            documents: result.documents,
        };
    }
}
