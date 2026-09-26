// The SOUL.md files, keyed by slug ("The Muse" -> "the-muse"). Bundled as raw text so the site can show,
// copy and download them without a fetch; the same files are served at /souls/<slug>.md.
const files = import.meta.glob('../data/souls/*.md', { query: '?raw', import: 'default', eager: true });

export const SOUL_FILES = Object.fromEntries(
  Object.entries(files).map(([path, text]) => [path.split('/').pop().replace(/\.md$/, ''), text]),
);

export const soulSlug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
