import { writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const CDP_HTTP = process.env.CDP_HTTP ?? 'http://127.0.0.1:9222';
const output = path.resolve(process.env.WP_DRAFT_EXPORT ?? path.join(tmpdir(), 'ccpun-wp-drafts-export.json'));
const targets = await fetch(`${CDP_HTTP}/json`).then((response) => response.json());
const target = targets.find((item) => item.type === 'page' && item.url.startsWith('https://blog.ccpun.com/wp-admin/'));
if (!target?.webSocketDebuggerUrl) throw new Error('Open the authenticated blog.ccpun.com WordPress admin in Chrome first.');

const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});

const result = await new Promise((resolve, reject) => {
  const id = 1;
  const timeout = setTimeout(() => reject(new Error('WordPress draft export timed out.')), 30000);
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.id !== id) return;
    clearTimeout(timeout);
    if (message.error || message.result?.exceptionDetails) reject(new Error('WordPress draft export failed in browser context.'));
    else resolve(message.result.result.value);
  });
  socket.send(JSON.stringify({
    id,
    method: 'Runtime.evaluate',
    params: {
      awaitPromise: true,
      returnByValue: true,
      expression: `(${async function exportDrafts() {
        const nonce = window.wpApiSettings?.nonce;
        if (!nonce) throw new Error('WordPress REST nonce unavailable');
        const getResponse = async (url) => {
          const response = await fetch(url, { headers: { 'X-WP-Nonce': nonce }, credentials: 'same-origin' });
          if (!response.ok) throw new Error(`WordPress REST ${response.status}`);
          return response;
        };
        const get = async (url) => (await getResponse(url)).json();
        const getAll = async (url) => {
          const items = [];
          let page = 1;
          let totalPages = 1;
          do {
            const separator = url.includes('?') ? '&' : '?';
            const response = await getResponse(`${url}${separator}per_page=100&page=${page}`);
            items.push(...await response.json());
            totalPages = Math.max(1, Number(response.headers.get('X-WP-TotalPages')) || 1);
            page += 1;
          } while (page <= totalPages);
          return items;
        };
        const getOptional = async (url) => {
          const response = await fetch(url, { headers: { 'X-WP-Nonce': nonce }, credentials: 'same-origin' });
          if ([401, 403, 404].includes(response.status)) return null;
          if (!response.ok) throw new Error(`WordPress REST ${response.status}`);
          return response.json();
        };
        const [posts, categories, tags] = await Promise.all([
          getAll('/wp-json/wp/v2/posts?status=draft&context=edit&_fields=id,slug,status,title,content,excerpt,author,categories,tags,featured_media,date,modified,meta,rank_math_title,rank_math_description,rank_math_focus_keyword,rank_math_canonical_url,rank_math_robots'),
          getAll('/wp-json/wp/v2/categories?context=edit&_fields=id,name,slug'),
          getAll('/wp-json/wp/v2/tags?context=edit&_fields=id,name,slug'),
        ]);
        const mediaIds = [...new Set(posts.map((post) => post.featured_media).filter(Boolean))];
        const authorIds = [...new Set(posts.map((post) => post.author).filter(Boolean))];
        const media = await Promise.all(mediaIds.map((id) => get(`/wp-json/wp/v2/media/${id}?context=edit&_fields=id,source_url,alt_text,caption,media_details`)));
        const authors = (await Promise.all(authorIds.map((id) => getOptional(`/wp-json/wp/v2/users/${id}?context=edit&_fields=id,name,slug,description,url,link`)))).filter(Boolean);
        const byId = (items) => Object.fromEntries(items.map((item) => [item.id, item]));
        const categoryMap = byId(categories);
        const tagMap = byId(tags);
        const mediaMap = byId(media);
        const authorMap = byId(authors);
        const scalar = (value) => Array.isArray(value) ? value[0] : value;
        const rankMathFor = (post) => {
          const meta = post.meta && typeof post.meta === 'object' ? post.meta : {};
          const value = (name) => scalar(post[name] ?? meta[name]);
          const rankMath = {
            title: value('rank_math_title'),
            description: value('rank_math_description'),
            focusKeyword: value('rank_math_focus_keyword'),
            canonical: value('rank_math_canonical_url'),
            robots: value('rank_math_robots'),
          };
          return Object.values(rankMath).some((item) => item !== undefined && item !== null && item !== '') ? rankMath : null;
        };
        return {
          source: 'https://blog.ccpun.com',
          exportedAt: new Date().toISOString(),
          posts: posts.map((post) => ({
            wpId: post.id,
            slug: post.slug || `wp-draft-${post.id}`,
            status: post.status,
            title: post.title?.raw || post.title?.rendered || '',
            contentHtml: post.content?.raw || post.content?.rendered || '',
            excerptHtml: post.excerpt?.raw || post.excerpt?.rendered || '',
            authorId: post.author,
            author: authorMap[post.author]
              ? {
                  id: authorMap[post.author].id,
                  name: authorMap[post.author].name || '',
                  slug: authorMap[post.author].slug || '',
                  description: authorMap[post.author].description || '',
                  url: authorMap[post.author].url || '',
                  link: authorMap[post.author].link || '',
                }
              : { id: post.author },
            categories: post.categories.map((id) => categoryMap[id]).filter(Boolean).map(({ id, name, slug }) => ({ id, name, slug })),
            tags: post.tags.map((id) => tagMap[id]).filter(Boolean).map(({ id, name, slug }) => ({ id, name, slug })),
            rankMath: rankMathFor(post),
            featuredImage: mediaMap[post.featured_media]
              ? {
                  id: mediaMap[post.featured_media].id,
                  sourceUrl: mediaMap[post.featured_media].source_url,
                  alt: mediaMap[post.featured_media].alt_text || '',
                  caption: mediaMap[post.featured_media].caption?.raw || mediaMap[post.featured_media].caption?.rendered || '',
                  width: mediaMap[post.featured_media].media_details?.width || null,
                  height: mediaMap[post.featured_media].media_details?.height || null,
                }
              : null,
            date: post.date,
            modified: post.modified,
          })),
        };
      }.toString()})()`,
    },
  }));
});

socket.close();
if (!Array.isArray(result?.posts) || result.posts.some((post) => post.status !== 'draft')) {
  throw new Error('Export safety check failed: expected WordPress drafts only.');
}
await writeFile(output, `${JSON.stringify({ ...result, count: result.posts.length }, null, 2)}\n`, { mode: 0o600 });
console.log(`PASS: exported ${result.posts.length} WordPress drafts to ${output}; no WordPress content was changed`);
