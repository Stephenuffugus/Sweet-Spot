# SHARDFALL — Engineering Handoff

**State:** playable vertical slice, 1290 lines, 141 passing assertions, never opened in a browser.
**Stack:** single-file vanilla HTML/CSS/JS PWA, canvas 2D, no build step, mobile-first.
**Owner:** Stephen / Lucid Winds. Target: lucidwinds.com.

Read `CLAUDE.md` first (rules + testing). This file is the map. `DESIGN-PLAN.md` is the roadmap.

---

## 0. The one thing to do first

**Open `index.html` in a browser and play it.** Every line was written and tested headlessly.
The logic is verified; the *feel* is completely unvalidated. Nobody has ever seen it render.

Expect to fix render bugs and tune numbers. Start there before building anything new.

Controls — keyboard: `A/D` move, `Space/W` jump (**hold to hover**), `J` melee, `K` ranged,
`Shift` dodge, `F/Q` ability, `E` bag, `C` camp (when at camp/anchor). Touch: left half of the
screen is a virtual stick, buttons bottom-right, `MAP`/`BAG` top-right.

The first numbers to reach for, in likely order of need:
`FLY_THRUST` 2100, `FLY_DRAIN` 42, `JUMPV` 430, `GRAV` 1500, `MOVE` 170, `FALL_SAFE` 520,
and the POI density gates in `genChunk` (hash thresholds: chests .12, shrines .16, vaults .10,
secrets .14, boss arenas .045).

---

## 1. File layout

`index.html` is one script block, sectioned by banner comments. Line numbers drift; the banners
are the navigation.

| Section | What lives there |
|---|---|
| CONSTANTS | tile size, world dims, gravity/movement, flight + fall tuning |
| **DATA TABLES** | tiles, status types, elites, biomes, enemies, gems, gear, uniques, affixes, classes, boons, tree, unlocks. **All content goes here.** |
| RNG + NOISE | seeded mulberry32, value noise, `hash2` for deterministic per-chunk decisions |
| WORLD / CHUNKS | chunk generation, POI stamping, chunk canvas rendering, canvas eviction |
| CARVE | `carve()` — the only terrain-removal function |
| META / SAVE | localStorage, `treeFx`/`classFx`, unlock pools, biome anchors |
| ITEMS | `mkItem`, affix rolling, unique assignment, naming |
| RUN STATE | `EQ`, `BAG`, entity arrays, `RUNB` boons, the `P` player object |
| GEM RESOLUTION | `computeAttack`, `computeAbility`, `refreshAttacks`, `useAbility` |
| PHYSICS | `collideMove` + tile scans |
| COMBAT | melee, ranged, explosions, status application, damage, drops |
| ENEMIES / PROJECTILES / PICKUPS | spawning, AI, enemy shooting, projectile stepping |
| PLAYER UPDATE | movement, hover/fuel, fall damage, burrow phasing, death, `newRun` |
| UI | panels, bag/socket screens, shrine, camp, class/anchor/loadout pickers |
| INPUT | keyboard, virtual stick, touch buttons |
| RENDER | camera, chunk blitting, entities, minimap |
| MAIN LOOP | fixed-timestep `sim()`, `hud()`, `frame()` |

---

## 2. The core loop

Spawn at camp (or a deeper **anchor**) → descend a huge seeded world → fight, dig, loot →
die → shards persist → spend at camp → descend again, deeper.

- Death loses all run gear. Shards, unlocks, tree nodes, classes and anchors are permanent.
- **Anchors** are the anti-tedium valve: reaching a biome for the first time plants one, and
  camp lets you start there next run. Without this the loop dies from re-clearing the surface.

---

## 3. Systems, in dependency order

### 3.1 World generation

Chunked 48×48-tile grid, generated on demand from `SEED`, world 1600×3200 tiles. Six depth
bands: surface / caves / fungal / ruins / forge / abyss. Layered value noise carves caves;
biome band sets the ground tile and cave density.

Terrain is a `Uint8Array` per chunk keyed `"cx,cy"` in a `Map`. Each chunk lazily renders to
its own offscreen canvas; **canvases are evicted every 2s beyond a 3-chunk radius** (each is
~2.3 MB — this was a real memory problem). Tiles are kept, canvases are rebuilt on demand.

**POIs**, all stamped in `genChunk` via `hash2` so they're deterministic per seed:
- treasure chests (~1 per 5.5 chunks)
- shrines (~1 per 30 chunks) — grant a run boon
- **sealed vaults** — hard-brick rooms; you need dig 1+ (Axe/Greataxe/Fireball) to get in
- **secret caches** — a seam of tile 10, which mimics stone but breaks to *any* weapon
- **boss arenas** (~1 per 26 chunks) — one miniboss per biome

