import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { transform } from 'esbuild';
import sharp from 'sharp';

const hash = bytes => createHash('sha256').update(bytes).digest('hex').slice(0, 24);
const notice = text => text.replace(/\/\*(?!\!)([\s\S]*?)\*\//g, (comment, body) => /license|copyright|\bOFL\b/i.test(body) ? '/*!' + body + '*/' : comment);

/** Compile a separate, versioned website delivery; never rewrite downloadable originals. */
export async function buildSiteMotion({ root = process.cwd(), slugs } = {}) {
  root = path.resolve(root);
  const folder = path.join(root, 'public/assets/motion');
  await fs.mkdir(folder, { recursive: true });
  if (await fs.realpath(folder) !== folder) throw new Error('Motion output must not be a symlink');
  if (!slugs) slugs = JSON.parse(await fs.readFile(path.join(root, 'src/data/interaction-previews.json'), 'utf8')).filter(entry => entry.sourceFile).map(entry => entry.slug);
  const output = { schemaVersion: 1, chineseFontStylesheet: '', components: {} };
  const lengths = new Map(), images = new Map();
  async function asset(bytes, extension, prefix = '') {
    bytes = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
    const url = `/assets/motion/${prefix}${hash(bytes)}.${extension}`;
    const target = path.join(root, 'public', url);
    // Byte-for-byte hashes make old releases safe to retain and share.
    await fs.writeFile(target, bytes);
    lengths.set(url, /^(?:js|css|html)$/.test(extension) ? gzipSync(bytes).length : bytes.length);
    return url;
  }
  async function compile(source, slug, variant) {
    const resources = new Set();
    let html = source;
    const googleFonts = /@import\s+url\(["']?https:\/\/fonts\.googleapis\.com[^)]*\)\s*;/gi;
    if (googleFonts.test(html)) {
      const localFont = await fs.readFile(path.join(root, 'src/lib/ShareInvite/share-invite.css'), 'utf8');
      const license = localFont.match(/^\s*\/\*[\s\S]*?\*\//)?.[0] || '';
      const faces = [...localFont.matchAll(/@font-face\s*\{[^}]*\}/g)].map(match => match[0].replaceAll('ShareInviteInter', 'Inter')).join('\n');
      if (!faces) throw new Error('Missing licensed local Inter font');
      html = html.replace(googleFonts, '').replace(/<\/head>/i, `<style>${license}\n${faces}</style></head>`);
    }
    const urls = [...new Set([...html.matchAll(/data:([\w.+-]+\/[\w.+-]+);base64,[A-Za-z0-9+/=]+/g)].map(match => match[0]))];
    for (const url of urls) {
      const mime = url.slice(5, url.indexOf(';'));
      const bytes = Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');
      if (/font|woff|opentype/i.test(mime)) {
        const extension = /woff2/i.test(mime) ? 'woff2' : 'woff';
        const font = await asset(bytes, extension);
        resources.add(font); html = html.split(url).join(font);
      } else if (/^image\/(?:png|jpeg|webp)$/.test(mime)) {
        const width = slug === 'crumpled-paper' || slug === 'brand-poster-cards' ? 800 : slug === 'album-cover-tunnel' ? 512 : slug === 'spider-music-player' ? 480 : 1024;
        const key = hash(bytes) + ':' + width;
        if (!images.has(key)) images.set(key, (async () => {
          const meta = await sharp(bytes).metadata();
          if (meta.pages > 1 || (mime === 'image/webp' && meta.width <= width)) return url;
          const encoded = await sharp(bytes).resize({ width, withoutEnlargement: true }).webp({ quality: 88, effort: 5, lossless: mime === 'image/png' }).toBuffer();
          return encoded.length < bytes.length ? 'data:image/webp;base64,' + encoded.toString('base64') : url;
        })());
        html = html.split(url).join(await images.get(key));
      }
    }
    // Keep image data URLs origin-clean in opaque sandboxed frames. Font files
    // use CORS; their original bytes and all associated license notices remain.
    const styles = [...html.matchAll(/<style\b([^>]*)>([\s\S]*?)<\/style>/gi)];
    for (const match of styles) {
      const result = await transform(notice(match[2]), { loader: 'css', minify: true, legalComments: 'inline' });
      const url = await asset(result.code, 'css'); resources.add(url);
      html = html.replace(match[0], `<link rel="stylesheet" href="${url}">`);
    }
    const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
    for (const match of scripts) {
      if (/\bsrc\s*=/.test(match[1]) || !match[2].trim() || /type\s*=\s*["'](?:application|text)\//i.test(match[1])) continue;
      const result = await transform(notice(match[2]), { loader: 'js', target: 'es2020', minify: true, legalComments: 'inline' });
      const url = await asset(result.code, 'js'); resources.add(url);
      // Classic scripts keep their original execution order and global scope.
      html = html.replace(match[0], `<script${match[1]} src="${url}"></script>`);
    }
    const url = await asset(html, 'html', `${slug}${variant ? '-preview' : ''}-`);
    return { url, resources: [...resources], gzipBytes: lengths.get(url), totalGzipBytes: lengths.get(url) + [...resources].reduce((sum, ref) => sum + lengths.get(ref), 0) };
  }
  for (const slug of slugs) {
    if (!/^[a-z0-9-]+$/.test(slug)) throw new Error(`Invalid motion slug: ${slug}`);
    const original = await fs.readFile(path.join(root, 'public/motion', `${slug}.html`), 'utf8');
    // The existing album scene already supports progressive texture upgrades.
    // Both website surfaces can share it; the full-resolution offline file remains.
    const siteSource = slug === 'album-cover-tunnel'
      ? await fs.readFile(path.join(root, 'public/motion/album-cover-tunnel-preview.html'), 'utf8') : original;
    const document = await compile(siteSource, slug, false);
    const deferred = [...new Set([...siteSource.matchAll(/\/assets\/optimized\/album-cover-tunnel-textures-[a-f0-9]{12}\.js/g)].map(match => match[0]))];
    const deferredBytes = (await Promise.all(deferred.map(async url => gzipSync(await fs.readFile(path.join(root, 'public', url))).length))).reduce((sum, size) => sum + size, 0);
    output.components[slug] = { documentUrl: document.url, previewUrl: document.url, originalGzipBytes: gzipSync(original).length, documentGzipBytes: document.gzipBytes, initialGzipBytes: document.totalGzipBytes, totalGzipBytes: document.totalGzipBytes + deferredBytes, deferredResources: deferred, resources: document.resources };
  }
  output.chineseFontStylesheet = await asset(await fs.readFile(path.join(root, 'public/fonts/misans.css')), 'css');
  const client = { chineseFontStylesheet: output.chineseFontStylesheet, components: Object.fromEntries(Object.entries(output.components).map(([slug, entry]) => [slug, { documentUrl: entry.documentUrl, previewUrl: entry.previewUrl }])) };
  await fs.mkdir(path.join(root, 'src/data'), { recursive: true });
  await fs.writeFile(path.join(root, 'src/data/site-motion.json'), JSON.stringify(client, null, 2) + '\n');
  await fs.writeFile(path.join(root, 'public/site-motion-manifest.json'), JSON.stringify(output, null, 2) + '\n');
  // A new export must not republish obsolete build files indefinitely. Remote
  // retirement remains subject to the deployment grace period and rollback set.
  for (const entry of await fs.readdir(folder, { withFileTypes: true })) {
    if (entry.isFile() && /^(?:[a-z0-9-]+-)?[a-f0-9]{24}\.(?:html|js|css|woff2?)$/.test(entry.name) && !lengths.has('/assets/motion/' + entry.name)) {
      await fs.unlink(path.join(folder, entry.name));
    }
  }
  console.log(`Built ${slugs.length} versioned site documents; offline HTML and framework packages retained.`);
  return output;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await buildSiteMotion();
