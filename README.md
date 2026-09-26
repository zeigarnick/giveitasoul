# giveitasoul

Give your AI agents a soul. A catalog of SOUL.md personalities for personal AI agents, starting with 16 MBTI souls and 9 Enneagram souls.

## The landing page

Built with [Astro](https://astro.build) and one React island (`src/components/landing/Landing.jsx`).

- **The wheel:** spin the fan by dragging, scrolling or ← →. Springs are integrated at 240 Hz; flicks carry momentum.
- **Open a soul:** tap the centre card, or swipe it up. The card lifts, then the details window unfolds around it.
- **Close:** pull the window down by its pill (or anywhere on it), tap outside, or press Esc.
- **Switch deck:** use the MBTI / Enneagram toggle, or pull the fan down. The cards drape down on a chain of springs, the deck name flips over, and the other deck rises.
- **Idle hint:** when nothing has been touched for a while, the centre card lifts a little to suggest swiping up.
- **Motion variants:** in dev, or with `?motion` in the URL, a small picker switches the open/close motion between Tuned (the default), Island (details text blends in and shrinks out like Dynamic Island content) and Island+ (plus less bounce opening, a little more closing). Picking one replays the open; the choice is remembered in this browser. Variants live in `MOTIONS` in `config.js`.
- **Phone:** below 700px wide the page uses a 390×844 artboard (see `LAYOUTS` in `config.js`).
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
    parts/                          TopBar, DeckToggle, Hero, DeckFlip, CardFan, DetailsSheet, BottomBar, MotionPicker, patterns
  data/souls.js                     the MBTI and Enneagram decks
```

## Develop

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # static site in dist/
```
