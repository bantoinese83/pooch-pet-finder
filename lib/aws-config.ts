import { serverEnv } from "./env"
import { S3Client } from "@aws-sdk/client-s3"
import { RekognitionClient } from "@aws-sdk/client-rekognition"

// Initialize AWS clients
export const s3Client = new S3Client({
  region: serverEnv.AWS_REGION,
  credentials: {
    accessKeyId: serverEnv.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: serverEnv.AWS_SECRET_ACCESS_KEY || "",
  },
})

export const rekognitionClient = new RekognitionClient({
  region: serverEnv.AWS_REGION,
  credentials: {
    accessKeyId: serverEnv.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: serverEnv.AWS_SECRET_ACCESS_KEY || "",
  },
})

export const S3_BUCKET_NAME = serverEnv.AWS_S3_BUCKET_NAME
