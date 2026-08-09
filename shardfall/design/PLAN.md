# SHARDFALL — the long plan

**Status:** written at the end of session 8, to be executed cold by a fresh session.
**Companion files:** `CURRENT-STATE.md` (generated, real numbers), `RESEARCH.md` (evidence,
sourced), `art-prototype.html` (the visual spec, rendered).

Read this file first. It carries the decisions. `RESEARCH.md` carries the reasons and is
1,500 lines — do not read it front to back, search it when a decision needs justifying.

---

## 0 · How to start the next session

```bash
cd shardfall
./test/run.sh          # 429 assertions across 7 suites — must be green before you touch anything
node test/browser.js   # 36 checks in real Chromium
node test/pwa.js       # 24 checks: offline, save migration
node test/shots.js     # screenshots to test/shots/ — the only way to judge feel
./design/audit.sh      # regenerate CURRENT-STATE.md from the live tables
```

Then read, in order: `CLAUDE.md` (hard rules), this file's §1 and §2, then start Sprint 0.

Do not start by adding content. §2 lists five structural faults, three of them confirmed by
measurement this session, and every one of them makes new content worth less.

---

## 1 · Where we actually are

Eight sessions in. The game is playable, installs offline, plays on touch, keyboard+mouse and
gamepad, and has 429 node assertions plus browser and PWA suites behind it.

| | |
|---|---|
| content | 62 gems · 12 gear bases · 24 uniques · 19 enemies · 12 affixes · 68 unlocks · 22 attunements · 5 threat tiers · 13 lore fragments |
| systems | increased/more damage pools, crit, flat armour, stacking ailments with elemental interactions, telegraphed attacks, boss phases, Focus, socket colours, gem tiers + fusion, the Vault, The Weight, in-run levelling, threat tiers, codex |
| size | ~3,200 lines in one file, ~150 KB |
| verified | logic, offline install, save migration, input on three device classes |
| **not verified** | **feel, difficulty, pacing, and whether any of it is fun** |

That last row has been true for eight sessions and is still the largest risk. Everything below
is a plan for making the game better; none of it substitutes for someone playing it.

---

## 2 · The five things that actually matter

Ranked by how much they devalue everything else. The first three were **measured this session**,
not guessed.

### 2.1 · The descent has no shape — MEASURED

Sampling a 40×40 tile block at the middle of each biome band:

| biome | cave density param | actual air fraction |
|---|---|---|
| surface | 0 | 0.507 |
| **caves** | 0.055 | **0.904** |
| fungal | 0.06 | 0.381 |
| ruins | 0.05 | 0.411 |
| forge | 0.055 | 0.355 |
| abyss | 0.045 | 0.433 |

The caves band is 90% air — an open void, not caves. Then the world abruptly becomes *more
solid* and stays flat for the remaining 2,800 tiles. There is no arc: no opening out, no
tightening, no rhythm. The code comment claims density "grows a touch with depth"; it does the
opposite, and then does nothing.

This is the single biggest reason the game reads as samey at depth. A descent game's world
should have a shape you can feel. See RESEARCH.md → *Level, world and run structure*.

### 2.2 · Boss phases do nothing — CONFIRMED

`bossPhase()` sets `e.pat = next.pat`, and **`e.pat` is never read anywhere in the file.** The
pattern fires once as a burst on the transition and then the boss reverts to identical
behaviour. The comment above it claims `e.pat` "then colors ongoing behaviour". It does not.

So the five minibosses are still, functionally, the HP sponges the original handoff complained
about — now with a roar and a brief invulnerability. Every boss fight past the transition is
the same fight.

### 2.3 · Every telegraph draws the wrong distance — MEASURED

The whole point of the windup system is that a hit is readable before it lands, and the ground
marker shows `atk.range`. But the enemy then *lunges* on the active frame, so real reach is
`range + lunge × act`:

| enemy | marker shows | actual reach | lie factor |
|---|---|---|---|
| rockling | 26 | 93 | **3.58×** |
| stalker | 24 | 79 | **3.30×** |
| wraith | 28 | 82 | 2.94× |
| ember | 22 | 64 | 2.91× |
| voidmaw | 40 | 108 | 2.71× |
| *(all 19 enemies range 1.6×–3.6×)* | | | |

Standing just outside the marker is not safe on any enemy in the game. This actively teaches
the player the wrong thing, which is worse than having no marker.

