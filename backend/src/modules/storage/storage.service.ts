import { randomUUID } from "node:crypto";

import {
    DeleteObjectCommand,
    GetObjectCommand,
    HeadObjectCommand,
    PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { s3Client, storageConfig } from "./storage.config.js";
import type {
    AllowedContentType,
    ConfirmedUploadResponse,
    ConfirmUploadInput,
    CreateUploadUrlInput,
    UploadUrlResponse,
} from "./storage.types.js";

const MAX_IMAGE_FILE_SIZE = 2.5 * 1024 * 1024;
const MAX_PDF_FILE_SIZE = 10 * 1024 * 1024;
const UPLOAD_URL_EXPIRATION_SECONDS = 300;

const extensionsByContentType: Record<AllowedContentType, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "application/pdf": "pdf",
};

const isAllowedContentType = (
    value: string | undefined
): value is AllowedContentType => {
    return Boolean(value && value in extensionsByContentType);
};

const maximumSizeFor = (contentType: AllowedContentType): number => {
    return contentType === "application/pdf"
        ? MAX_PDF_FILE_SIZE
        : MAX_IMAGE_FILE_SIZE;
};

export class StorageValidationError extends Error {}

export class StorageService {
    static async createDownloadUrl(objectKey: string): Promise<string> {
        if (!objectKey.startsWith(`${storageConfig.uploadPrefix}/`)) {
            throw new StorageValidationError("La ruta del archivo no es válida");
        }

        return getSignedUrl(
            s3Client,
            new GetObjectCommand({
                Bucket: storageConfig.bucketName,
                Key: objectKey,
            }),
            { expiresIn: UPLOAD_URL_EXPIRATION_SECONDS }
        );
    }

    static async createUploadUrl(
        input: CreateUploadUrlInput
    ): Promise<UploadUrlResponse> {
        if (!Number.isInteger(input.referenceId) || input.referenceId <= 0) {
            throw new StorageValidationError(
                "El identificador de referencia no es válido"
            );
        }

        if (!Number.isInteger(input.userId) || input.userId <= 0) {
            throw new StorageValidationError("El usuario no es válido");
        }

        if (!Number.isFinite(input.size) || input.size <= 0) {
            throw new StorageValidationError("El tamaño del archivo no es válido");
        }

        const maximumSize = maximumSizeFor(input.contentType);
        if (input.size > maximumSize) {
            throw new StorageValidationError(
                input.contentType === "application/pdf"
                    ? "El PDF no puede superar 10 MB"
                    : "La imagen no puede superar 2.5 MB"
            );
        }

        const extension = extensionsByContentType[input.contentType];
        const fileName = `${randomUUID()}.${extension}`;
        const objectKey = [
            storageConfig.uploadPrefix,
            input.module,
            input.referenceId,
            input.userId,
            fileName,
        ].join("/");

        const command = new PutObjectCommand({
            Bucket: storageConfig.bucketName,
            Key: objectKey,
            ContentType: input.contentType,
        });

        const uploadUrl = await getSignedUrl(s3Client, command, {
            expiresIn: UPLOAD_URL_EXPIRATION_SECONDS,
        });

        return {
            uploadUrl,
            objectKey,
            expiresIn: UPLOAD_URL_EXPIRATION_SECONDS,
        };
    }

    static async confirmUpload(
        input: ConfirmUploadInput
    ): Promise<ConfirmedUploadResponse> {
        const expectedPrefix = [
            storageConfig.uploadPrefix,
            input.module,
            input.referenceId,
            input.userId,
            "",
        ].join("/");

        if (!input.objectKey.startsWith(expectedPrefix)) {
            throw new StorageValidationError(
                "La ruta del archivo no pertenece al registro indicado"
            );
        }

        const metadata = await s3Client.send(
            new HeadObjectCommand({
                Bucket: storageConfig.bucketName,
                Key: input.objectKey,
            })
        );

        const contentType = metadata.ContentType;
        const size = metadata.ContentLength;
        const isValidContentType = isAllowedContentType(contentType);
        const isValid =
            isValidContentType &&
            typeof size === "number" &&
            size > 0 &&
            size <= maximumSizeFor(contentType);

        if (!isValid) {
            await this.deleteObject(input.objectKey);
            throw new StorageValidationError(
                "El archivo almacenado no cumple las reglas de tipo o tamaño"
            );
        }

        return {
            objectKey: input.objectKey,
            contentType,
            size,
        };
    }

    private static async deleteObject(objectKey: string): Promise<void> {
        await s3Client.send(
            new DeleteObjectCommand({
                Bucket: storageConfig.bucketName,
                Key: objectKey,
            })
        );
    }
}
