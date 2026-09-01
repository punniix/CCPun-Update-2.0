import { z } from "zod";
import { isSocialProviderExecutionGateEnabled } from "../../publishing";

if (typeof window !== "undefined") throw new Error("META_PUBLISHING_SERVER_ONLY");

export const META_FACEBOOK_PUBLISHING_SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_posts",
] as const;
export const META_INSTAGRAM_PUBLISHING_SCOPES = ["instagram_basic", "instagram_content_publish"] as const;
const META_INSTAGRAM_DISCOVERY_SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  ...META_INSTAGRAM_PUBLISHING_SCOPES,
] as const;

const graphIdSchema = z.string().trim().min(1).max(120).regex(/^[A-Za-z0-9_.:-]+$/);
const graphVersionSchema = z.string().trim().regex(/^v\d{1,2}\.\d{1,2}$/);
const messageSchema = z.string().trim().min(1).max(10_000);
const httpsUrlSchema = z.string().url().max(4_000).refine((value) => new URL(value).protocol === "https:", "HTTPS URL required");
const providerWriteAuthorizationSchema = z.strictObject({ providerWriteAllowed: z.literal(true) });
const graphIdResponseSchema = z.strictObject({ id: graphIdSchema });
const graphSuccessResponseSchema = z.object({ success: z.boolean() });
const reelStartResponseSchema = z.strictObject({
  video_id: graphIdSchema,
  upload_url: httpsUrlSchema.refine((value) => new URL(value).hostname === "rupload.facebook.com", "Meta upload host required"),
});
const metaErrorSchema = z.object({
  error: z.object({
    type: z.string().max(120).optional(),
    code: z.number().int().optional(),
    error_subcode: z.number().int().optional(),
  }).optional(),
});
const audioAssetSchema = z.object({
  audio_id: graphIdSchema,
  audio_type: z.enum(["music", "original_sound"]),
  title: z.string().trim().min(1).max(500),
  duration_in_ms: z.number().int().nonnegative().safe(),
  display_artist: z.string().trim().max(500).nullable().optional(),
  ig_username: z.string().trim().max(120).nullable().optional(),
  cover_artwork_thumbnail_uri: httpsUrlSchema.nullable().optional(),
  cover_artwork_thumbnail_url: httpsUrlSchema.nullable().optional(),
  profile_picture_url: httpsUrlSchema.nullable().optional(),
  download_url: httpsUrlSchema.nullable().optional(),
  on_platform_audio_preview_link: httpsUrlSchema.nullable().optional(),
  is_ads_eligible: z.boolean().nullable().optional(),
});
const audioSearchResponseSchema = z.object({ audio: z.array(audioAssetSchema).max(100) });
const pageDiscoveryResponseSchema = z.object({
  data: z.array(z.object({
    id: graphIdSchema,
    access_token: z.string().trim().min(1).max(4_096).optional(),
    instagram_business_account: z.object({ id: graphIdSchema }).nullable().optional(),
  })).max(100),
});

const approvedMediaDescriptorSchema = z.strictObject({
  source: z.literal("ccpun-approved-drive-binary"),
  assetId: graphIdSchema,
  driveFileId: graphIdSchema,
  approvedRevision: z.string().trim().min(1).max(120),
  approvedVersion: z.number().int().min(1),
  fileName: z.string().trim().min(1).max(255).refine((value) => !/[\u0000-\u001F\u007F-\u009F"\\]/u.test(value)),
  byteSize: z.number().int().min(1).max(1_000_000_000),
  checksumSha256: z.string().regex(/^[0-9a-f]{64}$/),
  body: z.instanceof(ReadableStream<Uint8Array>),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "video/mp4"]),
  order: z.number().int().min(1).max(10),
}).superRefine((media, context) => {
  if (media.assetId !== media.driveFileId) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["driveFileId"], message: "Approved asset must bind the exact Drive file" });
  }
});
export type ApprovedMetaMediaDescriptor = z.infer<typeof approvedMediaDescriptorSchema>;

