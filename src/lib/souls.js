// The SOUL.md files, keyed by slug ("The Muse" -> "the-muse"). Bundled as raw text so the site can show,
// copy and download them without a fetch; the same files are served at /souls/<slug>.md.
const files = import.meta.glob('../data/souls/*.md', { query: '?raw', import: 'default', eager: true });

export const SOUL_FILES = Object.fromEntries(
  Object.entries(files).map(([path, text]) => [path.split('/').pop().replace(/\.md$/, ''), text]),
);

export const soulSlug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// What "Copy" puts on the clipboard: a short note asking the agent to install the soul, then the file itself.
// Download and /souls/<slug>.md stay the plain file.
export const soulPrompt = (name, md) => `Please make this your new SOUL.md, the file that sets your personality and voice.

1. If you already have a SOUL.md, save a copy of it as SOUL.backup.md.
2. Replace SOUL.md with everything between the two lines below, exactly as written.
3. Leave your other files, memory and settings as they are.
4. From your next reply on, talk as ${name}.

If you can't edit your own files, tell me where your personality or custom instructions live so I can paste it in myself.

----- SOUL.md -----
${md.trim()}
----- end of SOUL.md -----
`;
