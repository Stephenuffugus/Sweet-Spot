# SWEET SPOT — Build & Handoff Doc

**One-liner:** A one-thumb tennis timing game. Tap when the moving bar crosses the green zone; nail the gold sliver for an ACE. Build a streak, bank coins, buy skins. Endless rally until 3 faults.

**Status:** Playable single-file prototype complete (`sweet-spot.html`). Core loop, scoring, coin economy, skin shop, match points, and skill-based fault recovery are all working. This doc covers what's prototype-only and what production needs.

**Stack target:** Vanilla HTML/CSS/JS single-file PWA. Persistence via localStorage (v1) or Firebase (if accounts/cross-device wanted). No build step, no framework.

---

## 1. Core gameplay spec (design intent)

- **Input:** Single tap anywhere on the play field = "hit." One thumb, no precision targeting.
- **The bar:** A cursor oscillates left↔right across a track. A green **sweet zone** sits at a random horizontal position each serve. A gold **perfect zone** sits centered inside it.
- **Outcomes:**
  - Tap inside perfect zone → **ACE** (3 × streak points)
  - Tap inside sweet zone → **WINNER** (1 × streak points)
  - Tap outside → **FAULT** (streak resets, +1 fault)
- **Fail state:** 3 faults = game over. **Do not remove this** — it's the source of all tension.
- **Match point:** Every 5th consecutive hit, the next serve is a MATCH POINT — tighter zone, faster bar, double coins. A flavor spike, not a wall.
- **Fault recovery:** A clean streak of 8 restores one fault (capped at 3 max). Recovery is hard precisely because a fault resets the streak — rewards skill without granting immortality.
- **Difficulty ramp:** Zone shrinks and bar speeds up gradually as the streak climbs. The match-point modifier is constant, so later match points are harder than early ones automatically (smaller/faster base).

---

## 2. Save schema

Single object, persisted as one JSON blob under key `save`:

```js
{
  coins: 0,            // persistent currency
  best:  0,            // high score
  ball:  'gold',       // equipped ball skin id
  court: 'clay',       // equipped court theme id
  owned: ['gold','clay'], // owned skin ids (balls + courts share the array)
  music: true            // music on/off preference (toggle button)
}
```

Defaults grant the two free skins (`gold`, `clay`). Schema is intentionally flat so the persistence backend can swap without touching game logic.

---

## 3. Balance constants map

All tuning lives in three functions. **Recommend extracting these to a `CONFIG` object at the top of the file before shipping.**

| Knob | Location | Current | Effect | Easier ← → Harder |
|---|---|---|---|---|
| Base zone width | `newServe` | `16` | Starting green width (%) | raise / lower |
| Shrink rate | `newServe` | `0.6` /hit | How fast zone narrows with streak | lower / raise |
| Zone floor | `newServe` | `8` | Minimum zone width (%) | raise / lower |
| Match-point width | `newServe` | `×0.82` | Zone shrink on match points | →1.0 / →0.6 |
| Match-point speed | `loop` | `×1.25` | Speed spike on match points | →1.0 / →1.6 |
| Base speed | `loop`/init | `0.9` | Starting bar speed | lower / raise |
| Speed ramp (ace) | `hit` | `+0.12` | Speed gained per ace | lower / raise |
| Speed ramp (winner) | `hit` | `+0.08` | Speed gained per winner | lower / raise |
| Match-point cadence | `newServe` | every `5` | Hits between match points | raise / lower |
| Fault recovery | `hit` | every `8` clean | Clean streak to earn a life | raise / lower |

**Economy:** ACE = +3 coins, WINNER = +1 coin, both ×2 on a match point. Coins are decoupled from the streak multiplier (points are not) — keep them separate or the shop becomes trivially affordable.

---

## 4. Skin catalog

Balls and courts are defined in the `BALLS` and `COURTS` arrays. Shop renders, prices, and equips read directly from these — adding content = adding array entries, no new code.

**Balls:** gold (0, free), felt/Tennis Pro (40), ember (60), frost (80), neon (100), plasma (130), magma (160), chrome (190), void (220), galaxy (300), holo (420).

**Courts:** clay (0, free), hard (80), grass (120), night (170), sunset (230), synthwave (300), carbon (380), royal (480).

All are currently **CSS gradient placeholders**. Pricing forms a curve: cheapest ~1 strong run, top court ~10+ runs.

### Swapping placeholders → real art
Each ball entry has a `bg` field (CSS background) and `gl` (glow color). To use generated art, change `bg` to `url('...')` with `background-size:cover`. The shop swatch reads the same `bg`, so it updates automatically. Courts use `c1`/`c2` gradient stops — swap to a `background-image` texture behind the line markings.