### 2.4 · Loot has no depth axis

`mkItem(baseId, rarity)` takes no item level. Affix ranges are constant forever, the base pool
is unlock-gated but not depth-gated, and rarity odds are fixed at the drop site. Only *shard
count* scales with depth.

A sword found at 3,000 m is statistically identical to one found at 50 m. There is no reason to
look at loot after the first ten minutes of play, which quietly removes the entire reason an
ARPG exists.

### 2.5 · Everything looks the same because everything is a rectangle

Flat quads with a face dot. No silhouette language, so a rockling and a crawler differ only by
hue. Under the depth darkness at 1,500 m they differ by almost nothing. This is also a
*fairness* problem, not only an aesthetic one — you cannot react to a threat you cannot identify.

The pipeline for fixing this is already prototyped and proven (`art-prototype.html`); what's
missing is the roster and the discipline.

---

## 3 · Art direction — decided

The full spec renders in `design/art-prototype.html`. Open it. The decisions:

### 3.1 · Sprites are data, baked once

One string per pixel row, characters indexing a palette ramp, baked into offscreen canvases at
load, blitted thereafter. Runtime cost equals the `fillRect` it replaces. Adding an enemy stays
a table entry. Projected cost for the full roster: **40–60 KB of readable, diffable source**,
against a current file of ~150 KB. No build step, no asset files, single-file rule intact.

### 3.2 · One rig, many skins

Dead Cells' real saving wasn't 3D — it was *reusing one skeleton across every monster*
(RESEARCH.md → art, Vasseur: reuse "spared me hundred of hours"). We can't ship a 3D pipeline,
but we can ship that idea: **three parametric rigs** — humanoid, quadruped, floater — and every
one of the 19 enemies becomes a `(rig, proportions, ramp, top-shape, scale)` tuple.

### 3.3 · The palette

Six five-step ramps plus one reserved player ramp and four accents. Hue rotates warm→cool as
value drops, which is what stops a ramp reading as one colour at five brightnesses.

**The rule that does most of the work: nothing in the game may be cream except the player.**
Every terrain and creature ramp tops out at a muted mid-value. In a dark, destructible,
visually busy world the eye finds you instantly, and it costs nothing but discipline about which
hex values go where.

The research lens built and *measured* a 63-colour version of this against the real WCAG
luminance formula — its first attempt failed (a rust enemy at 1.14:1 against lit terrain) and
the corrected version clears **3.92:1 against terrain base, 2.61:1 against the brightest
terrain highlight**. Use those measured values, not the prototype's first pass. See
RESEARCH.md → art.

### 3.4 · Silhouette law

Every entity family gets a **mandatory unique top-shape** in the top two rows of its sprite box,
and a **unique ground-contact count**. Player: single tuft, 2 legs. Beast: two horns with a gap,
4 legs. Construct: flat overhanging top, 2 wide blocks. Swarm: domed, no top feature, 4 thin.
Wraith: single tapered spike, floats with a visible gap.

The test is mechanical: black-fill every sprite and name them. `art-prototype.html` renders that
test. If two read the same, one is redundant.

### 3.5 · Animation budget

Keyposes first, VFX over frames. Dead Cells is pose-to-pose at 30 fps with interpolation only
*outside* keys. A 2-keypose attack with a good arc streak, hitstop and a flash reads better than
an 8-frame attack with none. Budget: idle 2, walk 4, attack 3 (windup / strike / recover),
hit 1, death 3. Player gets more.

---

## 4 · Combat maths — decisions

Backed by RESEARCH.md → *Combat mathematics*, which carries the sourced formulas (PoE armour
`k=10`, D3 `armor/(armor+50·mLvl)`, D4's move of crit from multiplicative to additive, and the
20%/s leech cap).

### 4.1 · Keep flat armour, but cap it

`max(1, dmg − armor)` is the right *shape* — strong against swarms, weak against one big hit —
and it's what differentiates Vanguard from Marksman. But unbounded flat subtraction against
`depthMul`-scaled damage inverts at depth: armour stacking becomes either useless or total.

**Decision:** keep flat subtraction, add a floor of 15% of incoming damage.
`taken = max(dmg × 0.15, dmg − armor)`. Armour can remove at most 85% of a hit, ever.

### 4.2 · Enemy scaling is currently linear and unbounded

