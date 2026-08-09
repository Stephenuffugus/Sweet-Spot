# SHARDFALL

A side-view action roguelite RPG for the phone. Descend a huge destructible world, socket gems
into gear to build an attack that didn't exist before, die, spend shards, descend deeper.

Noita's destructible world and flight. Diablo 2's uniques that break rules. Path of Exile's
gem sockets and its `increased` / `more` distinction. Dead Cells' unlock pool and its idea that
death is a scene change rather than a reset.

**One file.** `index.html` is the whole game — vanilla HTML/CSS/JS, canvas 2D, no build step,
no dependencies. `sw.js`, `manifest.json` and the icons make it installable and playable
offline; none of them are imported by the game.

## Play

Open `index.html`, or serve the folder and install it as an app.

```bash
python3 -m http.server 8080     # then visit /shardfall/
```

**Keyboard:** `A`/`D` move · `Space`/`W` jump, **hold to hover** · `J` melee · `K` ranged ·
`Shift` dodge · `F`/`Q` ability · `E` bag · `C` camp.
**Touch:** left half of the screen is a virtual stick; the thumb cluster is bottom-right.

## The loop

Spawn at camp → descend → fight, dig, loot → die → shards persist → spend them at camp →
descend again, deeper, from an anchor you already reached.

Death loses your run gear. Shards, unlocks, tree nodes, classes, anchors and the Vault are
permanent. Reaching a biome for the first time plants an anchor you can start from next run —
without that, the loop dies from re-clearing the surface.

## What makes a build

Gear has colored sockets. Gems go in matching sockets. A **skill** gem replaces your weapon's
attack; **support** gems modify it; **aura** gems are passive; an **ability** gem drives the
ABIL button. Everything socketed in one item is linked, and support gems in your *armor* link
globally to both weapons — that's the one global-vs-local decision in the system.

Damage resolves as `base × (1 + increased) × more`. Gear affixes, the meta tree, class passives
and shrine boons all sum into the additive pool. Support gems and uniques each get their own
multiplier. That split is what keeps gems feeling build-defining instead of incremental.

## Develop

```bash
./test/run.sh          # node suites 2-7 — 249 assertions, no dependencies
node test/browser.js   # real Chromium: boot, input, render, console errors
node test/pwa.js       # manifest, service worker, offline reload, save migration
node test/shots.js     # screenshots to test/shots/ — the only way to judge feel
```

The node runner needs nothing but node. The browser suites need Playwright installed **outside**
this repo (`PW_DIR` points at it) so the game itself stays dependency-free.

Read `CLAUDE.md` before editing — it has the hard rules. `HANDOFF.md` is the system map.
`DESIGN-PLAN.md` is the reasoning behind the design and what's still open.

Owner: Stephen / Lucid Winds.
