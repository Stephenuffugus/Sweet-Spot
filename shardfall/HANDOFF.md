# SHARDFALL — Engineering Handoff

**State:** playable, ~3000 lines, sessions 1-8 shipped. Renders in a real browser, installs
offline, plays on touch / keyboard+mouse / gamepad. 368 node assertions across 7 suites plus
32 browser and 21 PWA checks, all passing.
**Stack:** single-file vanilla HTML/CSS/JS PWA, canvas 2D, no build step, multi-device.
**Owner:** Stephen / Lucid Winds. Target: lucidwinds.com. Lives in `shardfall/` in the
Sweet-Spot repo, so the live Sweet Spot page at the repo root is untouched.

Read `CLAUDE.md` first (rules + testing). This file is the map. `DESIGN-PLAN.md` is the roadmap.

---

## 0. The one thing to do first

**Play it on an actual phone.** It has now been rendered and driven in headless Chromium, and
`test/shots.js` writes screenshots of staged moments — but nobody has yet held it in one hand
with a thumb on the buttons. Everything about pacing, button reach and difficulty is judged
there, not here.

Controls — keyboard: `A/D` move, `Space/W` jump (**hold to hover**), `J` melee, `K` ranged,
`Shift` dodge, `F/Q` ability, `E` bag, `C` camp (when at camp/anchor). Touch: left half of the
screen is a virtual stick; the thumb cluster is bottom-right with MEL nearest the corner and
ABIL furthest; `MAP`/`BAG`/`CAMP` top-right; minimap below them.

The first numbers to reach for, in likely order of need:
`FLY_THRUST` 2100, `FLY_DRAIN` 42, `JUMPV` 430, `GRAV` 1500, `MOVE` 170, `FALL_SAFE` 520,
the `17*TILE` camera target in `resize()`, `WEIGHT_GRACE`/`WEIGHT_EVERY`, `FOCUS_*`,
and the POI density gates in `genChunk` (hash thresholds: chests .12, shrines .16, vaults .10,
secrets .14, boss arenas .045).

**The browser-only findings from the first render, all now fixed**, as a warning about what a
headless harness cannot tell you: the camera showed 12 tiles while auto-aim reached 16, so you
auto-targeted enemies off-screen; the minimap drew on top of the HUD buttons; ABIL was a
full-width bar across the play area; and every depth looked identical because there was no
lighting.

---

## 1. File layout

`index.html` is one script block, sectioned by banner comments. Line numbers drift; the banners
are the navigation.

| Section | What lives there |
|---|---|
| CONSTANTS | tile size, world dims, gravity/movement, flight + fall tuning, crit/armor/focus/weight |
| **DATA TABLES** | tiles, status types, elites, biomes, enemies, gems, gear, uniques, affixes, classes, boons, tree, unlocks. **All content goes here.** |
| **LORE** | world, biomes, bestiary, fragments, classes — the codex reads from here |
| **ATTUNEMENTS + THREAT** | in-run level-up picks, and the across-run difficulty tiers |
| RNG + NOISE | seeded mulberry32, value noise, `hash2` for deterministic per-chunk decisions |
| AUDIO + FX | synthesized WebAudio SFX (no asset files), arcs, screen flash, callouts |
| WORLD / CHUNKS | chunk generation, POI stamping, chunk canvas rendering, canvas eviction |
| CARVE | `carve()` — the only terrain-removal function |
| META / SAVE | localStorage, `treeFx`/`classFx`, unlock pools, biome anchors |
| ITEMS | `mkItem`, affix rolling, unique assignment, naming |
| RUN STATE | `EQ`, `BAG`, entity arrays, `RUNB` boons, the `P` player object |
| GEM RESOLUTION | `inc`/`resolveDmg`/`applyGem`, `computeAttack`, `computeAbility`, `refreshAttacks`, `useAbility`, `dpsOf` |
| PHYSICS | `collideMove` + tile scans |
| COMBAT | status engine + interactions, `strike`, crit, flat armor, melee/ranged, explosions, drops |
| ENEMIES / PROJECTILES / PICKUPS | spawning, AI, enemy shooting, projectile stepping |
| PLAYER UPDATE | movement, hover/fuel, fall damage, burrow phasing, death, `newRun` |
| UI | title, pause, settings, controls, codex, panels, bag/socket, shrine, camp, vault, threat |
| INPUT | device abstraction: keyboard, mouse aim, gamepad, touch; `readInput()`, menu nav, prompts |
| RENDER | adaptive camera, sky + parallax, chunk blitting, `drawEntity` (art fallback), depth lighting, minimap |
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
| `GEMS` | 62 | 11 skill, 20 support, 11 aura, 20 ability. Every gem declares a socket color. |
| `GEAR` | 12 bases | melee / ranged / armor / `any` (shields). Each has `arm`, `sc`, `tend`. |
| `UNIQUES` + `UNIQ2` | 24 | two per base, coin-flipped; `mod()` runs after gems so they break rules |
| `ENEMIES` | 19 | 13 grunts + 5 minibosses + voidling. All telegraph. |
| `ELITES` | 4 | modifier prefixes |
| `CLASSES` | 4 | each also names where it earns Focus (`foc`) |
| `BOONS` | 12 | shrine rewards, run-scoped in `RUNB` |
| `TREE` | 15 nodes | 3 branches x 5 |
| `UNLOCKS` | 68 | the shard sink |
| `BIOMES` | 6 | 3 grunts each from caves down |
| `AFFIXES` | 12 | `pct` folds into the additive pool, `flat` adds raw |

