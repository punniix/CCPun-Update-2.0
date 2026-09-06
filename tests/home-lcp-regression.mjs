import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const home = readFileSync(new URL("../features/home/website-43/Website43Home.tsx", import.meta.url), "utf8");
const route = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
assert.match(route, /<Website43Home/);
const hero = home.split('<section id="home"')[1].split('</section>')[0];
assert.match(hero, /home-hero-desktop\.png/);
assert.match(hero, /loading="eager"/);
assert.match(hero, /fetchPriority="high"/);
assert.match(hero, /sizes="100vw"/);
assert.doesNotMatch(hero, /loading="lazy"/);
assert.equal((hero.match(/<Image\b/g) ?? []).length, 1, "Home hero must request one responsive image");
assert.match(home, /<main id="main-content" tabIndex=\{\-1\}>/);
assert.match(route, /mainEntity: homeFaqs\.map/);
assert.match(home, /homeFaqs as faqs/);
assert.doesNotMatch(home, /\/preview\//);
console.log("PASS: approved Home responsive LCP and FAQ composition contract");
