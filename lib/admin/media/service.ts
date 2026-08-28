import "server-only";

import { createHash } from "node:crypto";
import {
  getMediaStorageProviderState,
  mediaUploadSessionSchema,
  mediaUploadIntentRequestSchema,
  type MediaUploadIntentRequest,
} from "./foundation";

export type DirectUploadIntentResult = {
  accepted: false;
  uploadMethod: "direct";
  bytesAcceptedByApplication: false;
  errorCategory: "storage-not-configured";
  session: ReturnType<typeof mediaUploadSessionSchema.parse>;
};

export function createDirectUploadIntent(input: MediaUploadIntentRequest): DirectUploadIntentResult {
  mediaUploadIntentRequestSchema.parse(input);
  const storage = getMediaStorageProviderState();
  const fingerprint = createHash("sha256").update(input.idempotencyKey).digest("hex").slice(0, 24);

  // ponytail: no provider adapter exists until a provider is selected and approved.
  if (!storage.directUploadAvailable) {
    return {
      accepted: false,
      uploadMethod: "direct",
      bytesAcceptedByApplication: false,
      errorCategory: "storage-not-configured",
      session: mediaUploadSessionSchema.parse({
        id: `blocked-upload-${fingerprint}`,
        assetId: `pending-asset-${fingerprint}`,
        uploadMethod: "direct",
        provider: null,
        status: "blocked",
        idempotencyKey: input.idempotencyKey,
        errorCategory: "storage-not-configured",
      }),
    };
  }

  throw new Error("MEDIA_STORAGE_ADAPTER_NOT_IMPLEMENTED");
}
