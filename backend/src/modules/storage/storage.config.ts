import { S3Client } from "@aws-sdk/client-s3";

const region = process.env.AWS_REGION;
const bucketName = process.env.S3_BUCKET_NAME;
const uploadPrefix = process.env.S3_UPLOAD_PREFIX ?? "archivos";

if (!region || !bucketName) {
    throw new Error(
        "Debes configurar AWS_REGION y S3_BUCKET_NAME"
    );
}

export const s3Client = new S3Client({ region });

export const storageConfig = {
    bucketName,
    uploadPrefix: uploadPrefix.replace(/^\/+|\/+$/g, ""),
};
