import assert from "node:assert/strict";
import test from "node:test";
import { serializeJsonLd } from "../../lib/content/structured-data/serialize-json-ld";

test("JSON-LD cannot break out of its script element", () => {
  const payload = { title: "</script><script>alert(1)</script>\u2028\u2029" };
  const serialized = serializeJsonLd(payload);

  assert.equal(serialized.includes("</script>"), false);
  assert.deepEqual(JSON.parse(serialized), payload);
});
