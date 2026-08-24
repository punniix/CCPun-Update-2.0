import assert from "node:assert/strict";

const BASE_URL = process.env.PRODUCTION_READ_BASE_URL ?? "http://127.0.0.1:3000";

const response = await fetch(`${BASE_URL}/`);
assert.equal(response.status, 200, `Homepage must return 200, received ${response.status}`);

const html = await response.text();
const pictureMatch = html.match(/<picture>[\s\S]*?<\/picture>/);
assert.ok(pictureMatch, "Homepage must render the responsive hero <picture> element");

const picture = pictureMatch[0];
assert.match(picture, /media="\(min-width: 768px\)"/);
assert.match(picture, /hero-pun-laptop-v3\.png/);
assert.match(picture, /hero-pun-laptop-mobile-v5\.webp/);
assert.match(picture, /loading="eager"/);
assert.match(picture, /fetchPriority="high"|fetchpriority="high"/);
assert.doesNotMatch(picture, /loading="lazy"/);

const imageTags = picture.match(/<img\b/g) ?? [];
assert.equal(imageTags.length, 1, "Responsive hero <picture> must contain one rendered <img> fallback");

console.log("PASS: rendered homepage LCP image markup");
