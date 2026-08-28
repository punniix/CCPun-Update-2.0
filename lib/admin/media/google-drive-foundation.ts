import { z } from "zod";

if (typeof window !== "undefined") {
  throw new Error("GOOGLE_DRIVE_MEDIA_BOUNDARY_SERVER_ONLY");
}

export const GOOGLE_DRIVE_FILE_SCOPE = "https://www.googleapis.com/auth/drive.file" as const;
export const GOOGLE_DRIVE_FOLDER_MIME_TYPE = "application/vnd.google-apps.folder" as const;
export const GOOGLE_DRIVE_SHORTCUT_MIME_TYPE = "application/vnd.google-apps.shortcut" as const;
export const GOOGLE_DRIVE_INTERACTIVE_AUTH_MAX_TTL_MS = 60 * 60 * 1_000;

export const googleDriveFileIdSchema = z.string()
  .trim()
  .min(10)
  .max(200)
  .regex(/^[A-Za-z0-9_-]+$/);

export const googleDriveRootBoundarySchema = z.strictObject({
  rootFolderId: googleDriveFileIdSchema,
  authorizationBasis: z.literal("exact-immutable-folder-id"),
});

export const googleDriveInteractiveAuthorizationSchema = z.strictObject({
  scope: z.literal(GOOGLE_DRIVE_FILE_SCOPE),
  mode: z.literal("owner-interactive"),
  tokenPersistence: z.literal("memory-only"),
  refreshTokenPersistence: z.literal("forbidden"),
  issuedAtMs: z.number().int().nonnegative(),
  expiresAtMs: z.number().int().positive(),
}).superRefine((authorization, context) => {
  const ttlMs = authorization.expiresAtMs - authorization.issuedAtMs;
  if (ttlMs <= 0 || ttlMs > GOOGLE_DRIVE_INTERACTIVE_AUTH_MAX_TTL_MS) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Interactive authorization must be short-lived",
    });
  }
});

export type GoogleDriveInteractiveAuthorization = z.infer<typeof googleDriveInteractiveAuthorizationSchema>;

export function evaluateGoogleDriveInteractiveAuthorization(
  authorization: unknown,
  nowMs: number,
):
  | { usable: true; reason: "interactive-authorization-ready" }
  | { usable: false; reason: "invalid-authorization" | "not-yet-valid" | "expired" } {
  if (!Number.isSafeInteger(nowMs) || nowMs < 0) {
    return { usable: false, reason: "invalid-authorization" };
  }
  const parsed = googleDriveInteractiveAuthorizationSchema.safeParse(authorization);
  if (!parsed.success) return { usable: false, reason: "invalid-authorization" };
  if (nowMs < parsed.data.issuedAtMs) return { usable: false, reason: "not-yet-valid" };
  if (nowMs >= parsed.data.expiresAtMs) return { usable: false, reason: "expired" };
  return { usable: true, reason: "interactive-authorization-ready" };
}

export const googleDriveNormalizedItemSchema = z.strictObject({
  id: googleDriveFileIdSchema,
  mimeType: z.string().trim().min(1).max(200).nullable(),
  parents: z.array(googleDriveFileIdSchema).max(2).nullable(),
  trashed: z.boolean().nullable(),
  shortcutDetails: z.strictObject({
    targetId: googleDriveFileIdSchema,
    targetMimeType: z.string().trim().min(1).max(200),
  }).nullable(),
});

export type GoogleDriveNormalizedItem = z.infer<typeof googleDriveNormalizedItemSchema>;

export type GoogleDriveBoundaryEvaluation =
  | {
      allowed: true;
      reason: "inside-configured-root";
      provenance: {
        source: "google-drive";
        fileId: string;
        rootFolderId: string;
        authorizationScope: typeof GOOGLE_DRIVE_FILE_SCOPE;
      };
    }
  | {
      allowed: false;
      reason:
        | "invalid-boundary-input"
        | "ancestry-unverifiable"
        | "outside-configured-root"
        | "shortcut-denied"
        | "trashed-item-denied"
        | "root-is-not-folder";
    };

