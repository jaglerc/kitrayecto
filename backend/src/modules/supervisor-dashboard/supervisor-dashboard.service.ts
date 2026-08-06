import { SupervisorDashboardRepository } from "./supervisor-dashboard.repository.js";
import type { SupervisorDashboard } from "./supervisor-dashboard.types.js";
export class SupervisorDashboardService { static find(): Promise<SupervisorDashboard> { return SupervisorDashboardRepository.find(); } }
