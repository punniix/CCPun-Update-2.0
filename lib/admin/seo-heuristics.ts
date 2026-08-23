export const SEO_AUDIT_VERSION = 2;
export const SEO_TITLE_MIN = 30;
export const SEO_TITLE_MAX = 60;
export const META_DESCRIPTION_MIN = 130;
export const META_DESCRIPTION_MAX = 160;

const thaiGraphemes = new Intl.Segmenter("th", { granularity: "grapheme" });

export function countGraphemes(value: string) {
  return [...thaiGraphemes.segment(value)].length;
}

function questionKey(value: string) {
  return value.toLocaleLowerCase("th-TH").replace(/[?？!！.。]+$/u, "").replace(/\s+/g, " ").trim();
}

export function countMatchingQuestions(keyQuestions: string[], faqQuestions: string[]) {
  const faqKeys = new Set(faqQuestions.map(questionKey).filter(Boolean));
  return new Set(keyQuestions.map(questionKey).filter((key) => key && faqKeys.has(key))).size;
}

export function isReviewDateFresh(value: string | null | undefined, now = Date.now(), maxAgeDays = 180) {
  const reviewedAt = value ? Date.parse(value) : Number.NaN;
  const age = now - reviewedAt;
  return Number.isFinite(reviewedAt) && age >= 0 && age <= maxAgeDays * 24 * 60 * 60 * 1000;
}

function strings(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function seoBodyFacts(blocks: Array<Record<string, unknown>> | null | undefined) {
  const safeBlocks = blocks ?? [];
  const textParts: string[] = [];
  const links: string[] = [];

  for (const block of safeBlocks) {
    const children = Array.isArray(block.children) ? block.children : [];
    for (const child of children) {
      if (child && typeof child === "object" && typeof (child as { text?: unknown }).text === "string") textParts.push((child as { text: string }).text);
    }
    for (const field of [block.title, block.text, block.label, block.description, block.summary]) {
      if (typeof field === "string") textParts.push(field);
    }
    textParts.push(...strings(block.headers));
    if (Array.isArray(block.rows)) {
      for (const row of block.rows) {
        if (row && typeof row === "object") textParts.push(...strings((row as { cells?: unknown }).cells));
      }
    }
    const markDefs = Array.isArray(block.markDefs) ? block.markDefs : [];
    for (const mark of markDefs) {
      if (mark && typeof mark === "object" && typeof (mark as { href?: unknown }).href === "string") links.push((mark as { href: string }).href);
    }
    if (typeof block.url === "string") links.push(block.url);
  }

  return {
    text: textParts.join(" ").replace(/\s+/g, " ").trim(),
    h2Count: safeBlocks.filter((block) => block.style === "h2").length,
    h3Count: safeBlocks.filter((block) => block.style === "h3").length,
    links: links.filter(Boolean),
    bodyTypes: safeBlocks.map((block) => typeof block._type === "string" ? block._type : ""),
  };
}
