# SHARDFALL — Design Plan v2
**Companion to `shardfall.html` (1152 lines, sessions 1–5 shipped). This is the forward plan.**
Owner: Stephen / Lucid Winds. Read `roguelite-handoff.md` for the original concept.

---

## 0. Where we actually are

Built and tested: chunked world (6 biomes), platformer combat, gem sockets, 4 classes, status
engine, abilities, uniques, elites, minibosses, chests/shrines/vaults/secret caches, depth
anchors, meta tree, unlock pool, minimap.

**The system is now large enough that the risk has changed.** Sessions 1–5 were "does it
exist." Sessions 6+ are "does it cohere." The three things that will actually sink this build:

1. **Multiplicative soup.** Class × tree × boon × affix × gem × unique all stacking without a
   formal model. Balance becomes impossible to reason about.
2. **Content without roles.** 25 gems is a lot until you notice six of them are "+damage."
3. **No pressure.** Nothing stops farming the shallow caves forever, which is the safest and
   most boring strategy available.

Everything below is aimed at those three.

---

## 1. THE STAT MODEL (do this first — it gates all balance work)

### 1.1 Adopt PoE's increased/more distinction, explicitly

This is the single highest-value change in the whole plan. Two pools, never mixed:

| Layer | Term | Math | Sources |
|---|---|---|---|
| Additive pool | **increased** | `1 + Σ(all increased%)` | gear affixes, meta tree, class passives, shrine boons |
| Multiplicative | **more** | `Π(1 + each more%)` | support gems, unique item mods, ability empowerment |

```
finalDamage = baseDamage
            × (1 + Σ increased)      // one flat sum, grows linearly
            × Π (1 + more)           // each gem is its own multiplier
            × shockMultiplier        // status
            × critMultiplier         // see 1.3
```

**Why it matters:** right now four +15% damage sources give 1.75×. Under a naive all-multiplicative
model they'd give 2.01×, and by endgame the difference compounds into thousands of percent.
Additive-by-default keeps gear/tree/boons legible and linear; reserving *more* for gems makes gems
feel like the build-defining choice they're supposed to be. That's the whole thesis of the game.

**Code change:** `computeAttack()` currently does `a.dmg *= 1.3` for supports (correct — that's a
*more*) but lumps tree+class+affix+boon into one `(1 + a + b + c + d)` (also correct — that's the
additive pool). **The model is already right by accident.** Formalize it: rename to
`a.moreMults[]` and `a.increasedSum`, resolve at the end, and document that every new gem must
declare which pool it touches. Never let a support gem write into the additive pool.

### 1.2 The canonical stat list

Freeze this. Every new piece of content must map onto these and nothing else.

**Offense**
| Stat | Unit | Notes |
|---|---|---|
| `dmg` | flat | base from gear, scaled by both pools |
| `cd` | seconds | attack cooldown; "attack speed %" is `1/(1+inc)` |
| `range` / `arc` | px / degrees | melee only |
| `speed` | px/s | projectile only |
| `count` | int | projectiles per shot |
| `pierce` | int | enemies passed through |
| `explode` | px radius | AoE on impact |
| `kb` | impulse | knockback |
| `leech` | % of damage | heals player |
| `dig` | tile hardness | 0 dirt, 1 stone, 2 forge, 3 anything |
| `crit` / `critMult` | % / × | **NEW — see 1.3** |
| `st{}` | potency map | burn/chill/shock/bleed |

**Defense**
| Stat | Notes |
|---|---|
| `maxhp` | flat + class % multiplier |
| `armor` | **NEW — flat damage reduction, see 1.4** |
| `blockDR` | shield-only, class-modified |
| `statusResist` | **NEW — % duration reduction on incoming status** |
| `iframes` | dodge invulnerability duration |

**Utility**
| Stat | Notes |
|---|---|
| `ms` | move speed |
| `greed` | shard drop % |
| `focus` / `focusGain` | **NEW — ability resource, see 3.2** |

### 1.3 Add crit (missing, and the cheapest texture we can buy)

