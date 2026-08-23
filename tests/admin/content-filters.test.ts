import assert from "node:assert/strict";
import test from "node:test";
import {
  filterContentRows,
  getContentFilterOptions,
  getContentTags,
  normalizeContentFilterParam,
  resolveContentFilters,
} from "../../lib/admin/content-filters";

const rows = [
  { id: "one", category: " ประกันชีวิต ", tags: [" ประกันสุขภาพ ", "ประกันสุขภาพ", ""] },
  { id: "two", category: "การเงินส่วนบุคคล", tags: ["Retirement", " วางแผนเกษียณ "] },
  { id: "three", category: "ประกันชีวิต", tags: ["ประกันโรคร้ายแรง", "retirement"] },
  { id: "four", category: null, tags: null },
] as const;

test("query parameters accept one trimmed string and reject ambiguous repeated values", () => {
  assert.equal(normalizeContentFilterParam("  ประกันชีวิต  "), "ประกันชีวิต");
  assert.equal(normalizeContentFilterParam(["ประกันชีวิต", "การลงทุน"]), "");
  assert.equal(normalizeContentFilterParam(undefined), "");
});

test("article tags drop missing values and case variants while preserving the first display form", () => {
  const source = [" Topic ", "Topic", "", "topic"];
  assert.deepEqual(getContentTags(source), ["Topic"]);
  assert.deepEqual(source, [" Topic ", "Topic", "", "topic"]);
  assert.deepEqual(getContentTags(null), []);
});

test("filter options come only from returned rows and keep first-seen tag display order", () => {
  const options = getContentFilterOptions(rows);
  assert.deepEqual(new Set(options.categories), new Set(["การเงินส่วนบุคคล", "ประกันชีวิต"]));
  assert.deepEqual(options.tags, ["ประกันสุขภาพ", "Retirement", "วางแผนเกษียณ", "ประกันโรคร้ายแรง"]);
});

test("category and tag filters use exact normalized keys rather than partial matches", () => {
  assert.deepEqual(
    filterContentRows(rows, { category: " ประกันชีวิต ", tag: " ประกันสุขภาพ " }).map((row) => row.id),
    ["one"],
  );
  assert.deepEqual(filterContentRows(rows, { tag: "ประกัน" }), []);
  assert.deepEqual(filterContentRows(rows, { tag: "RETIREMENT" }).map((row) => row.id), ["two", "three"]);
});

test("unknown or repeated query filters fail safely to the unfiltered view", () => {
  const unknown = resolveContentFilters(rows, { category: "unknown", tag: ["Retirement", "retirement"] });
  assert.equal(unknown.category, "");
  assert.equal(unknown.tag, "");
  assert.deepEqual(unknown.rows.map((row) => row.id), ["one", "two", "three", "four"]);
});

test("valid category and tag options can combine into a clear empty result", () => {
  const filtered = resolveContentFilters(rows, { category: "การเงินส่วนบุคคล", tag: "ประกันโรคร้ายแรง" });
  assert.equal(filtered.category, "การเงินส่วนบุคคล");
  assert.equal(filtered.tag, "ประกันโรคร้ายแรง");
  assert.deepEqual(filtered.rows, []);
});

test("a case-variant query resolves to the first canonical display option", () => {
  const filtered = resolveContentFilters(rows, { tag: "RETIREMENT" });
  assert.equal(filtered.tag, "Retirement");
  assert.deepEqual(filtered.rows.map((row) => row.id), ["two", "three"]);
});
