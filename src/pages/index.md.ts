import type { APIRoute } from 'astro';
import { SITE, DECKS, HOW_TO, absolute, allSouls, unquote } from '../lib/site.js';

// The homepage as markdown, for agents and readers that don't run the wheel.
export const GET: APIRoute = () => {
  const souls = allSouls();
  const deck = (label: string) =>
    souls
      .filter((s) => s.deck === label)
      .map((s) => `### [${s.name}](${absolute(s.page)})\n\n${s.type}. ${s.line}\n\n> ${unquote(s.says)}\n\nSOUL.md: ${absolute(s.md)}`)
      .join('\n\n');
  const body = `# ${SITE.tagline}

${SITE.description}

## How to give a soul to your agent

${HOW_TO.map((s, i) => `${i + 1}. ${s}`).join('\n')}

## ${DECKS[0].label} souls

${deck(DECKS[0].label)}

## ${DECKS[1].label} souls

${deck(DECKS[1].label)}
`;
  return new Response(body, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
};
