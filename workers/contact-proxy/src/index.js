const MAX_BODY_BYTES = 4_096;
const CCPUN_ORIGIN = "https://ccpun.com";

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": CCPUN_ORIGIN,
      "Vary": "Origin",
    },
  });
}

function clean(value, max) {
  return typeof value === "string" ? value.trim().replace(/[<>]/g, "").slice(0, max) : "";
}

async function readJson(request) {
  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (!Number.isFinite(contentLength) || contentLength > MAX_BODY_BYTES) return null;

  const reader = request.body?.getReader();
  if (!reader) return null;
  const chunks = [];
  let size = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY_BYTES) return null;
    chunks.push(value);
  }

  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return JSON.parse(new TextDecoder().decode(body));
  } catch {
    return null;
  }
}

async function sign(secret, payload) {
  const bytes = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    bytes.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, bytes.encode(payload));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

const worker = {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": CCPUN_ORIGIN,
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
          "Vary": "Origin",
        },
      });
    }

    if (request.method !== "POST" || new URL(request.url).pathname !== "/api/contact") {
      return json({ success: false }, 404);
    }

    if (request.headers.get("Origin") !== CCPUN_ORIGIN) return json({ success: false }, 403);
    if (!request.headers.get("Content-Type")?.includes("application/json")) return json({ success: false }, 415);
    if (!env.CCPUN_CONTACT_WEBHOOK_SECRET || !env.N8N_CONTACT_WEBHOOK_URL) return json({ success: false }, 503);

    const input = await readJson(request);
    if (!input || typeof input !== "object") return json({ success: false }, 400);

    const name = clean(input.name, 100);
    const phone = clean(input.phone, 10);
    const email = clean(input.email, 255);
    const message = clean(input.message, 1_000);
    const referral = clean(input.referral, 200);

    if (name.length < 2 || !/^0\d{8,9}$/.test(phone) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ success: false }, 400);
    }

    const timestamp = String(Math.floor(Date.now() / 1000));
    const payload = JSON.stringify({
      type: "contact",
      name,
      phone,
      email,
      message,
      referral,
      submittedAt: new Date().toISOString(),
      source: "homepage-contact-form",
    });
    const signature = await sign(env.CCPUN_CONTACT_WEBHOOK_SECRET, `${timestamp}.${payload}`);

    try {
      const upstream = await fetch(env.N8N_CONTACT_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CCPun-Timestamp": timestamp,
          "X-CCPun-Signature": `sha256=${signature}`,
        },
        body: payload,
      });
      return upstream.ok ? json({ success: true }, 200) : json({ success: false }, 502);
    } catch {
      return json({ success: false }, 502);
    }
  },
};

export default worker;