## 5. Known gaps and traps

**Gaps (deliberate, prioritized):**
- **Nobody has played this on a phone.** Every difficulty and pacing number is an estimate.
  This is the single biggest open risk and no amount of further building reduces it.
- Art is still flat `fillRect`. `drawEntity()` is the seam an atlas drops into (§8).
- No music. SFX are synthesized; a soundtrack would need real asset files, which is the first
  thing that would challenge the single-file rule.
- Boss patterns fire once on transition and then only colour ongoing behaviour. They could be
  ongoing pattern states instead.
- No liquid simulation. Still the most Noita-shaped thing missing.
- Enemy count per chunk doesn't scale with depth, only their stats do.

**Traps for whoever edits this next:**
- **`refreshAttacks()` after any build change.** Equipment, sockets, tree, class, boons. It
  also recomputes `P.armor`, `P.sres` and `P.maxfuel`, so skipping it desyncs defense too.
- **Two pools.** A support gem must write `a.more`, never `a.dmg`. See CLAUDE.md rule 5.
- **Sockets are `{id,tier}`.** Read them through `gemId`/`gemTier`/`gemOf`. A bare
  `GEMS[socket]` silently returns undefined and the gem does nothing.
- **`o.st[k]` is an array.** `o.st.burn.p` is a bug; `stSum(o,'burn')` is what you want.
- `maxFuel()`, `maxHP()`, `armorVal()` are pure getters — keep them that way.
- `render()` must not mutate state and must not touch `RNG()` — use `RRNG()`.
- The minimap samples tiles directly and is rebuilt every 8 frames. Per-frame would cost more
  than the entire rest of the render.
- Conditional gems (Momentum, Reap, Culling, Chain, Sunder, Twin Strike) resolve in `strike()`,
  not in `computeAttack`, because they depend on live state. Adding one to the cached path
  will silently bake in a stale value.
- Anything hand-constructing an enemy must set `invT`, `wind`, `act`, `swind`, `acd` — several
  of these are decremented unguarded each frame and will go NaN otherwise.

## 6. Roadmap

`DESIGN-PLAN.md` has the full reasoning. Sessions 6-9 of that plan are now shipped. What's left:

1. **Phone playtest and a feel pass.** Nothing else should be built before this happens.
   Judge: jump height, attack pacing, whether telegraph windups are long enough to react to,
   whether The Weight arrives too early, whether Focus starves or never binds, and whether
   17 tiles of view is the right zoom.
2. **Balance from real numbers.** Check the §5 economy table against actual runs — depth-scaled
   shards changed every figure in it and the table has not been re-derived.
3. **Art.** Blender to sprite sheets, dropped in behind `drawEntity()`.
4. **Music**, if it can be done without breaking the single-file property.
5. **Liquids** (the remaining Noita layer) and ongoing boss pattern states.

**Art path:** everything draws through `drawEntity(ctx, kind, x, y, w, h, col, face, frame)`,
which blits from `ATLAS` when one is loaded and falls back to flat rects when it isn't. Set
`ATLAS = {img, map:{crawler:{x,y,w,h,frames}, ...}}` and the game switches over with no other
change. Blender to sprite sheets is exactly the Dead Cells pipeline and the right call here.