const facebookPageContentSchema = z.discriminatedUnion("format", [
  z.strictObject({ format: z.literal("text-post"), message: messageSchema }),
  z.strictObject({ format: z.literal("link-post"), message: messageSchema.optional(), linkUrl: httpsUrlSchema }),
  z.strictObject({ format: z.literal("image-post"), message: messageSchema.optional(), media: approvedMediaDescriptorSchema }),
  z.strictObject({
    format: z.literal("album"), message: messageSchema.optional(),
    media: z.array(approvedMediaDescriptorSchema).min(2).max(10),
  }),
  z.strictObject({ format: z.literal("video"), message: messageSchema.optional(), media: approvedMediaDescriptorSchema }),
  z.strictObject({ format: z.literal("reel"), message: messageSchema.optional(), media: approvedMediaDescriptorSchema }),
]).superRefine((content, context) => {
  if (content.format === "album") {
    const orders = content.media.map((item) => item.order);
    if (new Set(orders).size !== orders.length || orders.some((order, index) => order !== index + 1)) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["media"], message: "Album media must have unique contiguous order" });
    }
  }
  if (content.format === "image-post" || content.format === "album") {
    const media = content.format === "album" ? content.media : [content.media];
    if (media.some((item) => !item.mimeType.startsWith("image/"))) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["media"], message: "Image formats require approved image media" });
    }
  }
  if ((content.format === "video" || content.format === "reel") && content.media.mimeType !== "video/mp4") {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["media"], message: "Video formats require approved MP4 media" });
  }
});
export type FacebookPageContent = z.infer<typeof facebookPageContentSchema>;

export const instagramAudioSearchInputSchema = z.strictObject({
  audioType: z.enum(["music", "original_sound"]),
  searchQuery: z.string().trim().min(1).max(100).optional(),
});
const instagramAudioConfigurationSchema = z.strictObject({
  audioId: graphIdSchema,
  audioVolume: z.number().int().min(0).max(100).default(100),
  videoVolume: z.number().int().min(0).max(100).default(100),
});

type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;
type MetaEnvironment = Record<string, string | undefined>;

function configuredMeta(env: MetaEnvironment, requiredScopes: readonly string[]) {
  const token = env.CCPUN_META_ACCESS_TOKEN?.trim();
  const parsedVersion = graphVersionSchema.safeParse(env.CCPUN_META_GRAPH_VERSION);
  if (!token || !parsedVersion.success) throw new Error("META_API_NOT_CONFIGURED");
  const grantedScopes = new Set(env.CCPUN_META_GRANTED_SCOPES?.split(",").map((scope) => scope.trim()).filter(Boolean));
  if (!requiredScopes.every((scope) => grantedScopes.has(scope))) throw new Error("META_API_SCOPE_REQUIRED");
  return { token, version: parsedVersion.data };
}

function assertMetaWriteBoundary(
  authorization: z.input<typeof providerWriteAuthorizationSchema>,
  env: MetaEnvironment,
) {
  providerWriteAuthorizationSchema.parse(authorization);
  if (!isSocialProviderExecutionGateEnabled(env)) throw new Error("META_PROVIDER_WRITES_DISABLED");
}

async function metaRequest(
  url: string,
  token: string,
  fetcher: FetchLike,
  init: Pick<RequestInit, "method" | "body"> = {},
) {
  let response: Response;
  try {
    response = await fetcher(url, {
      method: init.method ?? "GET",
      body: init.body,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init.body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
      },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    if (error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name)) throw new Error("META_API_TIMEOUT");
    throw new Error("META_API_UNAVAILABLE");
  }

  const body = await response.json().catch(() => null) as unknown;
  if (!response.ok) {
    const providerError = metaErrorSchema.safeParse(body);
    console.error("[meta-publishing]", {
      endpoint: new URL(url).pathname,
      status: response.status,
      graphType: providerError.success ? providerError.data.error?.type : undefined,
      graphCode: providerError.success ? providerError.data.error?.code : undefined,
      graphSubcode: providerError.success ? providerError.data.error?.error_subcode : undefined,
    });
  }
  if (response.status === 401 || response.status === 403) throw new Error("META_API_AUTH_REQUIRED");
  if (response.status === 429) throw new Error("META_API_RATE_LIMITED");
  if (response.status === 400) throw new Error("META_API_INVALID_REQUEST");
  if (!response.ok) throw new Error("META_API_UNAVAILABLE");
  return body;
}

