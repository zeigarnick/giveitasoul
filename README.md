# giveitasoul

Give your AI agents a soul. A catalog of SOUL.md personalities for personal AI agents, starting with 16 MBTI souls and 9 Enneagram souls.

## The landing page

Built with [Astro](https://astro.build) and one React island (`src/components/landing/Landing.jsx`).

- **The wheel:** spin the fan by dragging, scrolling or ← →. Springs are integrated at 240 Hz; flicks carry momentum.
- **Open a soul:** tap the centre card, or swipe it up. The card lifts, then the details window unfolds around it.
- **Close:** pull the window down by its pill (or anywhere on it), tap outside, or press Esc.
- **Switch deck:** use the MBTI / Enneagram toggle, or pull the fan down. The cards drape down on a chain of springs, the deck name flips over, and the other deck rises.
- **Idle hint:** when nothing has been touched for a while, the centre card lifts a little to suggest swiping up.
- **Open/close motion:** the details text blends in and shrinks out like Dynamic Island content, with less bounce opening the window and a little more closing it. Other variants (including the original Tuned motion) are in `MOTIONS` in `config.js`; `MOTION` picks one.
- **Phone:** below 700px wide the page uses a 390×844 artboard (see `LAYOUTS` in `config.js`), with the centre card the size of Interface Craft's (300×420 on a 390×844 phone).
- **Card artwork:** each soul's pattern is a shader, drawn by one shared WebGL context and copied into the visible cards: the centre card at the display rate, neighbours at 30fps, far cards at 15fps; hidden cards don't draw. Without WebGL the SVG patterns are used.
- **Reduced motion:** with the system setting on, the wheel skips its spin-in and idle hint, springs settle without overshoot, the fan doesn't lean, and each card pattern holds still.

The page is designed on a 1440×900 stage (390×844 on phones) and scaled to fit the window; on wide or tall windows the fan and fades run to the real window edges.

## Structure

```
src/
  pages/index.astro                 page shell, fonts, stage scaling
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
