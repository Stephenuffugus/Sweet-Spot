# SHARDFALL — Creative Brief for the Full Build-Out

The owner's directive: take the game to the tier of Dead Cells / Noita / PoE / Diablo 2.
Exciting, challenging, infinite replay value. This brief is the single vision that keeps
parallel design work coherent. Where a ref-doc constraint and this brief conflict, THE REF DOC
WINS — the code and tests are the law; this is the direction.

## The fantasy (already latent in the game — make it explicit everywhere)

The sky fell. Generations ago the vault of heaven shattered and rained down as shards — the
same shards you spend at camp. The world is a wound, and the deeper you go the closer you get
to the thing that broke. Reality is woven on THE LATTICE: six independent strands, and at the
bottom, the master glyph that once held the sky up. Every run is a descent into the loom.

The five biome bosses are **Knots** — places where the Lattice snarled around something that
refused to die. The escape (already built: overwrite the master glyph) becomes the narrative
climax rather than a mechanic with no story.

**Voice:** terse, second person, geological dread. Match the existing sixteen fragments
(ref-story.md quotes them all — they are the style guide). No proper-noun soup, no epic
fantasy bombast. The world does not explain itself; it is overheard.

## Story structure (Hades model: camp is where story lives, death is a beat, not a failure)

- **Camp characters** (3, small, each is the face of an existing system, dialogue rides the
  existing panel machinery — no new UI paradigm): every one has a reason to be at the rim, a
  thing they want from the deep, and dialogue that advances on real progress (bosses felled,
  depths reached, endings seen). They speak in short exchanges, not walls of text.
- **Acts tied to bosses:** felling each Knot for the first time changes something at camp
  (a line, an offer, a fragment) — progress must be FELT at the surface.
- **Three endings at the master glyph**, chosen at the moment of escape:
  1. **ESCAPE** — overwrite the glyph and leave (the current ending, now with an epilogue).
  2. **MEND** — reweave the sky. Gated on having felled all five Knots. The "good" ending.
  3. **USURP** — become the new law. Gated on deep Echo progress. The dark ending, and the
     in-fiction frame for the Echo ladder (the world remade harder, again and again).
  Endings are epilogue screens + a permanent camp acknowledgment, not cutscenes.
- **Lore fragments 16 → 40+**, still depth/event-gated, still overheard-not-explained. They
  should now carry the actual history: what broke the sky, who wove the Lattice, what the
  Knots were, why the camp remains.

## Characters/classes: 4 → 6

Existing identities (do not overlap): Vanguard (block/armor), Marksman (pierce/crit/fragile),
Pyromancer (burn/abilities), Delver (dig/greed/fuel). The two new classes anchor archetypes
the validator can build TODAY from existing + new gems:

