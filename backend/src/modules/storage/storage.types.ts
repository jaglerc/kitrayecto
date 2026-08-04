export const storageModules = [
    "inspecciones",
    "novedades",
    "accidentes",
    "combustible",
    "usuarios",
    "vehiculos",
] as const;

export type StorageModule = typeof storageModules[number];

export const allowedContentTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
] as const;

export type AllowedContentType = typeof allowedContentTypes[number];

export interface CreateUploadUrlInput {
    module: StorageModule;
    referenceId: number;
    userId: number;
    contentType: AllowedContentType;
    size: number;
}

export interface UploadUrlResponse {
    uploadUrl: string;
    objectKey: string;
    expiresIn: number;
}

export interface ConfirmUploadInput {
    module: StorageModule;
    referenceId: number;
    userId: number;
    objectKey: string;
}

export interface ConfirmedUploadResponse {
    objectKey: string;
    contentType: AllowedContentType;
    size: number;
}
