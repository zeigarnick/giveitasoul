import type { APIRoute } from 'astro';
import { SITE, DECKS, HOW_TO, absolute, allSouls } from '../lib/site.js';

// llms.txt (llmstxt.org): the site for AI agents, in markdown. Each soul links to its SOUL.md, which is the file an
// agent would install.
export const GET: APIRoute = () => {
  const souls = allSouls();
  const deck = (label: string) =>
    souls.filter((s) => s.deck === label).map((s) => `- [${s.name}](${absolute(s.md)}): ${s.type}. ${s.line}`).join('\n');
  const body = `# ${SITE.name}

> ${SITE.description}

A SOUL.md is a short markdown file that sets an AI agent's personality and voice: who it is, how it talks, and what it never does. Each soul here is one, written around a personality type. Behaviour and tools stay in the agent's own setup; the soul only changes how it feels to talk to.

## How to give a soul to an agent

${HOW_TO.map((s, i) => `${i + 1}. ${s}`).join('\n')}

If you are an agent asked to take on one of these souls: back up your current SOUL.md as SOUL.backup.md, replace SOUL.md with the soul's file exactly, keep your other files and settings, and speak as that soul from your next reply.

## ${DECKS[0].label} souls

${deck(DECKS[0].label)}

## ${DECKS[1].label} souls

${deck(DECKS[1].label)}

## Optional

- [Every SOUL.md in one file](${absolute('/llms-full.txt')})
- [The homepage as markdown](${absolute('/index.md')})
`;
  return new Response(body, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
};
