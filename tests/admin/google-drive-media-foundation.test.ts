import assert from "node:assert/strict";
import test from "node:test";
import {
  evaluateGoogleDriveInteractiveAuthorization,
  evaluateGoogleDriveRootBoundary,
  GOOGLE_DRIVE_FILE_SCOPE,
  GOOGLE_DRIVE_FOLDER_MIME_TYPE,
  GOOGLE_DRIVE_SHORTCUT_MIME_TYPE,
  googleDriveInteractiveAuthorizationSchema,
  SYNTHETIC_GOOGLE_DRIVE_FILE_ID,
  SYNTHETIC_GOOGLE_DRIVE_ITEMS,
  SYNTHETIC_GOOGLE_DRIVE_ROOT_FOLDER_ID,
  type GoogleDriveNormalizedItem,
} from "../../lib/admin/media/google-drive-foundation";

const validAuthorization = {
  scope: GOOGLE_DRIVE_FILE_SCOPE,
  mode: "owner-interactive",
  tokenPersistence: "memory-only",
  refreshTokenPersistence: "forbidden",
  issuedAtMs: 1_000,
  expiresAtMs: 3_601_000,
} as const;

const evaluate = (items: readonly GoogleDriveNormalizedItem[] = SYNTHETIC_GOOGLE_DRIVE_ITEMS, rootFolderId = SYNTHETIC_GOOGLE_DRIVE_ROOT_FOLDER_ID) =>
  evaluateGoogleDriveRootBoundary({
    rootFolderId,
    selectedItemId: SYNTHETIC_GOOGLE_DRIVE_FILE_ID,
    items,
  });

test("Drive foundation permits only drive.file and short-lived memory-only interactive authorization", () => {
  assert.equal(GOOGLE_DRIVE_FILE_SCOPE, "https://www.googleapis.com/auth/drive.file");
  assert.deepEqual(evaluateGoogleDriveInteractiveAuthorization(validAuthorization, 2_000), {
    usable: true,
    reason: "interactive-authorization-ready",
  });
  assert.deepEqual(evaluateGoogleDriveInteractiveAuthorization({ ...validAuthorization, scope: "https://www.googleapis.com/auth/drive.readonly" }, 2_000), {
    usable: false,
    reason: "invalid-authorization",
  });
  assert.deepEqual(evaluateGoogleDriveInteractiveAuthorization({ ...validAuthorization, expiresAtMs: 3_601_001 }, 2_000), {
    usable: false,
    reason: "invalid-authorization",
  });
  assert.deepEqual(evaluateGoogleDriveInteractiveAuthorization(validAuthorization, 3_601_000), {
    usable: false,
    reason: "expired",
  });
  for (const invalidNow of [Number.NaN, Number.POSITIVE_INFINITY, -1, 1.5]) {
    assert.deepEqual(evaluateGoogleDriveInteractiveAuthorization(validAuthorization, invalidNow), {
      usable: false,
      reason: "invalid-authorization",
    });
  }
  assert.equal(googleDriveInteractiveAuthorizationSchema.safeParse({ ...validAuthorization, accessToken: "synthetic-not-allowed" }).success, false);
  assert.equal(googleDriveInteractiveAuthorizationSchema.safeParse({ ...validAuthorization, refreshToken: "synthetic-not-allowed" }).success, false);
});

test("Drive ancestry authorizes a file only through the exact immutable root folder ID", () => {
  assert.deepEqual(evaluate(), {
    allowed: true,
    reason: "inside-configured-root",
    provenance: {
      source: "google-drive",
      fileId: SYNTHETIC_GOOGLE_DRIVE_FILE_ID,
      rootFolderId: SYNTHETIC_GOOGLE_DRIVE_ROOT_FOLDER_ID,
      authorizationScope: GOOGLE_DRIVE_FILE_SCOPE,
    },
  });
  assert.deepEqual(evaluate(SYNTHETIC_GOOGLE_DRIVE_ITEMS, "synthetic_other_root_20260828"), {
    allowed: false,
    reason: "ancestry-unverifiable",
  });
});