async function checkedUploadResponse(response: Response, url: string) {
  if (response.ok) return;
  await response.body?.cancel().catch(() => undefined);
  console.error("[meta-publishing]", { endpoint: new URL(url).pathname, status: response.status });
  if (response.status === 401 || response.status === 403) throw new Error("META_API_AUTH_REQUIRED");
  if (response.status === 429) throw new Error("META_API_RATE_LIMITED");
  throw new Error(response.status === 400 ? "META_API_INVALID_REQUEST" : "META_API_UNAVAILABLE");
}

async function metaBinaryUpload(
  url: string,
  token: string,
  file: ApprovedMetaMediaDescriptor,
  fetcher: FetchLike,
) {
  let response: Response;
  try {
    response = await fetcher(url, {
      method: "POST",
      headers: { Authorization: `OAuth ${token}`, offset: "0", file_size: String(file.byteSize), "Content-Type": file.mimeType },
      body: file.body,
      duplex: "half",
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(5 * 60_000),
    } as RequestInit & { duplex: "half" });
  } catch (error) {
    if (error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name)) throw new Error("META_API_TIMEOUT");
    throw new Error("META_API_UNAVAILABLE");
  }
  await checkedUploadResponse(response, url);
  await response.body?.cancel().catch(() => undefined);
}

function multipartBody(fields: Record<string, string>, file: ApprovedMetaMediaDescriptor) {
  const boundary = `ccpun-${crypto.randomUUID()}`;
  const encoder = new TextEncoder();
  const fieldParts = Object.entries(fields).map(([name, value]) =>
    `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`).join("");
  const prefix = encoder.encode(`${fieldParts}--${boundary}\r\nContent-Disposition: form-data; name="source"; filename="${file.fileName}"\r\nContent-Type: ${file.mimeType}\r\n\r\n`);
  const suffix = encoder.encode(`\r\n--${boundary}--\r\n`);
  const reader = file.body.getReader();
  let stage: "prefix" | "file" | "suffix" | "done" = "prefix";
  const body = new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (stage === "prefix") { controller.enqueue(prefix); stage = "file"; return; }
      if (stage === "file") {
        const chunk = await reader.read();
        if (!chunk.done) { controller.enqueue(chunk.value); return; }
        stage = "suffix";
      }
      if (stage === "suffix") { controller.enqueue(suffix); stage = "done"; controller.close(); }
    },
    cancel(reason) { return reader.cancel(reason); },
  });
  return { body, contentType: `multipart/form-data; boundary=${boundary}`, contentLength: prefix.byteLength + file.byteSize + suffix.byteLength };
}

async function metaMultipartRequest(
  url: string,
  token: string,
  fields: Record<string, string>,
  file: ApprovedMetaMediaDescriptor,
  fetcher: FetchLike,
) {
  const multipart = multipartBody(fields, file);
  let response: Response;
  try {
    response = await fetcher(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": multipart.contentType,
        "Content-Length": String(multipart.contentLength),
      },
      body: multipart.body,
      duplex: "half",
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(5 * 60_000),
    } as RequestInit & { duplex: "half" });
  } catch (error) {
    if (error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name)) throw new Error("META_API_TIMEOUT");
    throw new Error("META_API_UNAVAILABLE");
  }
  await checkedUploadResponse(response, url);
  return response.json().catch(() => null) as Promise<unknown>;
}

function formBody(fields: Record<string, string>) {
  return new URLSearchParams(fields).toString();
}

function scheduleFields(scheduledAt: string | undefined, now: string): Record<string, string> {
  if (!scheduledAt) return { published: "true" };
  const delay = Date.parse(scheduledAt) - Date.parse(now);
  if (delay < 10 * 60_000 || delay > 75 * 24 * 60 * 60_000) throw new Error("META_SCHEDULE_OUT_OF_RANGE");
  return { published: "false", scheduled_publish_time: String(Math.floor(Date.parse(scheduledAt) / 1000)) };
}

