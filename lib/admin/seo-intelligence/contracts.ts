import { z } from "zod";

const isoDate = z.iso.date();

export const gscDimensionSchema = z.enum(["query", "page", "device", "country", "searchAppearance"]);

export const gscQueryInputSchema = z.object({
  siteUrl: z.string().trim().min(1).max(500),
  token: z.string().trim().min(1),
  startDate: isoDate,
  endDate: isoDate,
  dimensions: z.array(gscDimensionSchema).min(1).max(5),
  rowLimit: z.number().int().min(1).max(25_000).default(25_000),
}).superRefine((input, context) => {
  if (input.startDate > input.endDate) context.addIssue({ code: z.ZodIssueCode.custom, path: ["startDate"], message: "Start date must not follow end date" });
  if (new Set(input.dimensions).size !== input.dimensions.length) context.addIssue({ code: z.ZodIssueCode.custom, path: ["dimensions"], message: "Dimensions must be unique" });
});

export const gscSearchAnalyticsPageSchema = z.object({
  rows: z.array(z.object({
    keys: z.array(z.string()),
    clicks: z.number().nonnegative(),
    impressions: z.number().nonnegative(),
    ctr: z.number().min(0).max(1),
    position: z.number().nonnegative(),
  })).default([]),
}).passthrough();

export type GscDimension = z.infer<typeof gscDimensionSchema>;
export type GscNormalizedRow = {
  dimensions: Partial<Record<GscDimension, string>>;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export function previousEqualDateRange(startDate: string, endDate: string) {
  const start = Date.parse(`${startDate}T00:00:00Z`);
  const end = Date.parse(`${endDate}T00:00:00Z`);
  const days = Math.round((end - start) / 86_400_000) + 1;
  const previousEnd = new Date(start - 86_400_000);
  const previousStart = new Date(previousEnd.getTime() - (days - 1) * 86_400_000);
  return {
    startDate: previousStart.toISOString().slice(0, 10),
    endDate: previousEnd.toISOString().slice(0, 10),
  };
}

export function normalizeGscSearchAnalyticsPage(raw: unknown, dimensions: readonly GscDimension[]): GscNormalizedRow[] {
  return gscSearchAnalyticsPageSchema.parse(raw).rows.map((row) => {
    if (row.keys.length !== dimensions.length) throw new Error("GSC_DIMENSION_MISMATCH");
    return {
      dimensions: Object.fromEntries(dimensions.map((dimension, index) => [dimension, row.keys[index]!])),
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
    };
  });
}
