import { readFile } from 'node:fs/promises';
import { createClient } from '@sanity/client';

const preparedPath = new URL('../../UAT-Reports/Published-Blog-Migration-2026-08-19/published-migration-prepared.json', import.meta.url);
const prepared = JSON.parse(await readFile(preparedPath, 'utf8'));
const projectId = process.env.SANITY_API_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.SANITY_API_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET;
const token = process.env.SANITY_API_READ_TOKEN || process.env.SANITY_API_WRITE_TOKEN;
if (!projectId || !dataset || !token) throw new Error('Missing Sanity config');
const client = createClient({ projectId, dataset, token, apiVersion: '2026-08-19', useCdn: false, perspective: 'raw' });
const norm = (s='') => String(s).replace(/\s+/g, ' ').trim();
const textOfBody = (body=[]) => {
  const parts=[];
  for (const b of body) {
    if (b?._type === 'block') parts.push((b.children||[]).map(c=>c.text||'').join(''));
    else if (b?._type === 'simpleTable') parts.push((b.headers||[]).join(' '), ...(b.rows||[]).map(r=>(r||[]).join(' ')));
    else if (b?._type === 'migratedImage' && b.caption) parts.push(b.caption);
    else if (b?._type === 'callout') parts.push(b.title||'', b.text||'');
  }
  return norm(parts.join(' '));
};
const articles = prepared.documents.filter(d=>d._type==='article');
const ids = articles.map(a=>a._id);
const rows = await client.fetch('*[_id in $ids]{_id,body}', {ids});
const byId = new Map(rows.map(r=>[r._id,r]));
const out=[];
for (const a of articles) {
  const expected=textOfBody(a.body);
  const actual=textOfBody(byId.get(a._id)?.body||[]);
  let i=0; while(i<expected.length&&i<actual.length&&expected[i]===actual[i]) i++;
  out.push({slug:a.slug.current,expectedLen:expected.length,actualLen:actual.length,exact:expected===actual,firstDiff:i,expectedSnippet:expected.slice(Math.max(0,i-60),i+120),actualSnippet:actual.slice(Math.max(0,i-60),i+120)});
}
console.log(JSON.stringify(out));