- Base: 5% chance, 1.8× multiplier.
- Crit damage numbers render larger and in `--gold`. Free dopamine, one render branch.
- Gives affixes and tree nodes a second axis so "+damage" isn't the only offensive roll.
- Support gem **Precision** (`more` crit chance, less base damage) becomes a real build pivot.
- Interaction to define now: crits apply status at **1.5× potency**. Makes crit builds and
  ailment builds overlap instead of competing.

### 1.4 Add flat armor (fixes the depth-scaling problem)

Currently `depthMul` scales enemy HP and damage linearly forever. By 3000m enemies hit for ~2.6×
and the player's only defense is more HP. Flat armor gives a second knob:

```
damageTaken = max(1, incoming - armor) × (1 - blockDR) × (1 - ironskin)
```

Flat subtraction means armor is *strong against many small hits, weak against one big hit* —
which automatically differentiates Vanguard (armor stacking, shreds swarms) from Marksman
(never gets hit, dies instantly if he does). That differentiation is currently only cosmetic.

### 1.5 Status effect rework (small but important)

Current: potency takes max, duration refreshes. Fine. Three additions:

- **Ailment stacking rule:** burn and bleed should *stack up to 3 instances* (each its own timer),
  chill and shock stay max-only. Damage-over-time that stacks rewards fast attack speed builds;
  debuffs that stack would be broken.
- **Status resist** on the defense side so deep biomes can lean on ailments without being unfair.
- **Elemental interactions** (this is the Noita-flavored bit, cheap to implement, huge for feel):
  - burn + chill → **Shatter**: both consume, burst of damage scaled by burn potency
  - shock + any hit → chains a bolt to one nearby enemy
  - bleed + chill → **Congeal**: bleed damage halves but duration triples

---

## 2. SKILL GEM CATALOG (the content plan)

**Design rule:** every gem must answer *"what build does this create that didn't exist before?"*
If the answer is "the same build but 15% stronger," it's an affix, not a gem.

### 2.1 Skill gems — melee (weapon-slot)

| Gem | Shipped | Role / build it creates |
|---|---|---|
| Cleave | ✅ | wide arc, crowd clear |
| Nova | ✅ | 360°, positioning-free, slow |
| Shield Bash | ✅ | knockback control |
| **Whirlwind** | plan | channel while held, drains focus, continuous hits — the "wade in" build |
| **Lunge** | plan | dashes forward on attack; mobility *is* the attack. Pairs with Momentum |
| **Riposte** | plan | usable only in the block window after taking a hit; huge damage. Makes Vanguard's shield active, not passive |
| **Sunder** | plan | low damage, applies armor-break debuff. The enabler for party-of-one burst |
| **Reap** | plan | damage scales with *missing* enemy HP — execution build, pairs with Culling |

### 2.2 Skill gems — ranged (weapon-slot)

| Gem | Shipped | Role |
|---|---|---|
| Fireball | ✅ | slow AoE |
| Lightning | ✅ | fast, pierces, spammy |
| **Grenade** | plan | lobbed arc, bounces, fuse timer — the only skill that uses gravity. Terrain-aware play |
| **Homing Wisp** | plan | slow seeker, fire-and-forget, low dps. The "kite" build |
| **Frost Lance** | plan | pierces, chills, damage ramps per enemy pierced |
| **Spore Burst** | plan | short-range cone, huge close damage — makes "ranged" viable point-blank |
| **Siphon Beam** | plan | continuous beam, drains focus, leeches. Sustain build |

### 2.3 Support gems (the real buildcraft layer)

All are `more` multipliers. Shipped: Multishot, Added Fire, Faster Attacks, Pierce, Life Leech,
Heavy Impact, Aftershock, Ignite, Frostbite, Conduit, Serration.