`TILES[].hard` gates digging: 0 dirt, 1 stone, 2 forge, 3 abyss, 9 bedrock (never carvable).

### 3.2 carve() — all digging

```js
carve(px, py, radius, maxHard)   // returns tiles removed
```

Melee digs, explosions, Quake, Shaft, Burrow, and tunneling projectiles all call it. Ore tiles
drop shards when carved. **Add new dig sources by calling this, never `setTile`.**

### 3.3 Gem / socket system (the buildcraft core)

Gear has sockets. Gems go in sockets. Four gem types:

| Type | Where | Effect |
|---|---|---|
| `skill` | weapon | **replaces** the weapon's attack (Cleave, Nova, Fireball, Lightning, Bore) |
| `sup` | weapon or armor | **modifies** the skill — the `more` multipliers |
| `aura` | armor only | passive while equipped (Thorns, Regrowth, Ironskin, Featherfall, Updraft, Swiftness) |
| `abil` | armor only | drives the ABIL button, own cooldown |

**Links are implicit:** everything in one item is linked. There is deliberately no link-group
UI — see DESIGN-PLAN §3.1, which replaces it with socket colors.

**One rule worth knowing:** support gems socketed in *armor* link **globally** to both weapons
and to the ability. That's the main global-vs-local decision in the whole system.

Resolution order in `computeAttack(slot)`:
```
gear base → skill gem → support gems (same item) → UNIQUE mod → armor supports (global)
          → tree + class + boons + affixes → status/crit
```
Uniques run **after** gems specifically so they can break rules.

**Shields** occupy either hand slot — the player chooses. Sword+bow, sword+shield, or
shield+bow are all legal. Holding the attack button with a shield equipped **blocks**
(70% DR, half move speed, deflects projectiles from the faced side); tap-and-release **bashes**.

### 3.4 Status effects

Generic engine, applies identically to enemies and the player: `burn` (dps), `chill` (movement
multiplier), `shock` (incoming damage multiplier), `bleed` (dps, **doubles while the target is
moving**). `applyStatus` / `tickStatus`, threaded through every damage path. Potency takes the
max, duration refreshes.

### 3.5 Abilities

Armor `abil` gem → ABIL button. Nine of them: Blink, War Cry, Meteor, Mend, Quake, and the
four traversal ones (Levitate, Grapple, Burrow, Shaft). Timed buffs go through `BUFFS[]` so
they revert cleanly — War Cry's +25% correctly un-applies from `RUNB` on expiry.

### 3.6 Traversal (the Noita layer)

- **Hover:** everyone can fly. Hold jump in the air to thrust against a fuel meter. Base tank
  60, drain 42/s, fast ground regen, rise speed capped so it reads as a jetpack. On empty,
  a weak "sputter" thrust still bleeds off fall speed so running dry isn't instant death.
- **Fall damage** above 520 px/s, **capped at 55% of max HP** so a fall never one-shots from
  full. `Featherfall` aura negates; `Skyrigger` unique is immune.
- **Fuel** is a build stat: Delver Harness gear, Updraft aura, Skyrigger unique, class/tree.
- **Burrow** phases through solid rock, carving a tunnel. **Shaft** drills 26 tiles straight
  down. **Grapple** anchors to terrain and yanks you, or yanks a light enemy to you (bosses
  immune). **Levitate** = 6s of free flight.

### 3.7 Classes

Four, each = starting kit + free pre-socketed signature gem + permanent passive read by
`classFx()`. Vanguard (tanky, doubles block DR), Marksman (pierce, fragile), Pyromancer
(burn bonus, faster abilities), Delver (dig bonus, greed). Custom loadout can override the
kit via a camp toggle (`META.useClassKit`).

### 3.8 Enemies

Four grunts (crawler, bat, spitter, brute) and five minibosses (warden, sporemother, sentinel,
forgelord, voidmaw), one per biome. Any enemy can carry a `shoot:{}` block — hostile
projectiles damage the player and can apply status. **Elites** roll on grunts, 2% shallow
ramping to 22% deep: Swift, Armored, Vampiric (heals off you), Volatile (corpse detonates and
hurts you too). Depth scales HP and damage via `depthMul`.

### 3.9 Meta progression

`localStorage` key `shardfall`, one versioned JSON blob: shards, unlock flags, tree nodes,
class + unlocked classes, loadout, anchors, best depth.