- **A storm class** — shock/chain/attack-speed identity (conduit, chainbolt, static field,
  tempo already exist; add what's missing).
- **A blood class** — bleed/leech/low-life-risk identity (serration, lifeleech, hunger,
  undertow already exist; add what's missing).

Each: starting kit, free signature gem, one passive worth building around, a `foc` identity
(where it earns Focus), a codex entry in the fragment voice, and a seat in the balance
harness like the other four.

## Scale targets (the epic tier, expressed as counts)

| dimension | now | target | notes |
|---|---|---|---|
| skill gems | 18 | 28–30 | fill archetype gaps: reach melee, thrown hybrid, minion, trap/mine, storm skill, blood skill, vertical slam. Every new skill must be the best answer for SOME build. |
| support gems | 29 | 38–42 | contract-changers ONLY — each answers "what can the skill do now that it couldn't?" No flat more-multipliers. |
| auras | 14 | 18–20 | at least two class-anchoring (storm, blood) |
| abilities | 16 | 20–22 | at least one defensive, one minion-ish, one mobility |
| gear bases | 12 | 16–18 | reach melee (spear), fast crit melee (dagger), heavy ranged?, hybrid armor. Depth-gated like the rest. |
| uniques | 24 | 40–48 | two per new base + alternates for the classes' identities. Build-defining rule-breakers, not stat sticks. Consider 2–3 RESONANCE PAIRS (two uniques that gain a bonus when both worn — D2 set feeling without a set system) only if mod() can see other equipped uniques cheaply. |
| affixes | 12 | 15–16 | ailment duration? chain count? proj speed? — whatever the new archetypes starve for |
| modifier affixes | 12 | 16–18 | |
| enemies | 26 | 36–40 | every biome gets a fuller bench; each new enemy fills a ROLE gap in its band (suite-11 taxonomy), has a law-compliant sprite with an unused top-shape in its biome, and routes through mkEnemy/mkAtk |
| elite modifiers | 8 | 10–12 | must pass eliteFor fairness |
| bosses | 5 | 6 + final | one more optional Knot OR deep variants; plus THE FINAL BOSS |
| room templates | 6 | 14–16 | per-biome identity; shape from terrain strand ONLY |
| lore fragments | 16 | 40+ | |
| bounties | 12 | 20–24 | |
| echo rules | 10 | 14–16 | new ones can reference new systems |
| boons | 21 | 26–28 | |
| attunements | 29 | 34–36 | |

## The final boss

At the master glyph: **the thing that has been repairing the Lattice around you the whole
game** — the source of The Weight, finally embodied. It should:
- be the hardest fight in the game and REQUIRE the three-beat literacy the game teaches;
- use accumulating phase patterns like the Knots but add at least two patterns nothing else
  uses;
- gate the endings: beating it opens the glyph choice (ESCAPE / MEND / USURP per gates above);
- route every summon through mkEnemy, every field through HAZ, every attack through mkAtk.

## Replayability doctrine

The Echo ladder is the spine — extend it, don't replace it. Bounties are the per-run hook —
extend the pool so no two runs share all three. New echo rules and bounties may reference new
content (storm/blood archetypes, new enemies, endings). Anything requiring a NEW system
(pacts, rites, daily seeds) is out of scope this wave — note it as a future hook instead.

## PLAYTEST ROUND ONE (2026-08-10, the owner, keyboard+mouse — the first play ever)

Verdict: "actually pretty fun for how basic it is." The findings, and what each becomes:

1. **Discovery is broken.** The owner asked for a dodge-roll with i-frames and a grappling
   hook — BOTH ALREADY EXIST (dodge on Shift with i-frames; Grapple as an ability gem). He
   also couldn't tell how much gear exists (12 bases, 24 uniques, 77 gems). The game does not
   teach or reveal itself. This becomes a new dimension: **ONBOARDING & DISCOVERY** —
   contextual first-time tips through pr() (first hit taken → dodge tip; first too-hard rock →
   dig tip; first camp visit → unlock-pool tour; first gem drop → socket tip), each shown
   once, tracked in META, dismissable, never modal mid-combat. Plus visibility: a "collection"
   view in the codex showing gear/gem discovery progress D2-style.
2. **Digging failed silently.** He could not figure out how to dig through stone. Stone needs
   dig power ≥ 1 (Axe etc.); the sword just bounces with no explanation. Fix: explicit
   feedback on a too-hard swing (spark + one-time pr() tip naming the tool), dig power visible
   on item cards, and the starter kit path to an Axe made obvious.
3. **Movement should be EARNED.** He likes the jetpack but wants movement to start basic and
   grow through play ("you have to play to unlock and level up to have better movement") —
   the Dead Cells rune model. This becomes a new dimension: **MOVEMENT PROGRESSION** — a
   permanent, meta-earned movement track (e.g. fuel tank tiers, air-dash, wall-kick, hover
   efficiency, grapple-as-permanent-tool at the top), earned by DEEDS (reach depths, fell
   Knots), not just bought. Baseline hover stays (he likes it) but starts modest. Soft-gate
   some optional world pockets on movement tiers the way vaults gate on dig. Design it so
   existing saves migrate sanely.
4. **Finesse.** "We need a little more skill with the gameplay." Dodge exists — make it FEEL
   like a roll (afterimages, i-frame flash, cancel windows), make its upgrades visible, and
   let the movement track deepen it. Combat finesse additions must reward timing, not stats.
5. **Crafting/upgrading.** "There may be some crafting or upgrading necessary." Becomes:
   **THE FORGE AT CAMP** — shard-fed item crafting riding the camp panel UI and the Smith
   character from the story dimension: upgrade an affix a tier, add a socket, reroll an affix,
   maybe corrupt (risk/reward). Table-driven costs, ilvl-respecting, no new currency.
6. **Graphics everywhere.** Actors have sprites; chests, shrines, pickups, gear-in-hand and
   terrain dressing are still flat rects. Becomes: **ART EXTENSION** — prop/pickup/terrain
   sprite pass through the same SPR pipeline and laws, plus gear reading in-hand on the player.
7. **Weight is okay, no-instructions is okay** — he flagged both as acceptable. Do not
   over-correct movement heaviness; do not add a tutorial wall. Contextual tips only.

## Hard laws (from CLAUDE.md — repeated because designers keep breaking them)

- All content is a table entry. An `if (id === 'x')` branch means the table lacks a field.
- Two pools: supports write `a.more`, never `a.dmg`.
- Conditionals pay in BOTH strike() and projStrike().
- Support creatures (and player minions) derive output from THEMSELVES, never their target.
- New enemies: mkEnemy/mkAtk only; sprites must pass the three laws; top-shape unique per biome.
- Rock is the terrain strand's. POI contents are the poi strand's. Never cross.
- Every id is unique across ALL tables (one namespace).
- Every new prompt goes through pr(); every new action through the input abstraction.
- Multi-device: every mechanic answers "thumb, stick, cursor?"
- Don't invent new meta-systems; deepen the ones that exist.
