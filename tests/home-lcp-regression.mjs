import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const hero = readFileSync(new URL("../components/HeroSection.tsx", import.meta.url), "utf8");

assert.match(hero, /import Image, \{ getImageProps \} from "next\/image";/);
assert.match(hero, /src: "\/assets\/hero-pun-laptop-v3\.png"/);
assert.match(hero, /quality: 90/);
assert.match(hero, /loading: "eager"/);
assert.match(hero, /fetchPriority: "high"/);

assert.match(hero, /<picture>/);
assert.match(hero, /media="\(min-width: 768px\)"/);
assert.match(hero, /srcSet=\{desktopHeroImageProps\.srcSet\}/);
assert.match(hero, /sizes=\{desktopHeroImageProps\.sizes\}/);
assert.match(hero, /src="\/assets\/hero-pun-laptop-mobile-v5\.webp"/);
assert.match(hero, /loading="eager"/);
assert.match(hero, /fetchPriority="high"/);
assert.doesNotMatch(hero, /loading="lazy"/);

const portraitMarkers = hero.match(/data-uat-role="hero-portrait"/g) ?? [];
assert.equal(portraitMarkers.length, 1, "Homepage must expose one responsive hero portrait wrapper");

const imageComponents = hero.match(/<Image\b/g) ?? [];
assert.equal(imageComponents.length, 1, "Responsive art direction must use one fallback Image element");

assert.match(
  hero,
  /className="absolute inset-x-0 top-20 aspect-\[4\/3\] overflow-hidden md:inset-0 md:aspect-auto"/,
  "Hero portrait geometry must remain 4:3 below the mobile top offset and full-bleed on desktop",
);
assert.match(
  hero,
  /className="absolute inset-0 h-full w-full object-cover object-center md:object-\[62%_center\]"/,
  "Mobile and desktop object positions must preserve the approved crop",
);
assert.match(hero, /className="pointer-events-none absolute inset-0 md:hidden"/);
assert.match(hero, /className="pointer-events-none absolute inset-0 hidden md:block"/);

console.log("PASS: homepage responsive LCP image loading contract");
