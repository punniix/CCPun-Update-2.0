export type GrowthComparisonMetric = {
  label: string;
  current: number;
  previous: number;
};

export function formatGrowthComparison(metrics: GrowthComparisonMetric[]): string | null {
  const parts = metrics.flatMap(({ label, current, previous }) => {
    if (!Number.isFinite(current) || !Number.isFinite(previous)) return [];
    if (previous === 0) return current === 0 ? [] : [`${label} เริ่มมีข้อมูล`];
    const change = ((current - previous) / previous) * 100;
    return [`${label} ${change >= 0 ? "+" : ""}${change.toFixed(1)}%`];
  });
  return parts.length ? parts.join(" · ") : null;
}