`depthMul = 1 + depth/900` reaches 4.5× at the floor, applied to HP *and* damage. Linear
scaling on both axes means time-to-kill and time-to-die both degrade together, which flattens
the difficulty curve into a wall.

**Decision:** split the curves. HP scales faster than damage, so deep enemies are *tougher*
rather than *deadlier* — that rewards build power without turning every mistake fatal.

| depth (m) | HP mult | damage mult |
|---|---|---|
| 0 | 1.00 | 1.00 |
| 400 | 1.55 | 1.30 |
| 900 | 2.30 | 1.65 |
| 1600 | 3.40 | 2.05 |
| 2400 | 4.80 | 2.45 |
| 3140 | 6.20 | 2.80 |

HP: `1 + (d/900)^1.15 × 1.45`. Damage: `1 + (d/900)^0.85 × 0.62`. Verify against the TTK
targets in §4.3 before committing.

### 4.3 · Time-to-kill and time-to-die targets

| target | hits to kill | seconds |
|---|---|---|
| trash grunt | 2–3 | 0.8–1.5 |
| tough grunt (brute, smith) | 5–7 | 2.5–4 |
| elite | 8–12 | 4–7 |
| miniboss | 45–70 | 40–75 |
| **player** | **6–9 hits from band-appropriate enemies** | — |

Write these as an assertion in a new suite: build a representative loadout at each depth and
check TTK lands in band. This is the single highest-value test we do not yet have.

### 4.4 · Crit cap

Base 5% / 1.8× stays. The cap is already 95%, which is right. Add: **crit multiplier is additive
with a soft cap at 4.0×** — D4 moved crit out of the multiplicative bucket for exactly this
reason and it is the main soup vector.

---

## 5 · The sprint plan

Each sprint ends green on all suites and with a commit. Do not start the next until the current
one is verified. Sprints are ordered by dependency, not by appeal.

---

### Sprint 0 — Fix what's broken (do this first, it's small)

The three measured faults in §2.1–2.3, plus the two the last review left standing.

1. **Telegraph honesty.** The ground marker must show `range + lunge × act`, not `range`. Either
   draw the real reach or cut the lunge distance so the marker is true. Recommend: draw the real
   reach, and reduce the worst offenders (rockling 420→260, stalker 460→300) so the tell is
   readable rather than merely accurate.
2. **Boss patterns.** Make `e.pat` do something, or delete it and stop claiming it does. Minimum:
   `e.pat` gates a second attack in `upEnemies` — `slam` adds a ground shockwave on the melee
   active frame, `volley` adds a second shot per burst, `spores` leaves a lingering cloud,
   `firewall` adds a burn trail, `summon` adds a slow trickle of adds.
3. **World shape.** Give the descent an arc — see §6.
4. **Windup floor.** Human reaction is ~250 ms; several grunts are at 220 ms and Threat III
   multiplies windups by 0.8, pushing 11 of 14 below it. Set a hard floor of **0.26 s after all
   multipliers**, and rebalance Threat III to shorten *recovery* rather than *windup*.
5. **Add a recovery state.** `tell → punish window → reset` is currently only two-thirds built:
   there is no recovery, so there is no punish window. Add `e.rec` after `e.act`, during which
   the enemy cannot act and takes +25% damage.

**Exit:** all suites green, plus new assertions for marker accuracy, windup floor, and `e.pat`
actually changing behaviour.

---

### Sprint 1 — Art foundation

1. Port the sprite baker from `art-prototype.html` into `index.html` behind the existing
   `drawEntity()` seam. Ship it with the player and the four caves-band enemies only.
