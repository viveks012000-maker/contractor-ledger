import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

async function findHtmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async entry => {
    const entryPath = join(directory, entry.name);
    return entry.isDirectory()
      ? findHtmlFiles(entryPath)
      : entry.isFile() && entry.name.endsWith('.html')
        ? [entryPath]
        : [];
  }));
  return files.flat();
}

function hashesFor(htmlFiles, tagName) {
  const hashes = new Set();
  const tagPattern = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}\\s*>`, 'gi');

  for (const html of htmlFiles) {
    for (const match of html.matchAll(tagPattern)) {
      const body = match[1];
      if (body.trim()) {
        hashes.add(`'sha256-${createHash('sha256').update(body, 'utf8').digest('base64')}'`);
      }
    }
  }

  return [...hashes].sort();
}

const distDirectory = resolve('dist');
const htmlFiles = await findHtmlFiles(distDirectory);
if (htmlFiles.length === 0) {
  throw new Error('Cannot generate a Content Security Policy: no built HTML pages were found in dist/.');
}

const htmlContents = await Promise.all(htmlFiles.map(path => readFile(path, 'utf8')));
const scriptHashes = hashesFor(htmlContents, 'script');
const styleHashes = hashesFor(htmlContents, 'style');
if (scriptHashes.length === 0 || styleHashes.length === 0) {
  throw new Error('Cannot generate a Content Security Policy: expected inline Astro scripts and styles were not found in dist/.');
}

const contentSecurityPolicy = [
  "default-src 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  `script-src 'self' ${scriptHashes.join(' ')}`,
  "script-src-attr 'none'",
  `style-src 'self' https://fonts.googleapis.com ${styleHashes.join(' ')}`,
  "style-src-attr 'unsafe-inline'",
  "img-src 'self'",
  "font-src 'self' https://fonts.gstatic.com",
  "connect-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com",
  'upgrade-insecure-requests',
].join('; ');

const headersPath = resolve('dist/_headers');
const sections = (await readFile(headersPath, 'utf8')).trim().split(/\r?\n\s*\r?\n(?=\/)/);
const globalSectionIndex = sections.findIndex(section => section.split(/\r?\n/, 1)[0].trim() === '/*');
if (globalSectionIndex < 0) {
  throw new Error('Cannot add a Content Security Policy: dist/_headers has no global /* rule.');
}

const globalSection = sections[globalSectionIndex]
  .replace(/^\s*Content-Security-Policy\s*:\s*.*\r?\n?/gim, '')
  .trimEnd();
sections[globalSectionIndex] = `${globalSection}\n  Content-Security-Policy: ${contentSecurityPolicy}`;
await writeFile(headersPath, `${sections.join('\n\n')}\n`, 'utf8');

console.log(`Generated CSP for ${htmlFiles.length} HTML pages using ${scriptHashes.length} inline script hashes and ${styleHashes.length} inline style hashes.`);
