import {
  mediaUploadIntentRequestSchema,
  type MediaUploadIntentRequest,
} from "./foundation";

export const MAX_MEDIA_UPLOAD_INTENT_BODY_BYTES = 4_096;

export type MediaUploadIntentHttpValidation =
  | { ok: true; data: MediaUploadIntentRequest }
  | { ok: false; error: "unsupported-media-type" | "payload-too-large" | "invalid-input"; status: 400 | 413 | 415 };

export type MediaUploadIntentHeaderValidation =
  | { ok: true; contentLength: number }
  | { ok: false; error: "unsupported-media-type" | "payload-too-large"; status: 413 | 415 };

export function validateMediaUploadIntentHttpHeaders(input: {
  contentType: string | null;
  contentLength: string | null;
}): MediaUploadIntentHeaderValidation {
  const contentType = input.contentType?.split(";", 1)[0]?.trim().toLowerCase();
  if (contentType !== "application/json") {
    return { ok: false, error: "unsupported-media-type", status: 415 };
  }

  if (!input.contentLength || !/^[1-9]\d*$/.test(input.contentLength)) {
    return { ok: false, error: "payload-too-large", status: 413 };
  }
  const contentLength = Number(input.contentLength);
  if (!Number.isSafeInteger(contentLength) || contentLength < 2 || contentLength > MAX_MEDIA_UPLOAD_INTENT_BODY_BYTES) {
    return { ok: false, error: "payload-too-large", status: 413 };
  }
  return { ok: true, contentLength };
}

export function validateMediaUploadIntentHttpRequest(input: {
  contentType: string | null;
  contentLength: string | null;
  body: string;
}): MediaUploadIntentHttpValidation {
  const headers = validateMediaUploadIntentHttpHeaders(input);
  if (!headers.ok) return headers;

  const bodyByteLength = Buffer.byteLength(input.body, "utf8");
  if (bodyByteLength > MAX_MEDIA_UPLOAD_INTENT_BODY_BYTES) {
    return { ok: false, error: "payload-too-large", status: 413 };
  }
  if (bodyByteLength !== headers.contentLength) {
    return { ok: false, error: "invalid-input", status: 400 };
  }

  let value: unknown;
  try {
    value = JSON.parse(input.body);
  } catch {
    return { ok: false, error: "invalid-input", status: 400 };
  }
  const parsed = mediaUploadIntentRequestSchema.safeParse(value);
  return parsed.success
    ? { ok: true, data: parsed.data }
    : { ok: false, error: "invalid-input", status: 400 };
}