| Gem | Effect | Why it exists |
|---|---|---|
| **Chain** | on hit, bolt jumps to nearest enemy (2 jumps, 60% dmg) | crowd clear for single-target skills |
| **Fork** | projectile splits into 2 on first hit | pairs badly with Multishot on purpose — forces a choice |
| **Return** | projectile boomerangs back, can hit twice | rewards positioning |
| **Concentrated** | +55% more damage, −40% area/arc | the "I chose single-target" gem |
| **Culling** | instantly kills enemies below 12% HP | trash clear, feels incredible |
| **Momentum** | damage scales with current move speed | makes `ms` an offensive stat — build-defining |
| **Overload** | +80% more damage, +60% cooldown | slow heavy hits; anti-synergy with Faster Attacks |
| **Precision** | +more crit chance, −15% damage | the crit-build enabler |
| **Twin Strike** | attack twice at 60% each | doubles on-hit effects (leech, status) — the ailment engine |
| **Deep Cut** | ailments you apply deal +60% more, but you deal −25% hit damage | commits fully to DoT |

### 2.4 Aura gems (armor-slot, passive)

Shipped: Thorns, Regrowth, Swiftness, Ironskin.

| Gem | Effect |
|---|---|
| **Bloodscent** | +30% damage against bleeding/burning enemies |
| **Static Field** | periodic small shock pulse around you; applies shock, no damage |
| **Warding** | +50% status resist, −10% damage |
| **Prospector** | reveals ore, chests and secret walls on the minimap within 2 chunks |
| **Undertow** | while below 40% HP, +25% move and attack speed |

### 2.5 Ability gems (armor-slot, ABIL button)

Shipped: Blink, War Cry, Meteor, Mend, Quake.

| Gem | Effect |
|---|---|
| **Bulwark** | temporary overshield absorbing flat damage, scales with armor |
| **Shard Sentry** | drops a stationary turret that fires your *ranged* attack for 8s. Build-scaling ability |
| **Grapple** | fires a line, pulls you to terrain or pulls a light enemy to you |
| **Decoy** | spawns a taunt dummy; enemies retarget. The panic button for fragile builds |
| **Rupture** | consumes all ailments on nearby enemies for burst damage. The DoT-build finisher |

**Target catalog size:** ~45 gems. That's enough that no two runs socket the same six.

---

## 3. SYSTEMS TO ADD

### 3.1 Socket colors (replaces the "link groups" promise — better for mobile)

Original plan said real PoE link groups in v2. **Recommend against it.** Link-group UI is the
single worst thing to do to a phone screen. Get the same crafting tension for free instead:

- Sockets are colored **red (might) / green (finesse) / blue (focus)**.
- Every gem has a color. A gem only fits a matching socket.
- Gear bases have color *tendencies*: Greataxe rolls mostly red, Wand mostly blue, Robe balanced.
- Magic+ gear can roll a **Chromatic** affix: one socket accepts any color.

This creates the exact "I found the perfect gem but nowhere to put it" tension that makes PoE
loot exciting, costs one integer per socket, and needs zero new UI. Item link groups stay
implicit forever (everything in one item is linked). **Locking this in.**

### 3.2 Focus — the ability resource

Cooldown-only abilities mean the optimal play is "press ABIL whenever it's up," which is not a
decision. Add Focus:

- Pool of 100. Gain ~8 per enemy hit, ~2/s passively out of combat, 25 per kill.
- Abilities cost 30–70 Focus **and** have a cooldown. Both gates.
- Channeled skills (Whirlwind, Siphon Beam) drain Focus continuously.
- Class modifiers: Pyromancer gains Focus on *ailment ticks*, not just hits. Vanguard gains
  Focus when blocking. This is where class identity should live.

Ties aggression to power. Rewards the player for being in the fight, which is what a
side-view action roguelite wants.

### 3.3 Gem tiers (the long-tail shard sink)

Currently once you've bought every unlock, shards are worthless. Fix:

- Gems become `{id, tier}` (currently bare strings — **this is a real refactor, budget a session**).
- Tier 1 → 2 → 3. Fuse 3 identical gems + a shard cost (150 / 500).
- Each tier: +35% to the gem's *characteristic* number (a support's `more`, a skill's base damage,
  an ability's effect), and +10% cooldown for abilities so tiering isn't strictly free.
- Duplicate gems stop being disappointing — they're currency.

