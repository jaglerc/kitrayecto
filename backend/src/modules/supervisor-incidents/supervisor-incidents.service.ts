import { StorageService } from "../storage/storage.service.js";
import { SupervisorIncidentsRepository } from "./supervisor-incidents.repository.js";
import type { SupervisorIncidentList } from "./supervisor-incidents.types.js";

export class SupervisorIncidentsService {
    static async findMany(page: number, pageSize: number, search: string): Promise<SupervisorIncidentList> {
        const result = await SupervisorIncidentsRepository.findMany(page, pageSize, search);
        result.items = await Promise.all(result.items.map(async (incident) => ({
            ...incident,
            evidences: await Promise.all(incident.evidences.map(async (evidence) => ({
                ...evidence,
                downloadUrl: await StorageService.createDownloadUrl(evidence.objectKey),
            }))),
        })));
        return result;
    }
}