test("Drive ancestry fails closed for moved, trashed, shortcut, missing and cyclic items", () => {
  const replace = (id: string, patch: Partial<GoogleDriveNormalizedItem>) =>
    SYNTHETIC_GOOGLE_DRIVE_ITEMS.map((item) => item.id === id ? { ...item, ...patch } : item);

  const movedItems: GoogleDriveNormalizedItem[] = [
    ...replace(SYNTHETIC_GOOGLE_DRIVE_FILE_ID, { parents: ["synthetic_outside_folder_20260828"] }),
    {
      id: "synthetic_outside_folder_20260828",
      mimeType: GOOGLE_DRIVE_FOLDER_MIME_TYPE,
      parents: [],
      trashed: false,
      shortcutDetails: null,
    },
  ];
  assert.deepEqual(evaluate(movedItems), { allowed: false, reason: "outside-configured-root" });
  assert.deepEqual(evaluate(replace(SYNTHETIC_GOOGLE_DRIVE_FILE_ID, { trashed: true })), {
    allowed: false,
    reason: "trashed-item-denied",
  });
  assert.deepEqual(evaluate(replace("synthetic_ccpun_media_folder_20260828", { trashed: true })), {
    allowed: false,
    reason: "trashed-item-denied",
  });
  assert.deepEqual(evaluate(replace(SYNTHETIC_GOOGLE_DRIVE_FILE_ID, {
    mimeType: GOOGLE_DRIVE_SHORTCUT_MIME_TYPE,
    shortcutDetails: {
      targetId: "synthetic_shortcut_target_20260828",
      targetMimeType: "video/mp4",
    },
  })), { allowed: false, reason: "shortcut-denied" });
  assert.deepEqual(evaluate(SYNTHETIC_GOOGLE_DRIVE_ITEMS.filter((item) => item.id !== "synthetic_ccpun_media_folder_20260828")), {
    allowed: false,
    reason: "ancestry-unverifiable",
  });
  assert.deepEqual(evaluate(replace("synthetic_ccpun_media_folder_20260828", { parents: [SYNTHETIC_GOOGLE_DRIVE_FILE_ID] })), {
    allowed: false,
    reason: "ancestry-unverifiable",
  });
});

test("Drive ancestry rejects unverifiable metadata and a non-folder configured root", () => {
  const replace = (id: string, patch: Partial<GoogleDriveNormalizedItem>) =>
    SYNTHETIC_GOOGLE_DRIVE_ITEMS.map((item) => item.id === id ? { ...item, ...patch } : item);

  assert.deepEqual(evaluate(replace(SYNTHETIC_GOOGLE_DRIVE_FILE_ID, { parents: null })), {
    allowed: false,
    reason: "ancestry-unverifiable",
  });
  assert.deepEqual(evaluate(replace(SYNTHETIC_GOOGLE_DRIVE_FILE_ID, { trashed: null })), {
    allowed: false,
    reason: "ancestry-unverifiable",
  });
  assert.deepEqual(evaluate(replace(SYNTHETIC_GOOGLE_DRIVE_ROOT_FOLDER_ID, { mimeType: "application/octet-stream" })), {
    allowed: false,
    reason: "root-is-not-folder",
  });
  assert.deepEqual(evaluate([...SYNTHETIC_GOOGLE_DRIVE_ITEMS, SYNTHETIC_GOOGLE_DRIVE_ITEMS[0]]), {
    allowed: false,
    reason: "ancestry-unverifiable",
  });
});

test("Synthetic Drive contract contains IDs and metadata only", () => {
  const serialized = JSON.stringify({ validAuthorization, items: SYNTHETIC_GOOGLE_DRIVE_ITEMS });
  assert.equal(/"(?:accessToken|refreshToken|clientSecret|signedUrl|downloadUrl)"\s*:/i.test(serialized), false);
  assert.equal(serialized.includes("Google Drive / CCPun"), false);
});
