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

Plays on **touch, keyboard + mouse, or a controller** — it detects whichever you last used and
every on-screen prompt follows it. Plug in a pad mid-run and the UI switches over.

**Keyboard + mouse:** `WASD` move · `Space` jump, **hold to hover** · mouse aims · `LMB` melee ·
`RMB` ranged · `Shift` dodge · `F` ability · `E` bag · `C` camp · `Esc` pause.
**Controller:** left stick moves, right stick aims, `A` jump, `X` melee, `RT` ranged, `B` dodge,
`LT` ability, `Back` bag, `Start` pause. Every menu is navigable with the dpad.
**Touch:** left half of the screen is a virtual stick; the thumb cluster is bottom-right, and
aiming is automatic.

## The loop

Spawn at camp → descend → fight, dig, loot → die → shards persist → spend them at camp →
descend again, deeper, from an anchor you already reached.

Death loses your run gear. Shards, unlocks, tree nodes, classes, anchors and the Vault are
permanent. Reaching a biome for the first time plants an anchor you can start from next run —
without that, the loop dies from re-clearing the surface.

## Depth, and where it comes from

Three separate ladders, deliberately different in shape:

**Inside a run** — kills grant XP, and every level offers three **attunements** to choose from.
They stack, they're chosen under pressure, and they're gone when you die. This is what gives run
one an arc, before you own a single gem.

**Across runs** — shards buy permanent unlocks into the drop pool, meta tree nodes, classes, and
Vault slots. Gems tier up by fusing three of a kind.

**Difficulty** — felling each biome's miniboss raises the **Threat** ceiling by a tier. Each tier
is a named world rule (*Watched* speeds up The Weight, *Armed* gives everything armor, *Buried*
shrinks your light) and pays more shards and better loot for it.

Everything is discoverable through the **codex**, which fills in as you play: a bestiary page on
first kill, a lore page on first descent, and thirteen fragments buried at increasing depth.

Loot tells you whether it's better before you equip it, threats off the edge of the screen get a
marker, and pressing the map key twice opens the full shaft with fog of war and a depth ruler.

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
./test/run.sh          # node suites 2-8 — 368 assertions, no dependencies
node test/browser.js   # real Chromium: boot, input, menus, mouse aim, render, console errors
node test/pwa.js       # manifest, service worker, offline reload, save migration
node test/shots.js     # screenshots to test/shots/ — the only way to judge feel
```

The node runner needs nothing but node. The browser suites need Playwright installed **outside**
this repo (`PW_DIR` points at it) so the game itself stays dependency-free.

Read `CLAUDE.md` before editing — it has the hard rules. `HANDOFF.md` is the system map.
`DESIGN-PLAN.md` is the reasoning behind the design and what's still open.

Owner: Stephen / Lucid Winds.
