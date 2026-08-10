# SHARDFALL CONTENT-DESIGN CHEAT SHEET
From `design/RESEARCH.md` (sourced) + `design/PLAN.md` (decisions). Per point: principle — evidence — numbers.

## READ THIS FIRST — what is already settled (do not re-litigate)
- Sprints 0, 3–8 SHIPPED (PLAN.md header). Most RESEARCH "fix" findings are now live rules
  enforced by test suites 10–15: telegraph honesty (`atkReach = range + lunge×act`), windup
  floor via `mkAtk()`, three-beat fights (`wind → act → rec`), split HP/damage depth curves,
  affix tiers on ilvl, room templates, Echo ladder. New content must OBEY these, not reinvent them.
- Where PLAN and RESEARCH disagree, PLAN carries the decision: armour floor `max(dmg×0.15,
  dmg−armor)` (RESEARCH proposed a ratio model — rejected); depth curves HP `(d/900)^1.15×1.45`,
  dmg `^0.85×0.62` (RESEARCH proposed 1.75/1.10); windup floor is `WINDUP_FLOOR` in code
  (PLAN said 0.26s, RESEARCH argued 0.36s single / 0.45s groups — check the shipped constant).
- Two damage pools, combined ONLY in `resolveDmg()` as `base × (1+inc) × more`. Gear/tree/
  boons/attunements feed `inc` (additive). Supports and uniques feed `more` (multiplicative).
  A support touching `a.dmg` is a bug (CLAUDE.md rule 5).
- All content is a DATA TABLE entry. If a new gem needs an `if (gemId==='x')` branch, the
  table is missing a field. Conditionals live in `condMul()`/`onHit()`/`onKill()` and MUST pay
  identically on melee and ranged paths (suite 13 asserts this).

## 1 · SKILLS / SUPPORTS — the contract-change principle
- **A support is a transformation of a skill's contract, not a damage source.** Evidence: 22
  verified PoE2 supports; ~77% carry an explicit drawback ("less", "cannot", "+cooldown",
  "once every Xs"); the pure-upside minority all carry a 120% cost multiplier. Shardfall's
  shipped support drawback rate was ~60% — target 80% for the new wave.
- **Three tests separate a support from an affix** (RESEARCH → skills, testable rule). A deep
  support fails at least one; a flat one passes all three:
  1. Does it change the SHAPE of the attack (count, area, range, timing, targeting)?
  2. Does it create a NEW dependency (make a previously worthless stat worth investing in)?
  3. Does it close a door (lockout)?
  A gem reading "+X% more damage" with no rider is an affix wearing a gem's clothes.
- **Five valid support shapes, with PoE2 reference numbers** — write every new support as one:
  - TRADE on orthogonal axis: Concentrated Effect 40% more area dmg / 50% less AoE;
    Scattershot +2 proj / −20% proj dmg / −20% speed.
  - LOCKOUT: Elemental Focus 25% more / CANNOT ailment; Controlled Destruction 30% more /
    CANNOT crit; Brutality 35% more phys / NO elemental or chaos.
  - CONVERSION: Cold Infusion 25% as cold / 50% less fire+lightning.
  - CONDITIONAL: Ambush 100% more crit vs full-life; Execute 40% more vs low-life — condition
    must be visible enemy state or player positioning the player can manufacture.
  - TEMPO: Hourglass 40% more / +10s cooldown; Fist of War max once per 6s.
- **Anti-synergy is deliberate design: the top multipliers must be mutually exclusive** so
  "stack everything" is not a build. PoE's biggest damage gems each nuke a neighbour archetype
  (Elemental Focus poisons ignite; Brutality nukes added-fire). Give every gem a tag set
  (hit/ailment/aoe/projectile/crit/elemental/physical/tempo), declare conflict pairs, and GREY
  OUT conflicts in the socket UI with the reason printed — the player learns the rule.