## 7. Session log

| # | Shipped |
|---|---|
| 1 | Concept, chunked world, physics, melee/ranged, sockets, loot, camp, death loop |
| 2 | Shield block/bash, global armor supports, aura gems, chests, true arc math, entity caps, chunk eviction |
| 3 | Minibosses, enemy ranged attacks, shrines + boons, sealed vaults, loadout picker |
| 4 | Depth anchors, elites, secret walls, 7 gems, 5 gear bases, minimap |
| 5 | Status engine, ability system, uniques, 4 classes |
| 6 | `carve()` unification, flight + fuel, fall damage, Bore/Excavate, 4 traversal abilities |
| 7 | First browser render. Foundation lock (increased/more, crit, flat armor, status resist, stacking ailments, Shatter/Congeal/chain). Telegraphs on every attack + boss phases. Socket colors, Focus, gem tiers + fusion, the Vault, The Weight, descent bonus, death summary. 40 new gems, 10 new enemies, 12 alt uniques, 8 new affixes. Adaptive camera, depth lighting, parallax, art fallback layer, synthesized SFX, real PWA. Browser + PWA + screenshot harnesses. |
| 8 | Multi-device input (gamepad, mouse aim with assist, keyboard, touch) behind one abstraction, with prompts that follow the last device used. Title / pause / settings / controls screens, all controller-navigable from a single focus cursor. Codex: world, strata, bestiary, delvers and 13 depth-gated fragments, unlocked by playing. In-run levelling with three-choice attunements, and five Threat tiers unlocked by felling distinct bosses. |

Bugs the headless harness caught that a human would have spent an evening on:
`FLY_THRUST` set exactly equal to `GRAV` (hovering perfectly cancelled gravity and never
lifted — masked by the jump impulse in an earlier test); a tunneling projectile charging dig
cost per tile against a 2-tile radius and burning its entire lifetime in three frames.

Session 7 additions to that list, all found by reading rather than by playing:
`render()` drew its screenshake offset from the world-generation RNG, so the contents of a
chunk depended on how many frames had been drawn before you walked into it — the world was
not actually reproducible from its seed. Dodge had no cooldown, and its 0.30s of i-frames
outlasted its 0.22s duration, so holding the button was permanent invulnerability. Ailment
potency was captured at gem-mod time from a pre-multiplier damage value, so support gems
scaled the hit but not the burn. And the first browser render was only possible after the
test harness learned what a canvas gradient is — `render()` crashed under the old stub, which
looks exactly like a game bug in a failing suite and is not one.

A five-lens adversarial review at the end of session 7 raised 27 claims; 13 survived an
attempt to refute each one. The ones worth remembering, because they are the shapes that
recur in this codebase:

- **A field set on the cached attack but only read on one path.** Momentum, Culling and Chain
  were `for:'any'` supports whose payouts lived exclusively in `strike()`, the melee path.
  `doRanged` never copied them onto the projectile, so on any ranged build all three applied
  their `more` penalty and none of their upside — and the bow unique Windwake, whose entire
  effect is Momentum, was strictly worse than a white bow. Anything conditional now has to be
  handled in `strike()` **and** `projStrike()`.
- **A stat applied twice because it was baked in earlier.** Ailment potency already carries
  `ailmentMul()` from `resolveDmg`, so Shatter and Rupture multiplying by it again squared the
  player's ailment stat. Same shape as `digPower()` re-adding a class bonus `computeAttack`
  had already folded in, and as abilities passing `dkey='dmg'` into `resolveDmg`, which adds
  `inc(dkey)` *and* `inc('dmg')`.
- **An accumulator cleared before it was read.** `upPlayer` zeroed `P.hpDrain` at the top of
  the frame, so any drain credited from outside that call — Shatter fires from `applyStatus`,
  which runs during `upProj` — was silently discarded. Player Shatter dealt exactly zero while
  the identical combo on an enemy dealt full damage.
- **Targeting and damage disagreeing.** The Decoy changed which entity enemies measured range
  against, but the strike still called `hurtPlayer`, so a decoy across the room let every
  enemy hit you from wherever it stood.
- **An id shared across two tables.** `chain` was both the Chainmail gear base and the Chain
  support gem, and unlock ids are one namespace — 45 shards of armor also handed over a
  100-shard gem. Suite 7 now asserts no id is ever both.
