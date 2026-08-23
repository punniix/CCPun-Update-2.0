export type ContentFilterParams = {
  category?: string | string[];
  tag?: string | string[];
};

type FilterableContentRow = {
  category?: string | null;
  tags?: readonly string[] | null;
};

export function normalizeContentFilterParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function tagKey(value: string) {
  return value.trim().toLowerCase();
}

export function getContentTags(tags: readonly string[] | null | undefined) {
  const seen = new Set<string>();
  const cleanedTags: string[] = [];

  for (const value of tags ?? []) {
    const tag = value.trim();
    const key = tagKey(tag);
    if (!tag || seen.has(key)) continue;

    seen.add(key);
    cleanedTags.push(tag);
  }

  return cleanedTags;
}

function uniqueSorted(values: readonly string[]) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right, "th"));
}

function uniqueTags(values: readonly string[]) {
  return getContentTags(values);
}

export function getContentFilterOptions(rows: readonly FilterableContentRow[]) {
  return {
    categories: uniqueSorted(
      rows
        .map((row) => row.category?.trim() ?? "")
        .filter(Boolean),
    ),
    tags: uniqueTags(rows.flatMap((row) => getContentTags(row.tags))),
  };
}

export function filterContentRows<T extends FilterableContentRow>(
  rows: readonly T[],
  filters: { category?: string; tag?: string },
) {
  const category = filters.category?.trim() ?? "";
  const tag = filters.tag?.trim() ?? "";
  const selectedTagKey = tagKey(tag);

  return rows.filter((row) => {
    const matchesCategory = !category || row.category?.trim() === category;
    const matchesTag = !tag || getContentTags(row.tags).some((value) => tagKey(value) === selectedTagKey);
    return matchesCategory && matchesTag;
  });
}

export function resolveContentFilters<T extends FilterableContentRow>(
  rows: readonly T[],
  params: ContentFilterParams,
) {
  const { categories, tags } = getContentFilterOptions(rows);
  const requestedCategory = normalizeContentFilterParam(params.category);
  const requestedTag = normalizeContentFilterParam(params.tag);
  const category = categories.includes(requestedCategory) ? requestedCategory : "";
  const requestedTagKey = tagKey(requestedTag);
  const tag = tags.find((value) => tagKey(value) === requestedTagKey) ?? "";

  return {
    categories,
    tags,
    category,
    tag,
    rows: filterContentRows(rows, { category, tag }),
  };
}
