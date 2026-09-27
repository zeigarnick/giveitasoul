import type { APIRoute, GetStaticPaths } from 'astro';
import { allSouls } from '../lib/site.js';

// Cloudflare Pages' _headers file: the files agents read are served as markdown with a UTF-8 charset, and can be
// fetched from any origin (so browser-based agents can read them too). Built here so every soul's file is listed.
export const getStaticPaths = (() => [{ params: { file: '_headers' } }]) satisfies GetStaticPaths;

export const GET: APIRoute = () => {
  const md = ['/llms.txt', '/llms-full.txt', '/index.md', ...allSouls().map((s) => s.md)];
  const body = md.map((p) => `${p}\n  Content-Type: text/markdown; charset=utf-8\n  Access-Control-Allow-Origin: *\n`).join('\n')
    + `\n/og/*\n  Cache-Control: public, max-age=86400\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
