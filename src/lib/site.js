// What the site is, said once: page titles, meta tags, structured data, llms.txt and the sitemap all read from here.
import { MBTI, ENNEAGRAM } from '../data/souls.js';
import { SOUL_FILES, soulSlug } from './souls.js';

export const SITE = {
  name: 'giveitasoul',
  url: 'https://giveitasoul.com',
  title: 'giveitasoul — give your AI agents a soul',
  tagline: 'Give your AI agents a soul.',
  description:
    'Pick a personality for your personal AI agent. Spin through 16 MBTI souls or 9 Enneagram souls, meet one, and give it to your agent as a SOUL.md.',
  creator: { name: 'Nick Sng', handle: '@wzsng', url: 'https://x.com/wzsng' },
};

export const DECKS = [
  { key: 'mbti', label: 'MBTI', souls: MBTI },
  { key: 'ennea', label: 'Enneagram', souls: ENNEAGRAM },
];

// a soul's type in words: "INFJ", or "Type 1" for an Enneagram soul (its card says "TYPE 1")
export const typeLabel = (soul) => (soul.num ? `Type ${soul.num}` : soul.anchor);

// every soul with its type in words and the addresses it's served at
export const allSouls = () =>
  DECKS.flatMap((deck) =>
    deck.souls.map((soul) => {
      const slug = soulSlug(soul.name);
      return { ...soul, type: typeLabel(soul), deck: deck.label, slug, page: `/souls/${slug}/`, md: `/souls/${slug}.md`, file: SOUL_FILES[slug] || '' };
    }),
  );

// the creator as structured data, for a page's author
export const creatorLd = () => ({ '@type': 'Person', name: SITE.creator.name, url: SITE.creator.url, sameAs: [SITE.creator.url] });

export const absolute = (path) => new URL(path, SITE.url).href;

// "“Before we fix it…”" -> "Before we fix it…"
export const unquote = (s) => (s || '').replace(/^[“"]|[”"]$/g, '');

// How to hand a soul to an agent, in words both people and agents can follow.
export const HOW_TO = [
  'Paste it into a chat: open a soul and press Copy. The copied text asks the agent to back up its current SOUL.md and save the new one.',
  'Save it yourself: download the file and save it as SOUL.md wherever your agent keeps its setup, or paste it into its personality or custom-instructions settings.',
  'Link it: if your agent can read the web, give it the soul’s .md link and say "Make this your SOUL.md."',
];