async function discoverManagedPage(
  configured: { token: string; version: string },
  fetcher: FetchLike,
  requestedPageId?: string,
) {
  const fields = "id,access_token,instagram_business_account{id}";
  const response = pageDiscoveryResponseSchema.safeParse(await metaRequest(
    `https://graph.facebook.com/${configured.version}/me/accounts?fields=${encodeURIComponent(fields)}&limit=100`,
    configured.token,
    fetcher,
  ));
  if (!response.success) throw new Error("META_API_INVALID_RESPONSE");
  const selectedPageId = requestedPageId
    ?? (response.data.data.length === 1 ? response.data.data[0]!.id : null);
  const selectedPage = response.data.data.find((page) => page.id === selectedPageId);
  if (!selectedPage) throw new Error("META_PAGE_SELECTION_REQUIRED");
  return selectedPage;
}

export async function publishFacebookPagePost(
  input: { pageId?: string; message: string; authorization: { providerWriteAllowed: true } },
  env: MetaEnvironment = process.env,
  fetcher: FetchLike = fetch,
) {
  const parsed = z.strictObject({
    pageId: graphIdSchema.optional(),
    message: messageSchema,
    authorization: providerWriteAuthorizationSchema,
  }).parse(input);
  return publishFacebookPageContent({
    pageId: parsed.pageId,
    content: { format: "text-post", message: parsed.message },
    now: new Date().toISOString(),
    authorization: parsed.authorization,
  }, env, fetcher);
}

export async function scheduleFacebookPagePost(
  input: { pageId?: string; message: string; scheduledAt: string; now: string; authorization: { providerWriteAllowed: true } },
  env: MetaEnvironment = process.env,
  fetcher: FetchLike = fetch,
) {
  const parsed = z.strictObject({
    pageId: graphIdSchema.optional(),
    message: messageSchema,
    scheduledAt: z.string().datetime(),
    now: z.string().datetime(),
    authorization: providerWriteAuthorizationSchema,
  }).superRefine((value, context) => {
    const delay = Date.parse(value.scheduledAt) - Date.parse(value.now);
    if (delay < 10 * 60_000 || delay > 75 * 24 * 60 * 60_000) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["scheduledAt"], message: "Meta requires 10 minutes to 75 days" });
    }
  }).parse(input);
  return publishFacebookPageContent({
    pageId: parsed.pageId,
    content: { format: "text-post", message: parsed.message },
    scheduledAt: parsed.scheduledAt,
    now: parsed.now,
    authorization: parsed.authorization,
  }, env, fetcher);
}