2. Adopt the measured palette from RESEARCH.md → art (the WCAG-verified version, not the
   prototype's first pass). Add a contrast assertion to the test suite: **every actor ramp
   against every terrain ramp must clear 3:1.** This is a test, not a guideline.
3. Retile the terrain with the lit-edge treatment already in the prototype (lit top+left,
   shadowed base+right, consistent top-left light).
4. Three parametric rigs (humanoid, quadruped, floater) so the remaining 15 enemies are cheap.

**Exit:** caves band looks finished. Screenshots in `test/shots/` prove it. The rest of the game
still renders correctly on the rect fallback.

---

### Sprint 2 — Art rollout

The remaining 15 enemies, 12 gear bases (weapons should read in-hand), pickups, chests, shrines,
the camp flag, and per-biome tile sets. Silhouette test must pass for the full roster.

**Exit:** black-fill every sprite; all 19 nameable. No two share a top-shape within a band.

---

### Sprint 3 — Combat maths and difficulty

1. Split HP/damage scaling per §4.2.
2. Armour floor per §4.1.
3. Crit multiplier soft cap per §4.4.
4. Build a **TTK harness** — a suite that assembles a representative build per depth and asserts
   hits-to-kill and hits-to-die land in the §4.3 bands. This is how balance stops being vibes.
5. Rebalance Threat tiers against the new curves.

**Exit:** the TTK harness passes at every depth for every class.

---

### Sprint 4 — Itemisation with a depth axis

The §2.4 fix, which is a real refactor.

1. `mkItem(baseId, rarity, ilvl)` where `ilvl` derives from drop depth.
2. **Affix tiers.** Each affix gets 5 tiers with ascending ranges; `ilvl` gates which tiers can
   roll. This alone makes deep loot meaningfully better and is the missing ARPG spine.
3. Depth-gate base availability: greataxe/crossbow/plate shouldn't drop at 50 m.
4. Rarity odds scale with depth and Threat rather than being drop-site constants.
5. Vendor-trash reduction: fewer, better drops. Target **8–12 items per run, 2–3 worth a look,
   1 worth equipping** (see RESEARCH.md → items for the sourced ratios).

**Exit:** a 3,000 m item is visibly and statistically better than a 100 m item, and the death
summary can show "best item found".

---

### Sprint 5 — Boss and enemy design pass

1. Give each miniboss 3 real phases with distinct attacks, not one burst plus a colour change.
2. Add the missing enemy roles per RESEARCH.md → enemies. Current roster over-indexes on
   rushers; missing are a proper area-denial unit, a healer/buffer, and a positional threat.
3. Encounter composition rules — a threat-budget per spawn group rather than uniform random,
   so fights have shape.
4. Elite modifiers: audit which feel unfair. (Vampiric on a ranged enemy is the usual offender.)

**Exit:** every boss fight has three recognisably different phases.

---

### Sprint 6 — Skill/gear/buff depth

Guided by RESEARCH.md → skills, which found the support-gem catalogue is shallower than it looks:
too many supports are flat `more` multipliers rather than *contract changes*.

1. Rework supports so each answers "what does this let the skill do that it couldn't?" — trade
   on an orthogonal axis, add a trigger, change the targeting rule.
2. Audit for soup: 62 gems × 22 attunements × 12 boons × 15 tree nodes is a lot of stacking.
   Establish explicit power budgets per source and cap the additive pool.
3. Build an **archetype validator** — a headless test that constructs each of the 8 target builds
   from §6 of DESIGN-PLAN and asserts it reaches viable DPS and survivability at 1,500 m. If an
   archetype can't be built, a gem is missing; if two collapse into the same numbers, one is
   redundant.

**Exit:** the archetype validator passes for all 8, and no single build is more than 1.6× the
weakest viable one.

---

### Sprint 7 — Game feel

Every number here is currently wrong in a specific, measured way. See RESEARCH.md → feel.

1. **Screenshake is 5.9% of screen width at max** (16 px on a 272 px view). Hades is 0.4%.
   Cap at 8 px, replace linear decay with `trauma²`, add distance falloff, and stop shaking on
   ordinary hits — use a **local** enemy-quad offset and flash instead. In Hades only 3 of 207
   enemies shake the screen on death, all explosive.
2. **Add player-damage hitstop.** Hades gives ~10–40 ms at 10% speed for dealing damage and
   ~140 ms at 1% for *taking* it. We have none for taking damage. This is the highest-value
   single feel change available and it is what makes death feel earned.
3. Rewrite hitstop as a time-scale system with `preDelay / fraction / hold / lerpBack` — the
   impact frame must play at full speed *before* the freeze, and the freeze must never be a
   hard 0.
4. **Buffer and forgiveness timers must run on unscaled time.** A 160 ms hitstop currently eats
   the entire 120 ms jump buffer.
5. Widen the camera to 22–24 tiles, or lerp 17→22 with speed. 17 tiles makes the player 13% of
   screen height — about twice Celeste's ratio, in a game with flight and ranged enemies.
   **Caveat: this changes engagement ranges and interacts with depth scaling. Prototype first.**
6. Damage numbers: coalesce by source with a 0.25 s window (mandatory once auras and DoTs
   exist), cap at 24 live, shrink older ones, and never float a number for damage *taken* — use
   a directional edge vignette.
7. Audio: raise the voice budget from 6 to 16 with per-class caps and a 35 ms retrigger lockout;
   add a compressor on the SFX bus; pan by screen position.
8. Accessibility that also improves feel: `prefers-reduced-motion` detection (free in one HTML
   file), three intensity sliders, and Okabe–Ito colourblind-safe damage colours — which work
   because they vary *luminance*, not just hue, so it is a genuine palette swap rather than a
   redesign.

**Exit:** shot-for-shot comparison screenshots, and a feel checklist in the handoff.

---

### Sprint 8 — World structure

1. Implement the descent arc from §6.
2. Room templates stamped into the noise, rather than pure noise plus probability gates. Spelunky
   ships a small template set and gets enormous variety from placement; we currently have none.
3. Per-biome mechanical identity — a hazard and a traversal rule unique to each band, so a biome
   is not a palette swap. Candidates: fungal spore clouds that block sight, ruins crushers,
   forge heat that drains fuel, abyss darkness that only your lamp defeats.
4. Signposting for secrets so they're findable rather than lucky.

**Exit:** a blind descent has a felt rhythm; you can tell which biome you're in with the HUD off.

---

### Sprint 9 — Content wave 2, then ship

New gems and enemies to fill gaps the archetype validator exposes. Then: real playtesting,
tuning against the TTK harness, and a release build.

---

## 6 · The descent arc

Replacing §2.1's flat noise. Each band gets a *shape*, not just a density number.

| band | depth | shape | air target | mechanical identity |
|---|---|---|---|---|
| Rim | 0–10 | open sky, safe | — | tutorial, camp |
| Caves | 10–340 | **tight, winding** | 0.42 | teaches dodge; narrow corridors punish standing still |
| Bloom | 340–840 | **open caverns, vertical shafts** | 0.58 | area denial; spore clouds block sight |
| Ruins | 840–1540 | **architectural — rooms, corridors, doors** | 0.48 | flanking; built geometry, not caves |
| Forge | 1540–2340 | **narrow and hot** | 0.36 | burn management; heat drains fuel |
| Abyss | 2340–3140 | **vast, dark, sparse** | 0.62 | everything at once; your lamp is the only light |

The arc: **tight → open → built → tight → vast.** Tension and relief alternate, and the final
band is the most open *and* the most dangerous, which is the note to end on.

Caves at 0.42 rather than today's 0.90 is the biggest single change — it currently plays as an
empty void.

---

## 7 · Decisions for Stephen

1. **Camera width.** Research says 17 tiles is roughly half what a game with flight and ranged
   enemies wants, and recommends 22–24. But that changes every engagement range and interacts
   with depth scaling. Widen, or keep it tight and intimate? *My recommendation: dynamic — 17
   at rest, 22 when moving fast.*
2. **Art scope.** The sprite roster is ~2 sprints of the plan. Worth it, or ship the mechanical
   improvements first and take art later? *My recommendation: do it now. Everything else is
   invisible until the game reads.*
3. **How hard should this be?** The TTK targets in §4.3 are a genuine design choice — 6–9 hits
   to die is Hades-ish, 3–4 would be Dead Cells-ish. *My recommendation: 6–9, because the game
   has flight and destructible terrain and therefore more ways to make mistakes.*
4. **Does the Vault stay?** Carrying an item through death is the one thing that softens the
   roguelite loop. It's built and it works — but if the game gets easier through art and feel
   work, this is the first thing to cut.
5. **Sky Wolf Studios.** Shardfall has not been raised with the Director. If it joins the
   sunbeams shared economy, the shard currency needs a conversion story and that's a Sprint 4
   dependency, not an afterthought.

---

## 8 · What this plan is not

It is not a promise that the game will be good. Every number here is either sourced from a
shipped game or marked as a proposal, and *none of it has been tested against a person playing
this game*. The plan's own §1 says the largest risk is that nobody has played it, and nine
sprints of work do not change that.

The highest-value thing that could happen between now and Sprint 0 is somebody spending ten
minutes with it on a phone and writing down what felt bad.
