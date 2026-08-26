import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ledger = JSON.parse(readFileSync(new URL('./legacy-url-ledger.json', import.meta.url), 'utf8'));
const seenIds = new Set();
const seenSources = new Set();
const seenDestinations = new Set();
let livePassed = 0;
let candidatesReviewed = 0;
let plannedReviewed = 0;

function canonical(html) {
  const tag = (html.match(/<link\b[^>]*>/gi) ?? []).find((item) => /\brel=["']canonical["']/i.test(item)) ?? '';
  return tag.match(/\bhref=["']([^"']+)/i)?.[1] ?? '';
}

function language(html) {
  return html.match(/<html\b[^>]*\blang=["']([^"']*)["']/i)?.[1] ?? '';
}

function robots(html) {
  const tag = (html.match(/<meta\b[^>]*>/gi) ?? []).find((item) => /\bname=["']robots["']/i.test(item)) ?? '';
  return tag.match(/\bcontent=["']([^"']*)/i)?.[1] ?? '';
}

async function request(url, redirect = 'manual') {
  return fetch(url, {
    redirect,
    signal: AbortSignal.timeout(15000),
    headers: { 'user-agent': 'CCPun legacy URL regression/2.0' },
  });
}

for (const mapping of ledger.mappings) {
  assert.ok(['live', 'candidate', 'planned'].includes(mapping.state), `${mapping.id}: unsupported ledger state`);
  assert.equal(seenIds.has(mapping.id), false, `duplicate ledger id: ${mapping.id}`);
  seenIds.add(mapping.id);
  assert.equal(seenSources.has(mapping.source), false, `duplicate legacy source: ${mapping.source}`);
  seenSources.add(mapping.source);
  if (mapping.state === 'live') {
    assert.equal(seenDestinations.has(mapping.destination), false, `duplicate final destination: ${mapping.destination}`);
    seenDestinations.add(mapping.destination);
  }

  if (mapping.state === 'planned') {
    assert.ok(mapping.plannedDestination, `${mapping.id}: planned mapping requires plannedDestination`);
    assert.notEqual(mapping.destination, mapping.plannedDestination, `${mapping.id}: planned final URL must differ from current destination`);
    const source = await request(mapping.source);
    assert.equal(source.status, mapping.sourceStatus, `${mapping.id}: current legacy source status drifted before cutover`);
    const location = source.headers.get('location');
    assert.ok(location, `${mapping.id}: current legacy redirect location missing before cutover`);
    assert.equal(new URL(location, mapping.source).href, mapping.destination, `${mapping.id}: current legacy target drifted before cutover`);

    const current = await request(mapping.destination, 'follow');
    const currentHtml = await current.text();
    assert.equal(current.status, 200, `${mapping.id}: current canonical is unhealthy before cutover`);
    assert.equal(canonical(currentHtml), mapping.destination, `${mapping.id}: current canonical drifted before cutover`);
    assert.equal(language(currentHtml), 'th', `${mapping.id}: current HTML language drifted before cutover`);
    assert.doesNotMatch(robots(currentHtml), /noindex/i, `${mapping.id}: current URL became noindex before cutover`);
    console.log(`PLANNED ${mapping.destination} -> ${mapping.plannedDestination} (cutover gate not yet released)`);
    plannedReviewed += 1;
    continue;
  }

  const source = await request(mapping.source);
  assert.equal(source.status, mapping.sourceStatus, `${mapping.id}: unexpected legacy status`);

  if (mapping.state === 'live') {
    const location = source.headers.get('location');
    assert.ok(location, `${mapping.id}: redirect location is missing`);
    assert.equal(new URL(location, mapping.source).href, mapping.destination, `${mapping.id}: redirect target drifted`);

    if (mapping.preserveQueryString) {
      const queryProbe = new URL(mapping.source);
      queryProbe.searchParams.set('ccpun_redirect_probe', '1');
      queryProbe.searchParams.set('legacy_source', mapping.id);
      const querySource = await request(queryProbe);
      assert.equal(querySource.status, mapping.sourceStatus, `${mapping.id}: query probe did not keep one-hop redirect status`);
      const queryLocation = querySource.headers.get('location');
      assert.ok(queryLocation, `${mapping.id}: query probe redirect location is missing`);
      const expectedQueryDestination = new URL(mapping.destination);
      expectedQueryDestination.search = queryProbe.search;
      assert.equal(
        new URL(queryLocation, queryProbe).href,
        expectedQueryDestination.href,
        `${mapping.id}: redirect dropped or changed the query string`,
      );
    }

    livePassed += 1;
  } else {
    const sourceHtml = await source.text();
    assert.equal(canonical(sourceHtml), mapping.sourceCanonical, `${mapping.id}: legacy canonical drifted before cutover`);
    const destinationHtml = await (await request(mapping.destination, 'follow')).text();
    for (const slug of mapping.overlapSlugs) {
      assert.ok(sourceHtml.includes(slug) && destinationHtml.includes(slug), `${mapping.id}: hub overlap evidence missing ${slug}`);
    }
    console.log(`CANDIDATE ${mapping.source} -> ${mapping.destination} (xhigh owner-layer review required)`);
    candidatesReviewed += 1;
  }

  const destination = await request(mapping.destination);
  const destinationHtml = await destination.text();
  assert.equal(destination.status, mapping.destinationStatus, `${mapping.id}: final URL is not healthy`);
  assert.equal(canonical(destinationHtml), mapping.destination, `${mapping.id}: final canonical drifted`);
  assert.equal(language(destinationHtml), 'th', `${mapping.id}: final HTML language drifted`);
  assert.doesNotMatch(robots(destinationHtml), /noindex/i, `${mapping.id}: final URL became noindex`);
  assert.doesNotMatch(destination.headers.get('x-robots-tag') ?? '', /noindex/i, `${mapping.id}: final URL gained an X-Robots-Tag noindex`);
  console.log(`PASS ${mapping.id}`);
}

console.log(`PASS: live legacy mappings ${livePassed}/${ledger.mappings.filter(({ state }) => state === 'live').length}`);
if (plannedReviewed) console.log(`PLANNED: URL cutovers ${plannedReviewed}`);
if (candidatesReviewed) console.log(`REVIEW_REQUIRED: candidate mappings ${candidatesReviewed}`);