Camp offers: class picker, descend-from (anchors), starting loadout, unlock pool (39 items —
buying puts gear/gems into the world **drop pool**, Dead Cells style), and a 9-node tree in
three branches.

---

## 4. Content inventory

| Table | Count | Notes |
|---|---|---|
| `GEMS` | 33 | 6 skill, 12 support, 6 aura, 9 ability |
| `GEAR` | 12 bases | melee / ranged / armor / `any` (shields) |
| `UNIQUES` | 12 | rarity 3; `mod()` runs after gems so they break rules |
| `ENEMIES` | 9 | 4 grunts + 5 minibosses |
| `ELITES` | 4 | modifier prefixes |
| `CLASSES` | 4 | |
| `BOONS` | 7 | shrine rewards, run-scoped in `RUNB` |
| `TREE` | 9 nodes | 3 branches |
| `UNLOCKS` | 39 | the shard sink |
| `BIOMES` | 6 | |
| `AFFIXES` | 4 | **thin — this is a known gap** |

---

## 5. Known gaps and traps

**Gaps (deliberate, prioritized in DESIGN-PLAN §9):**
- No crit, no flat armor, no status resist. Affixes only roll 4 things, so "+damage" is
  effectively the only offensive axis. **This is the top content bottleneck.**
- Enemies have **no attack telegraphs**. Damage will feel random until they do. Do this
  before any balance tuning — no amount of number-turning fixes an unreadable hit.
- Bosses are single-phase HP sponges.
- Nothing stops farming the shallow caves forever. Shard drops don't scale with depth yet
  (one-line fix, DESIGN-PLAN §3.4.1).
- Gems don't level or fuse, so shards become worthless once the pool is bought out.
- No sound, no service worker (manifest is inline as a data URI; offline needs a real `sw.js`).

**Traps for whoever edits this next:**
- **`refreshAttacks()` after any build change.** Equipment, sockets, tree, class, boons.
  The `ATK` cache is stale otherwise and nothing will look wrong until damage is subtly off.
- `maxFuel()` and `maxHP()` are pure getters — keep them that way. A side effect in `maxFuel`
  was already removed once.
- Gems in sockets are **bare string ids**. Gem tiers (DESIGN-PLAN §3.3) require changing them
  to `{id, tier}` objects — that's a real refactor touching save format, socket UI, and all
  three compute functions. Budget a full session and bump the save `ver`.
- `render()` must not mutate state.
- The minimap samples tiles directly and is rebuilt every 8 frames. If you make it per-frame
  it will cost more than the entire rest of the render.

---

## 6. Roadmap

`DESIGN-PLAN.md` has the full reasoning. Strict order — do not skip ahead:

1. **Browser playtest + feel pass.** Nothing else matters until this happens.
2. **Foundation lock:** formalize increased/more, add crit + flat armor + status resist,
   enemy telegraphs, depth-scaled shards.
3. **Socket colors + Focus resource** (ability cost so ABIL is a decision, not a reflex),
   socket-screen redesign with a DPS estimate.
4. **Content wave:** ~15 gems chosen to complete the 8 target build archetypes, new grunts
   per biome, boss phases.
5. **Meta depth:** gem tiers/fusion, the Vault (carry one item through death), The Weight
   (anti-camping pressure), death summary screen.
6. **Ship:** sound, service worker, art.

**Art path:** everything currently draws from `TILES[].c` and flat `fillRect`. Blender →
sprite sheets is exactly the Dead Cells pipeline and the right call here. Add a `drawEntity()`
indirection that falls back to rects when no atlas is loaded, so the file never loses the
"single file, works offline, no build step" property.

---

## 7. Session log

| # | Shipped |
|---|---|
| 1 | Concept, chunked world, physics, melee/ranged, sockets, loot, camp, death loop |
| 2 | Shield block/bash, global armor supports, aura gems, chests, true arc math, entity caps, chunk eviction |
| 3 | Minibosses, enemy ranged attacks, shrines + boons, sealed vaults, loadout picker |
| 4 | Depth anchors, elites, secret walls, 7 gems, 5 gear bases, minimap |
| 5 | Status engine, ability system, uniques, 4 classes |
| 6 | `carve()` unification, flight + fuel, fall damage, Bore/Excavate, 4 traversal abilities |

Bugs the headless harness caught that a human would have spent an evening on:
`FLY_THRUST` set exactly equal to `GRAV` (hovering perfectly cancelled gravity and never
lifted — masked by the jump impulse in an earlier test); a tunneling projectile charging dig
cost per tile against a 2-tile radius and burning its entire lifetime in three frames.
