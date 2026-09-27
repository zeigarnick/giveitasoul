import type { APIRoute } from 'astro';
import { SITE, absolute, allSouls } from '../lib/site.js';

// llms-full.txt: every SOUL.md in one file, each introduced by where it lives.
export const GET: APIRoute = () => {
  const body = [
    `# ${SITE.name}: every soul\n\n> ${SITE.description}\n`,
    ...allSouls().map((s) => `---\n\nSource: ${absolute(s.md)} (${s.deck} · ${s.type})\n\n${s.file.trim()}\n`),
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
};