export async function publishFacebookPageContent(
  input: {
    pageId?: string;
    content: FacebookPageContent;
    scheduledAt?: string;
    now: string;
    authorization: { providerWriteAllowed: true };
  },
  env: MetaEnvironment = process.env,
  fetcher: FetchLike = fetch,
) {
  const parsed = z.strictObject({
    pageId: graphIdSchema.optional(),
    content: facebookPageContentSchema,
    scheduledAt: z.string().datetime().optional(),
    now: z.string().datetime(),
    authorization: providerWriteAuthorizationSchema,
  }).parse(input);
  assertMetaWriteBoundary(parsed.authorization, env);
  const configured = configuredMeta(env, META_FACEBOOK_PUBLISHING_SCOPES);
  // ponytail: resolve the Page token per approved execution; cache only if provider-call volume becomes material.
  const page = await discoverManagedPage(configured, fetcher, parsed.pageId);
  if (!page.access_token) throw new Error("META_PAGE_ACCESS_TOKEN_REQUIRED");
  const scheduling = scheduleFields(parsed.scheduledAt, parsed.now);
  const pagePath = `https://graph.facebook.com/${configured.version}/${encodeURIComponent(page.id)}`;
  const finish = (platformObjectId: string) => ({
    platformObjectId,
    scheduled: Boolean(parsed.scheduledAt),
    ...(parsed.scheduledAt ? { scheduledPublishTime: scheduling.scheduled_publish_time } : {}),
  });

  if (parsed.content.format === "text-post" || parsed.content.format === "link-post") {
    const body = formBody({
      ...(parsed.content.message ? { message: parsed.content.message } : {}),
      ...(parsed.content.format === "link-post" ? { link: parsed.content.linkUrl } : {}),
      ...scheduling,
    });
    const response = graphIdResponseSchema.safeParse(await metaRequest(
      `${pagePath}/feed`, page.access_token, fetcher, { method: "POST", body },
    ));
    if (!response.success) throw new Error("META_API_INVALID_RESPONSE");
    return finish(response.data.id);
  }

  if (parsed.content.format === "image-post") {
    const response = graphIdResponseSchema.safeParse(await metaMultipartRequest(
      `${pagePath}/photos`, page.access_token, {
        ...(parsed.content.message ? { caption: parsed.content.message } : {}),
        ...scheduling,
      }, parsed.content.media, fetcher,
    ));
    if (!response.success) throw new Error("META_API_INVALID_RESPONSE");
    return finish(response.data.id);
  }

  if (parsed.content.format === "album") {
    const photoIds: string[] = [];
    let mutationAttempted = false;
    try {
      for (const media of parsed.content.media) {
        mutationAttempted = true;
        const response = graphIdResponseSchema.safeParse(await metaMultipartRequest(
          `${pagePath}/photos`, page.access_token, { published: "false" }, media, fetcher,
        ));
        if (!response.success) throw new Error("META_API_INVALID_RESPONSE");
        photoIds.push(response.data.id);
      }
      const fields: Record<string, string> = {
        ...(parsed.content.message ? { message: parsed.content.message } : {}),
        ...scheduling,
      };
      photoIds.forEach((id, index) => { fields[`attached_media[${index}]`] = JSON.stringify({ media_fbid: id }); });
      const response = graphIdResponseSchema.safeParse(await metaRequest(
        `${pagePath}/feed`, page.access_token, fetcher, { method: "POST", body: formBody(fields) },
      ));
      if (!response.success) throw new Error("META_API_INVALID_RESPONSE");
      return finish(response.data.id);
    } catch (error) {
      if (mutationAttempted) throw new Error("META_API_PARTIAL_MUTATION_RECONCILIATION_REQUIRED", { cause: error });
      throw error;
    }
  }

  if (parsed.content.format === "video") {
    const response = graphIdResponseSchema.safeParse(await metaMultipartRequest(
      `${pagePath}/videos`, page.access_token, {
        ...(parsed.content.message ? { description: parsed.content.message } : {}),
        ...scheduling,
      }, parsed.content.media, fetcher,
    ));
    if (!response.success) throw new Error("META_API_INVALID_RESPONSE");
    return finish(response.data.id);
  }

  try {
    const started = reelStartResponseSchema.safeParse(await metaRequest(
      `${pagePath}/video_reels`, page.access_token, fetcher,
      { method: "POST", body: formBody({ upload_phase: "start" }) },
    ));
    if (!started.success) throw new Error("META_API_INVALID_RESPONSE");
    await metaBinaryUpload(started.data.upload_url, page.access_token, parsed.content.media, fetcher);
    const finished = graphSuccessResponseSchema.safeParse(await metaRequest(
      `${pagePath}/video_reels`, page.access_token, fetcher, { method: "POST", body: formBody({
        upload_phase: "finish",
        video_id: started.data.video_id,
        video_state: parsed.scheduledAt ? "SCHEDULED" : "PUBLISHED",
        ...(parsed.content.message ? { description: parsed.content.message } : {}),
        ...(parsed.scheduledAt ? { scheduled_publish_time: scheduling.scheduled_publish_time! } : {}),
      }) },
    ));
    if (!finished.success || !finished.data.success) throw new Error("META_API_INVALID_RESPONSE");
    return finish(started.data.video_id);
  } catch (error) {
    throw new Error("META_API_PARTIAL_MUTATION_RECONCILIATION_REQUIRED", { cause: error });
  }
}

