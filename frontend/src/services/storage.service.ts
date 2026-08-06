export type StorageModule =
    | "inspecciones"
    | "novedades"
    | "accidentes"
    | "combustible"
    | "usuarios"
    | "vehiculos";

export interface ConfirmedUpload {
    objectKey: string;
    contentType: string;
    size: number;
}

interface UploadUrlResponse {
    uploadUrl: string;
    objectKey: string;
    expiresIn: number;
}

const API_URL = (
    import.meta.env.VITE_API_URL ?? "http://localhost:3000"
).replace(/\/+$/, "");

const MAX_FILE_SIZE = 2.5 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 1920;
const MIN_IMAGE_DIMENSION = 1280;
const IMAGE_DIMENSION_REDUCTION = 0.85;
const IMAGE_QUALITIES = [0.82, 0.74, 0.66, 0.6, 0.55];

const getToken = () => localStorage.getItem("token");

const getErrorMessage = async (
    response: Response,
    fallback: string
): Promise<string> => {
    try {
        const body = await response.json() as { message?: string };
        return body.message ?? fallback;
    } catch {
        return fallback;
    }
};

const canvasToBlob = (
    canvas: HTMLCanvasElement,
    quality: number
): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (blob) resolve(blob);
                else reject(new Error("No fue posible comprimir la imagen"));
            },
            "image/webp",
            quality
        );
    });
};

export const compressImage = async (file: File): Promise<File> => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        throw new Error("Selecciona una imagen JPEG, PNG o WebP");
    }

    const bitmap = await createImageBitmap(file);
    const originalMaxDimension = Math.max(bitmap.width, bitmap.height);
    const minimumTargetDimension = Math.min(
        MIN_IMAGE_DIMENSION,
        originalMaxDimension
    );
    let targetDimension = Math.min(
        MAX_IMAGE_DIMENSION,
        originalMaxDimension
    );

    try {
        while (targetDimension >= minimumTargetDimension) {
            const scale = targetDimension / originalMaxDimension;
            const canvas = document.createElement("canvas");
            canvas.width = Math.max(1, Math.round(bitmap.width * scale));
            canvas.height = Math.max(1, Math.round(bitmap.height * scale));

            const context = canvas.getContext("2d");
            if (!context) {
                throw new Error("El navegador no permite procesar la imagen");
            }

            context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

            for (const quality of IMAGE_QUALITIES) {
                const blob = await canvasToBlob(canvas, quality);

                if (blob.size <= MAX_FILE_SIZE) {
                    return new File(
                        [blob],
                        `${crypto.randomUUID()}.webp`,
                        { type: "image/webp" }
                    );
                }
            }

            if (targetDimension === minimumTargetDimension) break;

            targetDimension = Math.max(
                minimumTargetDimension,
                Math.floor(targetDimension * IMAGE_DIMENSION_REDUCTION)
            );
        }
    } finally {
        bitmap.close();
    }

    throw new Error(
        "No fue posible preparar la imagen. Intenta tomarla más cerca del daño."
    );
};

const requestUploadUrl = async (
    file: File,
    module: StorageModule,
    referenceId: number
): Promise<UploadUrlResponse> => {
    const token = getToken();
    const response = await fetch(`${API_URL}/storage/upload-url`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
            module,
            referenceId,
            contentType: file.type,
            size: file.size,
        }),
    });

    if (!response.ok) {
        throw new Error(await getErrorMessage(response, "No fue posible autorizar la carga"));
    }

    return response.json();
};

const confirmUpload = async (
    objectKey: string,
    module: StorageModule,
    referenceId: number
): Promise<ConfirmedUpload> => {
    const token = getToken();
    const response = await fetch(`${API_URL}/storage/confirm-upload`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ module, referenceId, objectKey }),
    });

    if (!response.ok) {
        throw new Error(await getErrorMessage(response, "No fue posible verificar la carga"));
    }

    return response.json();
};

export const storageService = {
    async uploadFile(
        originalFile: File,
        module: StorageModule,
        referenceId: number
    ): Promise<ConfirmedUpload> {
        const isImage = ["image/jpeg", "image/png", "image/webp"].includes(
            originalFile.type
        );
        const isPdf = originalFile.type === "application/pdf";

        if (!isImage && !isPdf) {
            throw new Error("Selecciona una imagen JPEG, PNG, WebP o un PDF");
        }

        const file = isImage ? await compressImage(originalFile) : originalFile;

        if (file.size > MAX_FILE_SIZE) {
            throw new Error("El archivo no puede superar 2.5 MB");
        }

        const authorization = await requestUploadUrl(file, module, referenceId);
        const uploadResponse = await fetch(authorization.uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": file.type },
            body: file,
        });

        if (!uploadResponse.ok) {
            throw new Error("S3 no pudo almacenar el archivo");
        }

        return confirmUpload(
            authorization.objectKey,
            module,
            referenceId
        );
    },

    async uploadImage(
        originalFile: File,
        module: StorageModule,
        referenceId: number
    ): Promise<ConfirmedUpload> {
        return this.uploadFile(originalFile, module, referenceId);
    },
};