### 3.4 Depth pressure (kill the shallow-farm strategy)

Three cheap layers, in order of priority:

1. **Shard value scales with depth.** Multiply drops by `depthMul`. One line, fixes 80% of it.
2. **The Weight.** After ~90 seconds in a biome band, a slow debuff begins stacking (−3% damage
   and +3% enemy speed per stack, max 10). Resets on descending to a new band. Risk-of-Rain
   pressure without a visible timer, framed as the world noticing you.
3. **Descent bonus.** Reaching a new biome for the first time in a run grants a free shrine roll.
   Pull, not just push.

### 3.5 Vault runs (the meta hook that's missing)

Dead Cells' real hook is that death is a *scene change*, not a reset. Currently death is just
"lose all gear." Add:

- **The Vault** at camp: 3 slots. Before descending, one carried item can be deposited.
  It survives death and can be equipped on a future run.
- Deposit costs shards, scaling with rarity (uniques expensive). Gives a target to spend
  on and makes a great early unique feel like an event rather than a thing you'll lose in 4 minutes.

---

## 4. ENEMY & ENCOUNTER PLAN

### 4.1 Telegraphs (mandatory before any balance work)

Every attacking enemy needs a **windup state**: 0.35s of color flash + slight scale before the
hit lands. Without it, damage feels random and no amount of number tuning will fix that.
Cheap: one `e.windup` timer, one render branch. **Do this before adding a single new enemy.**

### 4.2 Roster by biome (3 grunts + 1 boss each)

| Biome | Grunts | Boss | Identity |
|---|---|---|---|
| Surface | crawler | — | tutorial |
| Caves | crawler, bat, **rockling** (burrows, ambushes) | Warden ✅ | teaches dodge |
| Fungal | spitter ✅, **sporeling** (dies into a cloud), **stalker** (fast, fragile) | Sporemother ✅ | teaches area denial |
| Ruins | brute, **archer** (long range, high dmg), **shieldman** (blocks from front) | Sentinel ✅ | teaches flanking |
| Forge | **ember** (explodes), **smith** (armored, slow, huge), spitter | Forgelord ✅ | teaches burn management |
| Abyss | **wraith** (phases through terrain), **void spawn** (splits on death), stalker | Voidmaw ✅ | teaches everything at once |

### 4.3 Boss phases

Each miniboss gets 2 phase transitions at 66% and 33%: shoot cooldown drops 25%, one new
pattern unlocks, brief invuln + roar. Currently they're HP sponges with one attack.

---

## 5. ECONOMY & CURVE

**Target run length: 8–12 minutes.** Everything below is calibrated to that.

| Run type | Depth | Shards | Notes |
|---|---|---|---|
| Early death | 100–300m | 40–80 | should still buy *something* |
| Competent | 600–1000m | 180–260 | one unlock per run |
| Deep | 1600m+ | 500–700 | with greed stacking, 900+ |

**Sinks (current total ~1400 shards):** unlock pool ~1000, tree ~315, classes 225.
That's ~12–18 runs to see most content — about right for a first arc. Gem fusion (3.3) and
the Vault (3.5) are the infinite sinks after that.

**Anti-degenerate check:** with depth-scaled shards (3.4.1), a deep run should out-earn a
shallow farm by ~4×. Verify with the headless harness before shipping.

---

## 6. BUILD ARCHETYPES (the validation test)

The system is working if all eight of these are reachable and distinct. If one is unreachable,
a gem is missing. If two collapse into the same play pattern, a gem is redundant.

1. **Bleed Vanguard** — sword + Serration + Twin Strike + Deep Cut, Bloodscent aura, Rupture.
2. **Crit Marksman** — Crossbow (Judgment) + Precision + Concentrated, kill before being seen.
3. **Ailment Pyromancer** — Wand (Ashfall) + Ignite + Deep Cut, Static Field, Rupture finisher.
4. **Momentum Delver** — Axe + Momentum + Swiftness + Undertow, never stops moving.
5. **Turret Engineer** — Shard Sentry + Multishot in armor, ranged supports; abilities are the build.
6. **Block Counter** — Shield both slots, Riposte, Bulwark. Blocks to win.
7. **Nova Bomber** — Nova + Aftershock + Overload, huge slow AoE, glass cannon.
8. **Excavator** — Worldbreaker + Prospector, ignores level design entirely, hunts vaults.

