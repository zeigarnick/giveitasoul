# giveitasoul

Give your AI agents a soul. A catalog of SOUL.md personalities for personal AI agents, starting with 16 MBTI souls and 9 Enneagram souls.

## The landing page

Built with [Astro](https://astro.build) and one React island (`src/components/landing/Landing.jsx`).

- **The wheel:** spin the fan by dragging, scrolling or ← →. Springs are integrated at 240 Hz; flicks carry momentum.
- **Open a soul:** tap the centre card, or swipe it up. The card lifts, then the details window unfolds around it.
- **Close:** pull the window down by its pill (or anywhere on it), tap outside, or press Esc.
- **Switch deck:** use the MBTI / Enneagram toggle, or pull the fan down. The cards drape down a short way on a chain of springs and fade out, the deck name rolls over to the new one, and the other deck rises into place, fading in.
- **Idle hint:** when nothing has been touched for a while, the centre card lifts a little to suggest swiping up.
- **Open/close motion:** the details text blends in and shrinks out like Dynamic Island content, with less bounce opening the window and a little more closing it. Other variants (including the original Tuned motion) are in `MOTIONS` in `config.js`; `MOTION` picks one.
- **Phone:** below 700px wide the page uses a 390×844 artboard (see `LAYOUTS` in `config.js`), with the centre card the size of Interface Craft's (300×420 on a 390×844 phone), and a flick moves one card at a time.
- **Card artwork:** each soul's pattern is a shader, drawn by one shared WebGL context and copied into the visible cards. Only the centre card (up to 60fps) and the open window animate; the other cards hold their last frame, and each soul's pattern picks up where it left off when its card reaches the centre. Without WebGL, or with `?art=svg` in the URL, the SVG patterns are used.
- **Reduced motion:** with the system setting on, the wheel skips its spin-in and idle hint, springs settle without overshoot, the fan doesn't lean, and each card pattern holds still.

The page is designed on a 1440×900 stage (390×844 on phones) and scaled to fit the window; on wide or tall windows the fan and fades run to the real window edges.

## For AI agents and search engines

Everything is built from `site` in `astro.config.mjs` (https://giveitasoul.com) and `src/lib/site.js`.

- `/llms.txt` ([llmstxt.org](https://llmstxt.org)): what the site is, how to install a soul, and every soul's SOUL.md link. `/llms-full.txt` has every SOUL.md in one file; `/index.md` is the homepage as markdown; `/souls/<slug>.md` is each soul's file.
- Every page has a canonical link, Open Graph and Twitter tags, a link to its markdown version and JSON-LD (the site and its list of souls on the homepage; each soul and its breadcrumbs on its page). See `src/components/seo/Seo.astro`.
- Social previews: `/og/<slug>.png` for each soul and `/og/home.png`, 1200×630, drawn at build time in the site's typefaces and each soul's colours (Satori and resvg; `src/lib/og.js`).
- `/sitemap.xml` lists every page; `/robots.txt` welcomes all crawlers, AI ones included.
- `/_headers` (Cloudflare Pages) serves the files agents read as UTF-8 markdown that any origin can fetch.
- The homepage wheel is drawn by script, so the page also carries every soul as plain links for screen readers and crawlers.

## Structure

```
src/
  pages/index.astro                 page shell, fonts, stage scaling
  pages/souls/[slug].astro          a page for each soul; [slug].md.ts serves its SOUL.md
  pages/llms.txt.ts, llms-full.txt.ts, index.md.ts, sitemap.xml.ts, robots.txt.ts, [file].ts (_headers)
  pages/og/[slug].png.ts            social preview images, drawn by lib/og.js
  lib/site.js                       site name, address and description; every soul with its addresses
  components/seo/Seo.astro          meta tags, canonical link and structured data for a page
  components/landing/
    Landing.jsx                     lays out the stage from the parts below
    useWheel.js                     connects the wheel engine to React
    config.js                       the tuned feel, desktop/phone layouts, motion variants, hero typefaces
    landing.css                     static styles; anything that moves is set inline by the engine
    SoulCard.jsx                    a soul card: its pattern, type and name
    engine/WheelEngine.js           physics loop, gestures, open/close and deck-switch state
    engine/frame.js                 turns engine state into each element's styles
    engine/writer.js                writes those styles to the DOM, pauses hidden card patterns
    engine/spring.js                spring, easing and ring maths
    shaders/                        one shared WebGL renderer and a shader per card pattern (SVG patterns are the fallback)
    parts/                          TopBar, DeckToggle, Hero, DeckFlip, CardFan, DetailsSheet, BottomBar, patterns
  data/souls.js                     the MBTI and Enneagram decks
```

## Develop

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # static site in dist/
```