export async function createInstagramReelContainer(
  input: {
    instagramUserId: string;
    videoUrl: string;
    caption?: string;
    audio: z.input<typeof instagramAudioConfigurationSchema>;
    authorization: { providerWriteAllowed: true };
  },
  env: MetaEnvironment = process.env,
  fetcher: FetchLike = fetch,
) {
  const parsed = z.strictObject({
    instagramUserId: graphIdSchema,
    videoUrl: httpsUrlSchema,
    caption: z.string().trim().max(2_200).optional(),
    audio: instagramAudioConfigurationSchema,
    authorization: providerWriteAuthorizationSchema,
  }).parse(input);
  assertMetaWriteBoundary(parsed.authorization, env);
  const { token, version } = configuredMeta(env, META_INSTAGRAM_PUBLISHING_SCOPES);
  const body = formBody({
    media_type: "REELS",
    video_url: parsed.videoUrl,
    ...(parsed.caption ? { caption: parsed.caption } : {}),
    audio_configuration: JSON.stringify({
      audio_id: parsed.audio.audioId,
      audio_volume: parsed.audio.audioVolume,
      video_volume: parsed.audio.videoVolume,
    }),
  });
  const response = graphIdResponseSchema.safeParse(await metaRequest(
    `https://graph.facebook.com/${version}/${encodeURIComponent(parsed.instagramUserId)}/media`, token, fetcher, { method: "POST", body },
  ));
  if (!response.success) throw new Error("META_API_INVALID_RESPONSE");
  return { creationId: response.data.id };
}

export async function publishInstagramMedia(
  input: { instagramUserId: string; creationId: string; authorization: { providerWriteAllowed: true } },
  env: MetaEnvironment = process.env,
  fetcher: FetchLike = fetch,
) {
  const parsed = z.strictObject({
    instagramUserId: graphIdSchema,
    creationId: graphIdSchema,
    authorization: providerWriteAuthorizationSchema,
  }).parse(input);
  assertMetaWriteBoundary(parsed.authorization, env);
  const { token, version } = configuredMeta(env, META_INSTAGRAM_PUBLISHING_SCOPES);
  const response = graphIdResponseSchema.safeParse(await metaRequest(
    `https://graph.facebook.com/${version}/${encodeURIComponent(parsed.instagramUserId)}/media_publish`, token, fetcher,
    { method: "POST", body: formBody({ creation_id: parsed.creationId }) },
  ));
  if (!response.success) throw new Error("META_API_INVALID_RESPONSE");
  return { platformObjectId: response.data.id };
}

export async function discoverInstagramPublishingUser(
  env: MetaEnvironment = process.env,
  fetcher: FetchLike = fetch,
) {
  const configured = configuredMeta(env, META_INSTAGRAM_DISCOVERY_SCOPES);
  const selectedPage = await discoverManagedPage(configured, fetcher, env.CCPUN_META_PAGE_ID?.trim());
  if (!selectedPage.instagram_business_account) throw new Error("META_INSTAGRAM_ACCOUNT_REQUIRED");
  return { pageId: selectedPage.id, instagramUserId: selectedPage.instagram_business_account.id };
}

export async function searchInstagramAudio(
  input: { instagramUserId: string; audioType: "music" | "original_sound"; searchQuery?: string },
  env: MetaEnvironment = process.env,
  fetcher: FetchLike = fetch,
) {
  const parsed = instagramAudioSearchInputSchema.extend({ instagramUserId: graphIdSchema }).parse(input);
  const { token, version } = configuredMeta(env, META_INSTAGRAM_PUBLISHING_SCOPES);
  const url = new URL(`https://graph.facebook.com/${version}/ig_audio`);
  url.searchParams.set("audio_type", parsed.audioType);
  url.searchParams.set("user_id", parsed.instagramUserId);
  if (parsed.searchQuery) url.searchParams.set("search_query", parsed.searchQuery);
  const response = audioSearchResponseSchema.safeParse(await metaRequest(url.toString(), token, fetcher));
  if (!response.success) throw new Error("META_API_INVALID_RESPONSE");
  return response.data.audio;
}

export async function readInstagramAudio(
  input: { instagramUserId: string; audioId: string },
  env: MetaEnvironment = process.env,
  fetcher: FetchLike = fetch,
) {
  const parsed = z.strictObject({ instagramUserId: graphIdSchema, audioId: graphIdSchema }).parse(input);
  const { token, version } = configuredMeta(env, META_INSTAGRAM_PUBLISHING_SCOPES);
  const url = new URL(`https://graph.facebook.com/${version}/${encodeURIComponent(parsed.audioId)}`);
  url.searchParams.set("user_id", parsed.instagramUserId);
  const response = audioAssetSchema.safeParse(await metaRequest(url.toString(), token, fetcher));
  if (!response.success) throw new Error("META_API_INVALID_RESPONSE");
  return response.data;
}