const MAX_ANCESTRY_DEPTH = 64;

export function evaluateGoogleDriveRootBoundary(input: {
  rootFolderId: unknown;
  selectedItemId: unknown;
  /** Trusted server-normalized Drive API metadata only; never accept client assertions here. */
  items: readonly unknown[];
}): GoogleDriveBoundaryEvaluation {
  const boundary = googleDriveRootBoundarySchema.safeParse({
    rootFolderId: input.rootFolderId,
    authorizationBasis: "exact-immutable-folder-id",
  });
  const selectedItemId = googleDriveFileIdSchema.safeParse(input.selectedItemId);
  const items = z.array(googleDriveNormalizedItemSchema).max(128).safeParse(input.items);
  if (!boundary.success || !selectedItemId.success || !items.success) {
    return { allowed: false, reason: "invalid-boundary-input" };
  }

  const itemsById = new Map<string, GoogleDriveNormalizedItem>();
  for (const item of items.data) {
    if (itemsById.has(item.id)) return { allowed: false, reason: "ancestry-unverifiable" };
    itemsById.set(item.id, item);
  }

  const visited = new Set<string>();
  let currentId = selectedItemId.data;
  for (let depth = 0; depth < MAX_ANCESTRY_DEPTH; depth += 1) {
    if (visited.has(currentId)) return { allowed: false, reason: "ancestry-unverifiable" };
    visited.add(currentId);

    const current = itemsById.get(currentId);
    if (!current || current.trashed === null || current.mimeType === null) {
      return { allowed: false, reason: "ancestry-unverifiable" };
    }
    if (current.trashed) return { allowed: false, reason: "trashed-item-denied" };
    if (current.mimeType === GOOGLE_DRIVE_SHORTCUT_MIME_TYPE || current.shortcutDetails !== null) {
      return { allowed: false, reason: "shortcut-denied" };
    }

    if (currentId === boundary.data.rootFolderId) {
      if (current.mimeType !== GOOGLE_DRIVE_FOLDER_MIME_TYPE) {
        return { allowed: false, reason: "root-is-not-folder" };
      }
      return {
        allowed: true,
        reason: "inside-configured-root",
        provenance: {
          source: "google-drive",
          fileId: selectedItemId.data,
          rootFolderId: boundary.data.rootFolderId,
          authorizationScope: GOOGLE_DRIVE_FILE_SCOPE,
        },
      };
    }

    if (current.parents === null || current.parents.length > 1) {
      return { allowed: false, reason: "ancestry-unverifiable" };
    }
    if (current.parents.length === 0) {
      return { allowed: false, reason: "outside-configured-root" };
    }
    currentId = current.parents[0];
  }

  return { allowed: false, reason: "ancestry-unverifiable" };
}

export const SYNTHETIC_GOOGLE_DRIVE_ROOT_FOLDER_ID = "synthetic_ccpun_root_20260828";
export const SYNTHETIC_GOOGLE_DRIVE_FILE_ID = "synthetic_media_file_20260828";
export const SYNTHETIC_GOOGLE_DRIVE_ITEMS: readonly GoogleDriveNormalizedItem[] = Object.freeze([
  {
    id: SYNTHETIC_GOOGLE_DRIVE_ROOT_FOLDER_ID,
    mimeType: GOOGLE_DRIVE_FOLDER_MIME_TYPE,
    parents: ["synthetic_owner_my_drive_20260828"],
    trashed: false,
    shortcutDetails: null,
  },
  {
    id: "synthetic_ccpun_media_folder_20260828",
    mimeType: GOOGLE_DRIVE_FOLDER_MIME_TYPE,
    parents: [SYNTHETIC_GOOGLE_DRIVE_ROOT_FOLDER_ID],
    trashed: false,
    shortcutDetails: null,
  },
  {
    id: SYNTHETIC_GOOGLE_DRIVE_FILE_ID,
    mimeType: "video/mp4",
    parents: ["synthetic_ccpun_media_folder_20260828"],
    trashed: false,
    shortcutDetails: null,
  },
]);
