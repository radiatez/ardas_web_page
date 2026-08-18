import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import { CV_MIME_TYPE } from "./validation";

export interface ProtectedCvObject {
  bytes: Uint8Array;
  contentType: typeof CV_MIME_TYPE;
}

export interface CvObjectStorage {
  putQuarantine(key: string, bytes: Uint8Array): Promise<void>;
  promoteToProtected(key: string): Promise<void>;
  readProtected(key: string): Promise<ProtectedCvObject>;
  deleteQuarantine(key: string): Promise<void>;
  deleteProtected(key: string): Promise<void>;
  requeueQuarantine(oldKey: string, newKey: string): Promise<void>;
}

export interface S3CvStorageConfiguration {
  region: string;
  quarantineBucket: string;
  protectedBucket: string;
}

function copySource(bucket: string, key: string): string {
  return `${encodeURIComponent(bucket)}/${key
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/")}`;
}

export class S3CvObjectStorage implements CvObjectStorage {
  private readonly client: S3Client;

  constructor(private readonly configuration: S3CvStorageConfiguration) {
    this.client = new S3Client({ region: configuration.region });
  }

  static fromEnvironment(): S3CvObjectStorage {
    const region = process.env.AWS_REGION;
    const quarantineBucket = process.env.S3_QUARANTINE_BUCKET;
    const protectedBucket = process.env.S3_PROTECTED_BUCKET;
    if (!region || !quarantineBucket || !protectedBucket) {
      throw new Error("AWS_REGION and protected/quarantine S3 buckets are required.");
    }
    return new S3CvObjectStorage({ region, quarantineBucket, protectedBucket });
  }

  async putQuarantine(key: string, bytes: Uint8Array): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.configuration.quarantineBucket,
        Key: key,
        Body: bytes,
        ContentType: CV_MIME_TYPE,
        ServerSideEncryption: "AES256",
        Tagging: "workload=cv",
      }),
    );
  }

  async promoteToProtected(key: string): Promise<void> {
    await this.client.send(
      new CopyObjectCommand({
        Bucket: this.configuration.protectedBucket,
        Key: key,
        CopySource: copySource(this.configuration.quarantineBucket, key),
        ContentType: CV_MIME_TYPE,
        MetadataDirective: "REPLACE",
        ServerSideEncryption: "AES256",
      }),
    );
    await this.deleteQuarantine(key);
  }

  async readProtected(key: string): Promise<ProtectedCvObject> {
    const result = await this.client.send(
      new GetObjectCommand({
        Bucket: this.configuration.protectedBucket,
        Key: key,
      }),
    );
    if (!result.Body) {
      throw new Error("Protected CV object body is unavailable.");
    }
    return {
      bytes: await result.Body.transformToByteArray(),
      contentType: CV_MIME_TYPE,
    };
  }

  async deleteQuarantine(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.configuration.quarantineBucket,
        Key: key,
      }),
    );
  }

  async deleteProtected(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.configuration.protectedBucket,
        Key: key,
      }),
    );
  }

  async requeueQuarantine(oldKey: string, newKey: string): Promise<void> {
    await this.client.send(
      new CopyObjectCommand({
        Bucket: this.configuration.quarantineBucket,
        Key: newKey,
        CopySource: copySource(this.configuration.quarantineBucket, oldKey),
        ContentType: CV_MIME_TYPE,
        MetadataDirective: "REPLACE",
        ServerSideEncryption: "AES256",
        Tagging: "workload=cv",
        TaggingDirective: "REPLACE",
      }),
    );
    await this.deleteQuarantine(oldKey);
  }
}
