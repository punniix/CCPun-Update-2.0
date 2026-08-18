import { writeFile } from 'node:fs/promises';
import path from 'node:path';

const CDP_HTTP = process.env.CDP_HTTP ?? 'http://127.0.0.1:9222';
const output = path.resolve(process.env.WP_DRAFT_EXPORT ?? 'wp-drafts-export.json');
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
        const get = async (url) => {
          const response = await fetch(url, { headers: { 'X-WP-Nonce': nonce }, credentials: 'same-origin' });
          if (!response.ok) throw new Error(`WordPress REST ${response.status}`);
          return response.json();
        };
        const [posts, categories, tags] = await Promise.all([
          get('/wp-json/wp/v2/posts?status=draft&per_page=100&context=edit&_fields=id,slug,status,title,content,excerpt,author,categories,tags,featured_media,date,modified'),
          get('/wp-json/wp/v2/categories?per_page=100&context=edit&_fields=id,name,slug'),
          get('/wp-json/wp/v2/tags?per_page=100&context=edit&_fields=id,name,slug'),
        ]);
        const mediaIds = [...new Set(posts.map((post) => post.featured_media).filter(Boolean))];
        const media = await Promise.all(mediaIds.map((id) => get(`/wp-json/wp/v2/media/${id}?context=edit&_fields=id,source_url,alt_text,caption,media_details`)));
        const byId = (items) => Object.fromEntries(items.map((item) => [item.id, item]));
        const categoryMap = byId(categories);
        const tagMap = byId(tags);
        const mediaMap = byId(media);
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
            categories: post.categories.map((id) => categoryMap[id]).filter(Boolean).map(({ id, name, slug }) => ({ id, name, slug })),
            tags: post.tags.map((id) => tagMap[id]).filter(Boolean).map(({ id, name, slug }) => ({ id, name, slug })),
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