### Art generation prompts (MJ / Gemini / GPT)
Reusable ball template — keeps every ball swappable (same framing):
> "tennis ball, [THEME], centered single object, glossy studio product render, dramatic rim light, flat charcoal background, ultra detailed, game asset icon, square --ar 1:1"

Theme fills:
- Plasma — crackling electric-blue energy core, white-hot center
- Magma — cracked obsidian shell, glowing lava seams
- Chrome — liquid mirror metal, sharp reflections
- Galaxy — swirling purple nebula, tiny stars
- Holo — iridescent soap-bubble film, rainbow shift
- Comet (future) — molten core + motion trail (needs a small trail-render tweak)

Court texture template (top-down):
> "top-down tennis court surface, [clay / brushed ice / neon synthwave grid / carbon fiber weave], seamless texture, dramatic stadium lighting --ar 9:16"

---

## 5. Production TODOs (prototype → release)

1. **Persistence swap.** Replace the `window.storage` wrapper (`load()` / `persist()`) — it's artifact-only and won't exist in the real build.
   - *Simple:* `localStorage.getItem/setItem('save', JSON.stringify(save))`. Single device, zero infra.
   - *Full:* Firebase Auth + Firestore doc per user (`users/{uid}/save`). Needed only for accounts / cross-device / leaderboards.
2. **PWA shell.** Add `manifest.json` (name, icons 192/512, `display:standalone`, theme `#d8552c`, bg `#1a1410`) + a service worker caching the HTML and assets. **Self-host the fonts** (Archivo Black, Space Mono) — the current Google Fonts `@import` breaks true offline.
3. **Audio engine — DONE.** Synthesized Web Audio (oscillator + gain envelopes), in-file, zero assets, offline-safe. Implemented SFX: winner & ace (**pitch rises with streak** — audio doubles as feedback), fault buzz, match-point rising arp, life-back chime, shop buy/insufficient-funds, game-over descending tone. AudioContext lazy-inits and resumes on first tap (browser gesture requirement handled). Sound fns live in the `SND` object near the top of the script.
   - Music system: **BUILT.** Two-track player (`Music` object) that cycles a different track each run, loops within a run, volume 0.4 so SFX cut through, with a persistent **on/off toggle button** (top-center ♫). Preference saved in `save.music`. Starts on first tap (autoplay-block safe), and the toggle gracefully no-ops if files are missing.
   - **ACTION REQUIRED — supply the two song files.** Drop them in the project and point the `TRACKS` array (top of script) at them: currently `['assets/track1.mp3','assets/track2.mp3']`. Add both files to the **service worker cache list** so music works offline. Keep them as separate served files — do NOT base64-embed (bloats the HTML, kills the single-file lean-ness benefit for no gain).
4. **Art pipeline.** Generate skins via prompts above, host images, switch `bg` fields to URLs.
5. **Extract `CONFIG`.** Pull the §3 constants to the top for fast tuning.
6. **Real-device pass.** Test viewport on tall/notch phones — the `max-height:920px` wrapper may letterbox; consider `100dvh` + `env(safe-area-inset-*)`.

---

## 6. Release checklist

- [ ] Persistence swapped to localStorage or Firebase
- [ ] `manifest.json` + service worker added; installs and runs offline
- [ ] Fonts self-hosted
- [x] Audio engine in (SFX synthesized in-file; optional music bed deferred)
- [ ] Skin art generated + wired (or ship v1 with polished placeholders)
- [ ] `CONFIG` extracted; balance playtested on real devices
- [ ] App icons (192 / 512 / maskable)
- [ ] Distribution: Pi-compliant submission build **and** the independent build (own domain / itch.io); keep monetization earned-only for v1, Stripe coin top-up is a later fork

---

## 7. Post-launch roadmap (captured from design chat)

Ranked gameplay-depth ideas not yet built:
1. **Press-your-luck banking** — rally coins sit "at risk"; tap-hold to cash out, a fault loses the unbanked. Adds a decision every second, no new screen. *(Strongest next addition.)*
2. **Daily Challenge** — seeded sweet-spot sequence, one shot, shareable score. Retention + virality engine (needs a leaderboard → Firebase).
3. **Tour/Career ladder** — beat escalating opponents, unlock courts. Gives coins a destination.
4. **60-Second Rush** — no fault-out, pure score chase against the clock.
5. **Consumable power-ups** — shield / slow-mo / double-coins bought with coins; second coin sink.

---

## Open decisions

- **Music files:** system is built + toggle works; supply the two `.mp3`s, set the `TRACKS` paths, add them to the SW cache (see §5.3)
- **Persistence backend:** localStorage (ship fast) vs Firebase (accounts/leaderboards)
- **Monetization:** earned-only v1 confirmed; Stripe coin top-up = later fork
