import { StorageService } from "../storage/storage.service.js";
import { ConsultationsRepository } from "./consultations.repository.js";
import type { ConsultationCategory, ConsultationDetail, ConsultationListItem } from "./consultations.types.js";

export class ConsultationValidationError extends Error {}
export class ConsultationNotFoundError extends Error {}
const categories: ConsultationCategory[] = ["trips", "fuel", "maintenance", "accidents", "inspections", "incidents"];
export class ConsultationsService {
    static parseCategory(value: string): ConsultationCategory { if (!categories.includes(value as ConsultationCategory)) throw new ConsultationValidationError("La categoría no es válida"); return value as ConsultationCategory; }
    static findAll(conductorId: number, categoryValue: string): Promise<ConsultationListItem[]> { return ConsultationsRepository.findAll(conductorId, this.parseCategory(categoryValue)); }
    static async findById(conductorId: number, categoryValue: string, id: number): Promise<ConsultationDetail> { if (!Number.isInteger(id) || id <= 0) throw new ConsultationValidationError("El registro no es válido"); const detail = await ConsultationsRepository.findById(conductorId, this.parseCategory(categoryValue), id); if (!detail) throw new ConsultationNotFoundError("El registro no existe"); return { ...detail, evidences: await Promise.all(detail.evidences.map(async (evidence) => ({ ...evidence, url: await StorageService.createDownloadUrl(evidence.objectKey) }))) }; }
}
