# GAME CARD — Sweet Spot

> Intake card for Sky Wolf Studios. Read-only catalog of this game as it stands.
> No existing code was modified to produce this. Generated 2026-06-03.

---

## Identity

**1. Name & hook**
**SWEET SPOT** — a one-thumb tennis timing game: tap when the moving bar crosses the green zone, nail the gold sliver for an ACE, build a streak and bank coins until 3 faults end the rally.

**2. Genre / vibe & core loop**
Hyper-casual arcade timing/reflex game (clean, punchy, retro-sport vibe).
Core loop: a cursor oscillates across a track → **single tap anywhere** when it's over the green **sweet zone** (gold center = perfect) → score points + earn coins → streak multiplies points and ramps difficulty → bank coins → spend them in the **Pro Shop** on ball/court skins → chase a higher best/streak. Endless rally until **3 faults = game over**. Every 5th consecutive hit is a tighter, faster, double-coin **Match Point**; a clean streak of 8 restores one fault.

**3. Repo & live URL**
- Repo: **`Stephenuffugus/Sweet-Spot`** (GitHub, public, default branch `main`)
- Live URL: **https://stephenuffugus.github.io/Sweet-Spot/** — ✅ **LIVE** (HTTP 200; GitHub Pages, `main` / root). Canonical app at `…/sweet-spot.html`; `index.html` redirects to it.

---

## State

**4. Playable status — WORKING.**
Verified by headless-Chromium smoke + offline test during hardening (loads, plays, scores, banks coins, persists save, reloads offline with 0 console/page errors).
- **Works:** full core loop; ACE / WINNER / FAULT scoring; coin economy; shop buy + equip (balls & courts); match points; streak-based fault recovery; synthesized SFX; two-track music (menu vs game) with crossfade + on/off toggle; PWA install + full offline.
- **Placeholder / missing:** all skin art is CSS gradients (no real art yet); app icons are generated placeholders; no leaderboard, no accounts. None of these block play.

**5. How to run & play**
- **Static site, no build step.** Open `index.html` (→ redirects to `sweet-spot.html`) on any HTTPS static host (or `localhost`). HTTPS is required for the service worker / offline; plain `file://` disables the SW but the game still runs.
- **Entry point:** `index.html` (redirect) → `sweet-spot.html` (the whole game).
- **Controls:** single tap / click anywhere in the play field = "hit"; top-center **♫** button toggles music; on game-over, **SERVE AGAIN** / **SHOP** buttons; in shop, tap an item to buy/equip.
- **Setup:** none. No install, no dependencies, no server process.

**6. Tech stack**
**Vanilla HTML/CSS/JS — single file** (`sweet-spot.html`, ~366 lines). No framework, no game engine, no bundler, no build. **Static site.** Uses: Web Audio API (SFX synthesized in-file), a service worker (`sw.js`, cache-first offline), Web App Manifest (`manifest.json`), self-hosted `.woff2` fonts (Archivo Black, Space Mono). Music = two served `.mp3` files (not embedded).

---

## Wiring-readiness (for the shared sunbeam economy, later)

**7. Existing currency / progression concept — YES.**
There is a real persistent currency (`coins`) plus a high score (`best`) and a per-run `score`/`streak`. **`coins` is the natural mapping target for sunbeams.**
Earn rates (`sweet-spot.html`, `hit()`): ACE `+3` coins, WINNER `+1` coin, **×2 on a match point**. Coins are spent in the shop on cosmetics.
```js
// economy (hit): coins decoupled from the point multiplier
const mult=Math.max(1,streak), mpx=matchPoint?CONFIG.mpCoinMult:1;
// ACE:    runCoins += CONFIG.aceCoins*mpx;     (aceCoins=3)
// WINNER: runCoins += CONFIG.winnerCoins*mpx;  (winnerCoins=1)
```
Shop sinks are data-driven arrays — **11 balls** + **8 courts** (`BALLS`, `COURTS`) priced 0–480 coins.

**8. Persistence today — localStorage only. No backend, no Firebase, no login/accounts.**
One flat JSON blob under key `save`:
```js
let save={coins:0,best:0,ball:'gold',court:'clay',owned:['gold','clay'],music:true};
function load(){  try{const r=localStorage.getItem('save'); return r?JSON.parse(r):null;}catch(e){return null;} }
function persist(){ try{localStorage.setItem('save',JSON.stringify(save));}catch(e){} }
```
Note for the economy: `coins` currently lives **inside** the per-game `save` blob. To share it, it would later be factored into a separate shared wallet key — no such wiring exists today.

**9. Single-domain / subpath check — YES, fully portable. No blockers.**
Could be served from `lucidwinds.com/<game>/` (or any subpath) as-is. **All references are relative; there are zero root-relative (`/…`) absolute paths.** Confirmed by scan:
- `manifest.json`: `"id":"sweet-spot.html"`, `"start_url":"sweet-spot.html"`, `"scope":"./"`, icon `src` all relative.
- `sw.js`: precache list all relative (`'./'`, `'index.html'`, `'assets/…'`, etc.); fetch handler scopes by `self.location.origin` (subpath-safe).
- `sweet-spot.html`: fonts/manifest/icons/SW register/music all relative (`assets/…`, `sw.js`, `manifest.json`).
- `index.html`: redirect target relative (`sweet-spot.html`).
**Only requirement:** keep the game's files together in its own subdirectory (the SW scope + cache assume co-located assets) — i.e. exactly the `/<game>/` subpath model. One cross-game caveat for the *shared economy*: localStorage is per-origin, so a client-side shared wallet works only while all games sit under the **same origin** (e.g. `lucidwinds.com/<game>/`); a separate subdomain/domain per game would isolate storage and require a backend.

---

## Launch-readiness

**10. Storefront art** — **partial.** Three generated **placeholder icons** exist and are usable as a storefront thumbnail/icon: `icon-192.png`, `icon-512.png`, `icon-maskable.png` (a gold tennis-ball mark on the clay-court gradient). **No gameplay screenshot or gif** exists. No bespoke title/key art.

**11. Biggest single thing before standalone public ship**
It is already a polished, installable, offline MVP — so the #1 gap is **real cosmetic art for the shop**. The entire coin sink / progression hook (11 balls + 8 courts) is currently placeholder CSS gradients; replacing those with real ball/court art is what makes earning and spending feel worth it. (The handoff doc already contains an art-generation pipeline + prompts for exactly this.) Secondary: real gameplay capture (screenshot/gif) for any storefront listing.

---

### Quick reference
| | |
|---|---|
| Repo | `Stephenuffugus/Sweet-Spot` (public, `main`) |
| Live | https://stephenuffugus.github.io/Sweet-Spot/ ✅ |
| Stack | Vanilla single-file HTML/CSS/JS PWA, static, no build |
| Entry | `index.html` → `sweet-spot.html` |
| Currency | `coins` (localStorage `save` blob) → maps to sunbeams |
| Persistence | localStorage only; no backend/login |
| Subpath-ready | Yes (all relative paths) |
| Ship blocker | Real skin art (shop cosmetics are placeholder gradients) |
