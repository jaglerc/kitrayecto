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
const MIN_IMAGE_QUALITY = 0.5;

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
    const scale = Math.min(
        1,
        MAX_IMAGE_DIMENSION / Math.max(bitmap.width, bitmap.height)
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);

    const context = canvas.getContext("2d");
    if (!context) {
        bitmap.close();
        throw new Error("El navegador no permite procesar la imagen");
    }

    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    let quality = 0.82;
    let blob = await canvasToBlob(canvas, quality);

    while (blob.size > MAX_FILE_SIZE && quality > MIN_IMAGE_QUALITY) {
        quality = Math.max(MIN_IMAGE_QUALITY, quality - 0.08);
        blob = await canvasToBlob(canvas, quality);
    }

    if (blob.size > MAX_FILE_SIZE) {
        throw new Error("No fue posible reducir la imagen a menos de 2.5 MB");
    }

    return new File(
        [blob],
        `${crypto.randomUUID()}.webp`,
        { type: "image/webp" }
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
    async uploadImage(
        originalFile: File,
        module: StorageModule,
        referenceId: number
    ): Promise<ConfirmedUpload> {
        const file = await compressImage(originalFile);
        const authorization = await requestUploadUrl(file, module, referenceId);

        const uploadResponse = await fetch(authorization.uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": file.type },
            body: file,
        });

        if (!uploadResponse.ok) {
            throw new Error("S3 no pudo almacenar la imagen");
        }

        return confirmUpload(
            authorization.objectKey,
            module,
            referenceId
        );
    },
};
