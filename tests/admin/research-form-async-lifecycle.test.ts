import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const manualForm = readFileSync("features/admin/components/ResearchSnapshotForm.tsx", "utf8");
const ubersuggestForm = readFileSync("features/admin/components/UbersuggestResearchForm.tsx", "utf8");

test("manual research form retains the form element across async save", () => {
  assert.match(manualForm, /const formElement = event\.currentTarget/);
  assert.match(manualForm, /new FormData\(formElement\)/);
  assert.match(manualForm, /formElement\.reset\(\)/);
  assert.doesNotMatch(manualForm, /event\.currentTarget\.reset\(\)/);
});

test("Ubersuggest research form retains the form element across async provider query", () => {
  assert.match(ubersuggestForm, /const formElement = event\.currentTarget/);
  assert.match(ubersuggestForm, /new FormData\(formElement\)/);
  assert.match(ubersuggestForm, /formElement\.reset\(\)/);
  assert.doesNotMatch(ubersuggestForm, /event\.currentTarget\.reset\(\)/);
});