- **Conditional traps to never ship**: (i) conditions on hidden state; (ii) conditions that
  reward NOT playing (persistent below-X-HP states — convert to "for 5s after dropping below
  X" windows); (iii) low-probability triggers on high-rate attacks (see proc coefficient).
- **Proc coefficient before any new on-hit trigger.** RoR2: one scalar per attack multiplies
  trigger chance AND applied duration (Nailgun 0.6, DoT ticks 0.0; chains geometrically damp —
  Ukulele's chain at 0.2 turns a 10% AtG into 2%). Shardfall's attack-rate spread is 5.6×
  (siphon 0.08s effective → crossbow 0.9s), so an unscaled trigger is worth ~10× more on a
  channel. Pattern: `a.proc = clamp(a.cd/0.5, 0.15, 1.5)`; proc = 0 on explosion/chain/
  sentry/DoT damage so nothing loops.
- **Rate-limit kill/hit-driven resource refunds** (Fist of War pattern): anything like
  "kills cut Xs from cooldown" needs a per-0.5s cap or Threat-V density drives it to zero cd.
- **Ailment stacking contract determines the build it rewards** (PoE ships three on purpose):
  highest-only (ignite/bleed) → one enormous hit, crit, slow weapons; unlimited stacks
  (PoE1 poison 30%/s×2s) → hit rate; capped stacks (PoE2 poison, limit 1 raisable) → stack
  count as build resource. Shardfall is capped (STACK_MAX 3, replace-weakest): any weapon with
  cd ≤ dur/3 is already saturated, so attack speed past that is worth ZERO to the DoT half.
  Surface this in tooltips; design new ailment gems knowing the saturation point.
- **Ailment potency derives from PRE-more damage** (PoE1 ignite = 90% of BASE fire damage,
  pre-inc/pre-more). This is what separates "ailment build" from "more-stacking build" into
  two archetypes instead of one stacked answer. Keep the separation in every new ailment gem.
- **Archetypes are only real if you author a destination.** Hades: 28 Duo Boons = 28 explicitly
  gated build capstones; Dead Cells: exactly 3 colours. Combinatorial possibility is NOT
  archetype count. Shardfall's named list (12–14, suite 13): each needs one capstone (e.g. T3
  gem + specific unique unlocks a named combo). If an archetype has no capstone it's a
  preference. New classes/gems must map onto a named archetype or add a new one WITH capstone.
- **Support ceiling per routine is a printed rule**: PoE1 caps at 5 supports (6-link is the
  most expensive goal in the game). PoE2 tried "each support in only ONE skill" and REVERTED
  it in 0.3.0 — scarcity-based anti-soup failed on feel at scale. Shardfall's answer: cap
  contributing gems at 4 per routine (5th+ grants riders only), enforced in computeAttack().
- **Global (armour-socketed) supports must pay a tax** — untaxed global linking is a 3:1 value
  asymmetry that made one robe the correct chest for every build. Either 60% off-routine
  strength or tag-gate globality (rider gems global, raw multipliers local).
- **Two shapes of one resource gate = two playstyles for free.** Hades Cast: Infernal Soul
  (3 stones, spatial retrieval, rewards aggression) vs Stygian Soul (1 stone, ~3–5s auto
  regen, rewards patience). One meta node — "abilities become a 2-charge magazine refilled
  only on kill" — converts the whole ability roster into a second playstyle.

## 2 · ENEMY DESIGN — roles, roster completeness, elite fairness
- **Nine-role taxonomy; each role teaches exactly one verb** (L4D: each special is defined by
  what it does to your POSITIONING). RUSHER (dodge), SKIRMISHER — fast, fragile, disengages
  (spacing), BRUISER — slow, huge tell, long recovery (the punish loop), BLOCKER (flanking),
  SNIPER (cover), AREA-DENIAL (read the arena), EXPLODER (kill order + distance),
  POPULATION/SUMMONER (priority targeting), ANTI-AIR (flight costs something). Roster session
  10 covers these (suite 11 asserts role coverage); every NEW enemy must name its role, and a
  new enemy that duplicates a role must differ in the verb it punishes, not just its numbers.
- **A roster is complete when it supplies ~20 distinguishable 30-second encounters per run**
  (Halo/Griesemer: recombination, never repetition; L4D 7–8 specials; Doom Eternal 7+ types
  simultaneously; past ~10 roles players can't name what they see). Add recombinations, not
  an 11th role.
- **One new role per biome, everything recurs at increasing budget.** Teaching order: Rim
  (rusher) → Caves (+bruiser, +flyer) → Fungal (+exploder, +skirmisher, +area denial) → Ruins
  (+sniper, +blocker) → Forge (+anti-air, +heavy-ranged) → Abyss (+summoner, +phaser plus
  recombination). Abyss should feel like graduation, not a new game.
- **Windup floor: no tell under ~0.36s single-target, 0.45s in groups of 3+** (simple RT
  230–250ms; choice RT +150–200ms; Hollow Knight's Hornet — a BOSS — never anticipates faster
  than 0.50s; Tekken: 383ms+ truly reactable). Active windows 0.12–0.24s are fine inside the
  0.30s dodge i-frames. `mkAtk()` clamps to WINDUP_FLOOR — never bypass it.
- **Recovery is where the fight lives**: rec 0.20 (skirmisher) / 0.35 (standard) / 0.60–0.80
  (heavy) / 0.9–1.2s (boss heavy); velocity damped, direction locked, +25–30% damage taken in
  a distinct colour. rec must exceed dodge 0.22s + one swing so a punish always fits.
- **Never randomise WHEN; randomise WHICH.** The Elden Ring input-reading backlash is about
  variable timing converting reaction into memorisation.
- **The token rule**: dodge answers ~1.8 strikes/sec; six in-range enemies generate 3.4/sec.
  Attack-token pool of 2 (3 in boss arenas, one reserved for the boss); token-less enemies
  crowd and block escape lanes. Composition caps: max 1 ranged per 4 on-screen (hard 2), max
  1 blocker, max 2 exploders never within 2× blast radius, max 1 summoner never with a
  splitter, max 1 elite until Threat IV.
- **Spawning is a credit budget, not a probability** (RoR2 Director, datamined): per-enemy
  costs 8 (crawler) → 70 (smith), budget grows with depth, anti-trickle rule (never buy the
  cheap thing when you can afford the expensive one) so a deep budget buys wraiths, not
  twenty crawlers. Cost every NEW enemy on this scale. Elite cost ×2.5 (RoR2 prices T1 elites
  at 6× for 4×HP/2×dmg — priced slightly above power so elites stay a treat).
- **Elite fairness — the delay-before-lethality law.** Every FAIR D3 affix has a fuse (Frozen
  4s to explode, Frozen Pulse 1.5s inert, Arcane 2s delay, Desecrator 1s in/out, RoR2
  Overloading 1.5s fuse). Every UNFAIR one removes a player verb — D3's auto-skip tier is
  Waller (escape), Juggernaut (CC), Shielding (damage); PoE stripped "cannot regen/leech"
  from T17 for the same reason. NEW elite affixes: always a fuse, a 0.6s+ fade-in, a readable
  footprint. NEVER ship: shortened tells, movement blocks, damage reflect, invisible drains
  (vampiric needs a visible tether).
- **Speed is the most expensive knob** — Supergiant prices enemy speed at 3 Heat/rank vs 1 for
  damage, because speed compresses the reaction window. Cap elite speed ~×1.35; speed and
  windup modifiers mutually exclusive.
- **Single-hit clamps**: no non-boss hit over 0.40–0.45× player max HP; telegraphed boss heavy
  max 0.55×. Let FREQUENCY carry difficulty, not spike size.
- **Enemy density budgets against AIR, not area** (Dead Cells, the one published number:
  1 monster per 5 combat-eligible tiles; monsters budgeted only against eligible space,
  with per-monster constraints — some can't repeat per level or share a platform).
- **Windup silhouettes per role, not one shared strobe**: rusher compresses + leans; bruiser
  stretches 25% + ground shadow equal to reach; ranged pulls a bright dot back along the
  firing line; exploder fades in a hollow ring at blast radius. Reactability = frames ×
  animation distinctiveness (Tekken); distinct silhouettes buy back ~60ms of ID cost.
- **Danger colour channel on projectiles**: white core = fast/must-dodge, hollow core = slow/
  leadable. Colour must encode THREAT, not just biome flavour.

## 3 · BOSS DESIGN — phase structure
- **Gate at 66%/33% (Hades Bone Hydra) — and each phase must ADD an attack**: 3 → 4 → 5
  attacks per phase (Hydra has 3 in phase 1; Hades Extreme Measures escalates by adding a
  PATTERN per rank, never by shrinking a tell or inflating a number). A phase that only
  changes colour is not a phase.
- **Every boss gets 2 patterns nobody else has** — the only place identity can live when
  bosses share one melee+shoot skeleton. Cut boss COUNT before cutting distinctiveness.
- **Gate at least one boss on a MECHANIC, not HP** (Mantis Lords: killing lord 1 spawns two
  more — the player causes the transition; e.g. sporemother: destroy 3 spore sacs).
- **Transitions telegraph as gap structure** (danmaku law: patterns are "a design of bullets
  AND gaps"; fairness = a readable escape route). 0.55–0.80s tell per pattern; roar+invuln
  FIRST, telegraph begins as the invuln ENDS; ring attacks show dim spawn dots; a firewall
  deliberately drops one column so a lane is always clear; a slam draws its exact radius.
- **Boss tells sit ABOVE grunt tells** (0.58–0.68 melee, 0.55–0.70 shoot) — highest damage
  never pairs with fastest windup.
- **Boss HP comes from measured TTK, not a depth constant.** Target 60–90s (Hollow Knight
  ~30–90s, Hades 1–3min), hard ceiling 2min/player (Ask a Game Dev). For deep bosses split
  HP across bodies (Mantis Lords 210 → 160+160) so the fight gets chaotic rather than long.
  Caveat: build power spread means one HP number can't serve all builds — instrument first.
- **Guarantee the climax**: exactly one boss arena per band at 78–88% band depth (StS
  guarantees floors 1/9/15/16/17). A 4.2%/chunk gate left 28% of runs with no Caves boss
  while progression gated on boss kills — never probability-gate a mandatory beat.

## 4 · ITEMIZATION — ratios, tiers, uniques
- **Depth is the item axis; ilvl gates everything** (D2: alvl from ilvl, `(ilvl−qlvl)` pushes
  rarity; PoE: IncreasedLife has 13 tiers gated at ilvl 1→86). Shipped in Shardfall as
  `mkItem(base, rarity, ilvl)` + 60 affix tiers — every NEW affix needs tiers with ilvl
  gates; every new base needs a depth-tier assignment.
- **Two tier-weight idioms — use both deliberately** (PoE, datamined): STAPLES (hp, arm,
  res…) uniform weights → top tier P ≈ 1/Ntiers (~7.7–16.7%), rarity from being unlocked
  last; CHASE stats (dmg, critMult, cdr, crit) decaying weights → top tier a genuine lottery
  (PoE Merciless P = 0.90%; Shardfall's vector [1000,1000,600,300,140,60] → 1.94%). This
  distinction is what separates "a good rare" from "THE rare".
- **Compress top tiers of stats that break at 4×**: PoE attack speed's top tier adds ONE
  point of range (26–27); move speed and leech get ~3× top-to-bottom, not 4–6×.
- **Affixes are tagged to bases** (D2 frequency-sum selection): a Plate must not roll attack
  speed, a Sword must not roll +fuel. Weight matrix per (affix × base-class); this alone
  kills a large share of drop noise. Prefix/suffix split (power vs rate/utility) + affix
  COUNT scaling with depth is a free second progression axis (D2 rares: literally {3,4,4,5,5,6}).
- **The unique contract: break exactly one rule, pay exactly one cost.** Evidence: Kaom's
  Heart +500 life / HAS NO SOCKETS; Shavronne's (chaos doesn't bypass ES) created an entire
  archetype; Enigma (+1 Teleport for any class) rewrote D2; Mjölner breaks cast-vs-attack.
  A unique that is big numbers with no downside is a rarity tier, not a unique, and generates
  zero build diversity. Reference implementations in-file: Judgment (more×2.4 / cd×1.9) and
  Hornet's Call (+2 arrows / more×0.65). Audit every NEW unique against this sentence.
- **Uniques get rolled ranges on their SIGNATURE mod, not a bolted-on generic affix** — 24
  fixed outcomes become 24 families with a perfect-roll chase at zero content cost. Narrow
  the roll window toward the good end as depth band rises.
- **The D2 three-tier ladder is the cheapest content multiplier**: the same unique name
  re-found deeper with better values and a new rule broken. Distribute new uniques by depth
  tier (16 shallow teach the language / 20 deep at B4+ / 8 boss-locked abyssal), NOT evenly
  per base — targeting improves precisely because you descended.
- **Rarity ceiling law** (D2): infinite Magic Find buys at most 8× the base unique rate.
  Any greed/find stat needs an explicit cap (+80% relative).
- **Pity bounds the dry streak; keep base rates genuinely low** (StS rare offset −5%, +1%/roll,
  reset on hit, cap +40%; Dead Cells legendary altar 2% +15% per biome without one; PoE
  skips pity and pays with deterministic crafting instead). Shardfall pattern: rareBonus
  +0.35%/drop cap +8%, uniqueBonus +0.25%/drop cap +5% — four lines that convert the worst
  run in a hundred from "zero rares" to "a late rare".
- **Drop volume target: 8–12 items/run, 2–3 worth a look, 1 worth equipping** (PLAN Sprint 4;
  measured pre-fix baseline was ~17 gear + ~32 gems ≈ 3.3:1 noise on gear, 10:1 on gems).
  Loot leverage order: (1) don't generate trash (D3 Loot 2.0: "fewer drops, greater value";
  suppress normal rarity at depth); (2) LABEL it — computed "+14% DPS" on the ground pickup
  beats any drop-rate tweak (NeverSink rule: hidden items are always the cheapest layer);
  (3) auto-convert walked-over trash to shards.
- **Wow cadence target: 1 per 2.5 min, 4 per run, ≥1 in the first 90s** (own proposal
  reasoned from shipped pity maths — instrument it, define "wow" explicitly).
- **Slot power budget** (WoW, reverse-engineered): geometric ladder — each slot tier 75% of
  the previous; weapon 1.00 / armour 0.60 / second weapon 0.50 / shield 0.40. One `power(item)`
  function; every new base lands within ±10% of its tier target. Within a depth tier keep
  bases within ±8% DPS and differentiate on cd/range/arc/pierce/dig/sockets — ≥3 credible
  options per slot per tier or a base drop isn't a choice.
- **Sockets are the strongest drop and must be depth-gated** — a support gem outvalues any
  affix; never grant sockets unconditionally with rarity.
- **Currency survives only with an uncapped variance sink** (D2 gambling 89.85/10/0.1/0.05
  at a flat price ≈ one deep run's income; D3 Law of Kulle reforge). At least one sink must
  be repeatable, uncapped, and return VARIANCE, or the currency dies when the tree is bought
  out. Price in multiples of measured median run income S so the economy self-calibrates.

## 5 · WORLD / ROOMS
- **The solution path is the spine** (Spelunky: 4×4 room grid, path walked first — 1-2 left,
  3-4 right, 5 down — off-path cells are optional; interiors re-randomised from 5×3 obstacle
  sub-templates = enormous variety from a tiny library). Shardfall's descent spine + 6 room
  templates shipped; new room content should be MORE templates and sub-template interiors,
  stamped from the `terrain` strand ONLY (CLAUDE.md rule 18 — a shrine may not carve its own
  cavity; contents are `poi`).
- **Guarantee the beats, roll the filler** (StS floors 1/9/15/16/17 fixed; reject-and-reroll
  rules prevent clumping — no consecutive elite/rest, min-distance rules). Per band: 1 boss
  arena, 1 shrine, 1 secret, 1 shaft guaranteed; extras probabilistic from a band POI budget
  (RoR2 scene credits: 220–520/stage, chest 15, shrine 20 — variance in the MIX, never the total).
- **Biome identity is a GEOMETRY property, not a palette** (Dead Cells: per-biome room GRAPH —
  ramparts linear, sewers tight and jump-restricting; Noita: Hiisi Base is built/mechanical,
  Jungle organic, Vault architectural — the GENERATOR differs). Each band: one hazard + one
  traversal rule (spore clouds block sight + drain fuel ×1.5; ruins pressure plates + hard
  brick blocks straight falls; forge magma with Hades' exact 1.0s contact grace then ramping
  6→14 hp/s; abyss void seams, no collision, 2× gravity). One behaviour per tile type, in the
  TILES table.
- **The descent arc alternates tension and relief**: tight → open → built → tight → vast
  (air targets 0.42/0.58/0.48/0.36/0.62, PLAN §6 — shipped, measured 0.38→0.66). Descent
  games need EMPTIER levels than horizontal ones and air-occupying enemies (Downwell/Fumoto:
  "way fewer platforms, way more floating enemies"). New rooms must respect band air targets
  (suite 14 asserts them).
- **Punctuate band boundaries with a safe room** (Noita Holy Mountain: guaranteed enemy-free
  chamber + permanent choice between every biome — relief beat, reward choice, checkpoint
  feel, one room, four jobs). Boundary chamber: carved, enemy-free, ~20×12, guaranteed
  shrine + anchor + heal.
- **Show the reward before the commit** (Hades: every door shows its reward icon; StS shows
  the whole act map). A next-stanza readout turns descent from random walk into route choice.
- **Secrets: learnable rule + discoverable instance** (Super Metroid critique: no visual
  difference between fixed and destructible = wall-bombing tedium; Hollow Knight: consistent
  tell + proximity cue). Secret tile gets a visibly distinct colour + hairline + proximity
  particle; an aura may REVEAL from anywhere but must never be the only way to perceive one.
  Density ~1 guaranteed per band + 1 floating at 40% ≈ one per 90s.
- **Draw boons/attunements without replacement per run** — 10 shrine picks × 3 choices
  against a small table repeats fast; weight each band's shrine toward its identity (Fungal →
  ailments, Forge → burn/armour) so rolls reinforce the biome.

## 6 · DIFFICULTY / ENDGAME REPLAYABILITY
- **Escalate structurally, not numerically.** Across Hades' ENTIRE 32-Heat ladder, stat
  inflation is only +100% enemy damage and +30% HP — everything else is structural: more
  bodies (Jury Summons +20%×3), less healing (Lasting Consequences −25%×4), a clock (Tight
  Deadline 9:00→7:00), disabled talents, NEW BOSS PATTERNS (Extreme Measures). Dead Cells
  Boss Cells don't multiply stats either: they raise item level (+1 at 3BC, +3 at 4–5BC) and
  REMOVE HEALING (fountains gone at 2BC, 3 flasks at 3BC, zero at 4–5BC). StS Ascension adds
  movesets at A17. Never ship a tier that is "enemies ×2.5 HP".
- **Difficulty is an itemised ladder the player composes, priced by fairness cost** (Hades
  Heat: damage 1 Heat/rank, SPEED 3 Heat/rank — Supergiant's own judgement that compressing
  reaction windows is the expensive knob). Shardfall's Echo ladder rules should stay named,
  per-rank, single-axis; derive reward multiplier from total rank. Deleting a player verb
  (shorter tells, movement blocks) is never a valid rung — that's D3's auto-skip tier and
  PoE's removed T17 mods.
- **Reward scaling must ride the same curve as enemy scaling** (RoR2: reward = coeff ×
  monsterValue — the SAME coeff that scales monsters) or farming shallow beats diving and
  the loop inverts. Echo/threat rungs must raise shards/rarity in step.
- **Anti-farm needs a terminal answer, not a cap** — a capped penalty is a farming license
  (pre-rework Weight: ~25 min of ceiling-capped free farming). Shipped patterns: Spelunky
  ghost (warn 2:00, spawn 2:30 — unkillable pursuer); RoR2 uncapped time scaling (+0.15
  coeff/min solo Monsoon, but advancing multiplies 1.15×/stage AND is the only loot source —
  a rate race, not a wall); Dead Cells inverts it into REWARD for speed (timed doors 2:00→
  26:00, 20 cells each; excluded time: shops, transitions, lore rooms).
- **The Dead Cells cursed-chest shape is the best opt-in risk knob**: 10-curse (any hit =
  death, −1 per kill) for an item two gear levels above the biome — risk chosen at a chest,
  paid immediately, rewarded concretely. Steal for new bounty/Echo content.
- **New-content unlock order beats stat inflation for replayability**: elites introduced one
  affix per biome (armored → volatile → swift → vampiric → full pool); deepest Echo rungs add
  a new boss pattern and a deeper-pool enemy per biome (Extreme Measures move) rather than
  multiplying anything.
- **TTK bands are the contract every new enemy/class must pass** (suite 10 enforces): trash
  2–3 hits / 0.8–1.5s; tough grunt 5–7 / 2.5–4s; elite 8–12 / 4–7s; miniboss 45–70 hits /
  40–75s; player dies in 6–9 band-appropriate hits (PLAN §4.3 — "6–9 is Hades-ish, 3–4 would
  be Dead Cells-ish"; 6–9 chosen). Balance in hits-to-kill, not raw numbers.
- **Ship-gate balance on a computed metric, not vibes**: Top-D Diversity — how many named
  archetypes land within 1.25× of the best median TTK at fixed depths/threats. Gate: ≥10 of
  12 viable AND best/worst ≤ 2.0 (PLAN says no build >1.6× the weakest viable). Without a
  sweep you only ever verify the builds you personally like.

## 7 · STORY DELIVERY (thin in RESEARCH.md — flagged gap)
- RESEARCH.md has NO dedicated narrative research. The Hades death-as-narrative-beat model
  (death returns you to a hub where characters comment on how you died — the loss itself
  delivers story) is genre-standard but UNSOURCED here; verify before citing numbers.
  What IS sourced and transfers:
- **A non-art channel can carry all the identity** (Thomas Was Alone: entire cast =
  rectangles, identity via proportions + colour + ABILITY + narration; won a BAFTA for the
  narration). Shardfall's silhouette laws + lore fragments are that channel — new story
  content should attach voice/text to existing mechanics, not demand new art.
- **Structural hooks already shipped that story should colonise**: 13 lore fragments + codex
  (attach fragments to the guaranteed per-band secret cache so lore is the secret's reward);
  band-boundary safe rooms (Noita's Holy Mountain is where the game "speaks" — the natural
  place for delivered story between fights); the Lattice escape (the master glyph is already
  the narrative endpoint — death-and-return dialogue should reference dissonance state).
- **Excluded-time precedent** (Dead Cells: lore rooms don't count against timed doors) —
  if story rooms exist, they must not tax the Weight/timer, or players skip them.

## 8 · POWER BUDGET / SOUP PREVENTION — the standing laws
- **Soup = N independent multiplicative pools reaching the player**; the best/median gap
  grows exponentially in N. Measured pre-fix: 4 more-supports = 5.26× (T1) → 12.43× (T3)
  vs a 2.5× additive ceiling — a 5:1 inversion; full-stack build 2300 DPS vs 64 unbuilt
  (36:1) — no HP curve can serve both. Count the pools honestly for any new content:
  more-product, crit E, CRIT_ST, elite mult, threat mult, unique mults.
- **Shipped containment strategies** (pick per mechanism, all evidenced): quantity-limit the
  multiplicative source (PoE 5 supports max, each PAID via mana multiplier 120–250%);
  demote to additive above a fixed baseline (D4: crit ×1.5 / vulnerable ×1.2 baseline
  multiplicative, everything further additive — stated reason: those affixes "made
  itemization too simple"); hard caps with negative baselines that keep the cap meaningful
  (PoE res 75%, phys DR 90%, leech 20% life/s, endgame starts at −60% res); concave-then-
  capped defence against exponential offence (Dead Cells: DPS 1.15^stats uncapped, HP
  quadratic capped at 12.375×/7.25×/22×); diminishing by construction (D3 armor/(armor+3500)
  never reaches 100%).
- **Shardfall's standing caps** (do not exceed with new content): more-pool softcap at 4×
  (`m>4 → 4+pow(m−4,0.6)`); ≤4 gems contribute more per routine; fusion tiers additive on
  the gem, not compounding; crit multiplier additive, soft cap 4.0× (D4's exact move); crit
  chance cap 95%; sres cap 0.85; armour removes at most 85% of a hit; leech capped (PoE's
  20%/s precedent, LEECH_CAP); attack-speed-style stats compressed at top tiers.
- **Every hit-rate change is a DoT/trigger change**: DoT bypasses armour (PoE: armour applies
  to hits only) so armour = hits, sres = ailments — keep the identity clean; proc coefficient
  on all new triggers; ailments off PRE-more damage.
- **HP scales faster than damage, always** (RoR2 +30%HP/+20%dmg per level = 1.5:1; Shardfall
  curves keep that ratio). Player-side damage sources (thorns, dodge-blast) must ride the HP
  curve or they silently die at depth — classify every new depth-scaled constant.
- **Defence budget**: total EHP multiplier from ALL defensive sources ≤ ~8–10× (matches the
  damage curve + headroom). I-frames are secretly the dominant swarm defence — value scales
  with attack density, ×1.35 (one enemy) to ×4.5 (swarm at 0.7s invuln) — so armour must NOT
  also be steeply hit-size-aware, and any new defensive layer multiplies INTO this stack.
- **Elite/threat multipliers were sized against the old curve** — when a base curve steepens
  ×K, rebase elite HP mults by ~√K, or convert elite HP into armour + mechanics (3000 HP +
  a shield phase is a fight; 6000 HP is a slog).

## VERIFICATION HOOKS (add assertions with every content drop — CLAUDE.md rule 9)
- Suite 8: sprite visual laws · 10: TTK/TTD per class/band · 11: roles, elite fairness,
  composition · 12: ilvl/tier gating, drop volume · 13: archetypes, dead gems, conditional
  parity, THE SOUP TEST · 14: air targets, templates, strand ownership · 15: Echo ladder.
- New system → new `test/suite-N.js`, copy suite-10/13's shape, register in `run.sh`.