Note #8 is a *legitimate build*, not an exploit. The world is destructible; someone will
optimize for that. Reward it rather than patching it out — it's the most Noita thing here.

---

## 7. UI / UX PLAN (mobile)

- **ABIL button placement is currently a guess.** Test one-thumb reach; likely wants to be a
  round button above DODGE, not a wide bar.
- **Socket screen is the most-used screen in the game** and is currently a list of buttons.
  It needs to become a proper grid: item at top, sockets as colored circles, gem list below,
  drag or two-tap to place.
- **Damage readout:** a small "DPS estimate" line on the socket screen. Players cannot evaluate
  `more` multipliers in their head, and without feedback the whole gem system is guesswork.
- **Status icons** on the player HUD (have) and above each enemy (have, single-color tint —
  upgrade to small icons).
- **Death screen** should show a run summary: depth, kills, best hit, shards, what unlocked.

---

## 8. ART / ASSET PLAN

Everything currently renders from `TILES[].c` and flat `fillRect` calls. The swap path:

- **Blender → sprite sheets is exactly the Dead Cells pipeline.** They model in 3D, render
  to pixel sprites, and get lighting/animation consistency no hand-pixel artist can match at
  that volume. It's the right call and it's what the codebase is already shaped for.
- Keep the flat-shape renderer as a **fallback layer** so the file always runs standalone —
  `drawEntity()` checks for a loaded atlas and falls back to rects. Never break the "single
  file, no build step, works offline" property.
- Sprite budget for v1: player (idle/run/jump/attack/dodge/block), 4 grunts × 3 frames,
  5 bosses × 4 frames, tile atlas per biome, projectile/pickup icons. That's small enough
  to be one Blender project with a render script.
- Tiles are 16px. Render at 32px and downscale for crunch, or commit to 16 and hand-tune.

---

## 9. BUILD ORDER (next sessions)

Strict dependency order — do not skip ahead:

**Session 6 — Foundation lock**
1. Formalize increased/more in `computeAttack` (1.1)
2. Add crit + flat armor + status resist (1.3, 1.4)
3. Enemy telegraphs (4.1)
4. Depth-scaled shards (3.4.1)
*Nothing new is content until this is done.*

**Session 7 — Socket colors + Focus**
5. Socket colors on gear and gems (3.1)
6. Focus resource + ability costs + channeling (3.2)
7. Socket screen redesign with DPS estimate (7)

**Session 8 — Content wave**
8. ~15 new gems from §2, chosen to fill the 8 archetypes in §6
9. New grunts per biome (4.2) + boss phases (4.3)

**Session 9 — Meta depth**
10. Gem tiers + fusion (3.3) — budget the full session, it's a refactor
11. The Vault (3.5), The Weight (3.4.2), death summary screen

**Session 10 — Feel pass**
12. Browser playtest, tune everything, sound, PWA service worker

---

## 10. OPEN DECISIONS FOR STEPHEN

1. **Focus resource: yes or no?** It's the biggest gameplay change proposed here. It makes
   abilities a decision instead of a reflex, but it's a new bar on a small screen and a new
   thing to learn. I lean yes.
2. **Vault (carry one item through death) — does it undercut the roguelite?** Dead Cells says
   no, purists say yes. I lean yes-with-cost.
3. **Socket colors — confirm** we're doing this instead of link groups. Strongly recommend yes.
4. **Run length:** is 8–12 minutes right for a phone game, or should it be 4–6? This changes
   every number in §5.
5. **Do bosses gate progression?** Right now anchors unlock by depth alone. Alternative: an
   anchor only sets after you kill that biome's miniboss. More structure, more frustration.
6. **Title:** still SHARDFALL as working title. Locking it or not affects nothing technical,
   but the shard currency name is now load-bearing across the whole economy.
