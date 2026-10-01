# giveitasoul

**A personality picker for AI agents. Spin a wheel of cards, pick a soul, hand your agent a SOUL.md.**

[giveitasoul.com](https://giveitasoul.com) · made by [Nick Sng](https://x.com/wzsng)

## Why I made this

Personal AI agents like Instinct, Muse and Grokbot are taking off, and the more of them I used, the more I noticed that the thing that makes one feel like *someone* is its SOUL.md: the short file that tells it who it is, how it talks and what it cares about. Most people never write one, so their agent sounds like everybody else's.

So I set out to make picking one fun. giveitasoul has 25 ready-made souls, one for each of the 16 MBTI types and the 9 Enneagram types. Each has a name, a line it would say, a few notes on what it's like to talk to, and a SOUL.md you can copy, download or link straight to your agent.

## What I learned

It's a toy, and it turns out to be more of a toy than I expected. Agents don't really *become* an MBTI or Enneagram type when you tell them to. Research on LLM personality keeps finding the same gap: a persona prompt changes how a model **describes** itself (it will happily answer a personality test "in character"), but its actual behaviour barely moves.

- [The Personality Illusion: Revealing Dissociation Between Self-Reports & Behavior in LLMs](https://arxiv.org/abs/2509.03730) (2025): models report stable traits, persona prompts shift those reports, but neither reliably predicts what the model does.
- [Is Self-knowledge and Action Consistent or Not: Investigating Large Language Model's Personality](https://arxiv.org/abs/2402.14679) (2024): the traits a model claims and the choices it makes often don't line up.

So each soul is written as concrete behaviour (what it believes, how it talks, what it will never do) rather than leaning on the type label, and the label stays what it is: a fun way to browse.

## What I built

The interesting part is the interaction design. The whole page is one hand-built physics toy:

- **A wheel of cards you can throw.** Drag, scroll or use the arrow keys; springs run at 240 Hz and flicks carry momentum. No animation library: the spring, easing and ring maths are written from scratch.
- **Cards that open into a sheet.** Tap or swipe up the centre card and it lifts, then the details window unfolds around it, Dynamic Island style. Pull it down by its handle to close.
- **Switching decks by pulling the fan down.** The cards drape down on a chain of springs, the deck name rolls over and the other deck rises in.
- **Live card artwork.** Each soul's pattern is a WebGL shader. One shared GL context draws them all and copies into the visible cards; only the centre card animates, and each pattern picks up where it left off when it comes back round. SVG fallback without WebGL.
- **Phone and reduced motion treated as first-class.** A separate 390×844 layout for phones, and with reduced motion on the wheel skips its flourishes and springs settle without overshoot.
- **Readable by people, search engines and agents.** Each soul has its own page and raw `.md` file, plus `llms.txt`, a sitemap, JSON-LD and social preview images drawn at build time in the site's own typefaces.

## Stack

[Astro](https://astro.build) with one React island for the wheel, plain CSS, hand-written WebGL shaders, and Satori + resvg for the social images. Deployed as a static site on Cloudflare Pages.

```
src/
  components/landing/
    engine/      physics loop, gestures, spring maths, and the DOM writer
    shaders/     shared WebGL renderer and one shader per card pattern
    parts/       the pieces of the page: top bar, deck toggle, card fan, details sheet…
  data/souls/    the 25 SOUL.md files
  pages/         the homepage, a page per soul, llms.txt, sitemap, social images
```

## Run it

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # static site in dist/
```
