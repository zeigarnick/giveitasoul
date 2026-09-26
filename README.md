# giveitasoul

Give your AI agents a soul. A catalog of SOUL.md personalities for personal AI agents, starting with 16 MBTI souls and 9 Enneagram souls.

## The landing page

Built with [Astro](https://astro.build) and one React island (`src/components/landing/Landing.jsx`).

- **The wheel:** spin the fan by dragging, scrolling or ← →. Springs are integrated at 240 Hz; flicks carry momentum.
- **Open a soul:** tap the centre card, or swipe it up. The card lifts, then the details window unfolds around it.
- **Close:** pull the window down by its pill (or anywhere on it), tap outside, or press Esc.
- **Switch deck:** use the MBTI / Enneagram toggle, or pull the fan down. The cards drape down on a chain of springs, the deck name flips over, and the other deck rises.
- **Idle hint:** when nothing has been touched for a while, the centre card lifts a little to suggest swiping up.
- **Reduced motion:** with the system setting on, the wheel skips its spin-in and idle hint, springs settle without overshoot, the fan doesn't lean, and each card pattern holds still.

The page is designed on a 1440×900 stage and scaled to fit the window. A dedicated phone layout is next.

## Structure

```
src/
  pages/index.astro                 page shell, fonts, stage scaling
  components/landing/Landing.jsx    the wheel, gestures, details window, deck switch
  components/landing/SoulCard.jsx   card artwork (animated SVG pattern per soul)
  components/landing/dc.jsx         small base class: renderVals() -> template(v)
  data/souls.js                     the MBTI and Enneagram decks
```

## Develop

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # static site in dist/
```
