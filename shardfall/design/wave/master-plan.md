# MASTER PLAN — the content wave, unified

Coherence ruling over the nine specs (classes-skills, gear-forge, enemies, final-boss, world,
story, movement, replay, combat-feel) against creative-brief.md, CURRENT-STATE.md @3c446e9,
and the live file. **Where this document and a spec disagree, this document wins.** Rulings
are final; "verify-at-implementation" items are listed in §7.

Verified against the live file this session: `addHaz(x,y,r,t,dmg,st,col,friendly,kind)` (9
args, index.html:3360); the ten live hint ids (`move fight dodge punish hover socket lattice
heat depth camp` — combat-feel's three tips are ALREADY live at 3167/3176/3193); `SAVE_VER=2`
(1928); `BIOME_BOSS` (1014); bounty ids `deep`/`deeper` (1543-4); Echo rung 6 = Brittle
(`php:0.86`, 1514).

---

## 1. UNIFIED CONTENT MANIFEST

One namespace = GEMS ∪ GEAR ∪ UNLOCKS (the live file already lets ATTUNE/BOUNTY/TREE ids
shadow gem ids — `siphon`, `momentum`, `punish`, `plate` — so those tables are separate
namespaces by precedent; the checks below honour that). Every id below was checked against
every live table in CURRENT-STATE.md AND every sibling spec. Collisions found: **7 mechanical
+ 4 editorial**, all resolved in §1.11 and §2.

### 1.1 CLASSES (+2 → 6)
- `conductor` — storm: wand kit, foc:'shock', fx shockBonus .4 (spec-classes §1)
- `bloodletter` — blood: sword kit, foc:'ailment', fx bloodRise .25 (spec-classes §1)

### 1.2 GEMS (+31 → 108; all 31 also enter UNLOCKS, 3,295◆)
Skills (11): `impale` reach-melee · `dragline` pull (negative kb) · `whipsaw` thrown-return ·
`cairn` minion (kills raise turrets) · `mine` trap · `stormlash` storm ranged ·
`bloodlet` blood melee (hpCost+leech+bleed .5) · `deadweight` fall-scaled slam ·
`longshot` distance-scaled sniper · `flurry` ailment saturator · `arcblade` first b-melee.
Supports (10): `sterile` +35% more, noSt lockout · `firstblow` +70% vs unhurt ·
`bloodtithe` +45% more, hpCost 2 · `overdraw` +50% more, chan 8 · `seeker` homing ·
`stormcall` 3-kills thunderbolt · `longhaft` reach trade · `ricochet` bounce ·
`vantage` +40% airborne · `rasp` sunder 2 on hit.
Auras (5): `galvanic` shock dur/chain · `surfeit` overleech→shield · `foreman` construct
buffs · `slipstream` dodge reloads weapons · `plumbline` hard landings explode.
Abilities (5): `bastion` 3s armor · `effigy` thorned decoy · `lodestone` plant/snap-back ·
`tempest` standing shock HAZ · `transfuse` drink the room's bleeds.

### 1.3 GEAR (+5 → 17; each enters UNLOCKS, 325◆)
`dagger` (cd .22, gg, ilvl 150) · `spear` (range 44, rg, 300) · `brig` (armor rg, 600) ·
`staff` (first 3-socket weapon, bbg, 1500) · `shroud` (rgb flex armor, 1600).

### 1.4 UNIQUES (+18 → 42; display names, ride base ids; 2 RENAMES ruled §2.R2)
Primaries: dagger **Fever** · spear **Fathom** (RENAMED from "Plumbline" — collides with the
`plumbline` aura) · staff **Stormspine** · brig **Butcher's Apron** · shroud **The Quiet**.
UNIQ2: dagger **Quill** · spear **Patience** · staff **Lodestar** · brig **Restless** ·
shroud **Tithe**.
UNIQ3 (new table, 8): sword **Mercy** · wand **Fulgurite** · bow **Dowser** · crossbow
**Thunderhead** · chain **Lifelode** · robe **Static** · vest **Bellows** · harness
**Tailwind** (RENAMED from "Slipstream" — collides with the `slipstream` aura).
Resonance pairs (3): Fever+Lifelode, Fulgurite+Static, Patience+The Quiet — weapon-side
`wornUniq()` bonus only.

### 1.5 AFFIXES (+4 → 16) and MODAFF (+5 → 17)
Affixes: `ailment` `aildur` `reach` `area`. Modaffs: `achill` `abounce` `alunge` `agore`
`astun`. `agore`/Fever share the new conditional field `vsBleed` (owner: gear, §2.R1).

### 1.6 ENEMIES (+12 roster → 38, +2 bosses → 40) and ELITES (+3 → 11)
caves: `blackdamp` · fungal: **`felter`** (RENAMED from "mender", §2.R3), `hypha` ·
ruins: `drudge` `lurcher` `pavise` · forge: `cinder` `clinker` ·
abyss: `seep` `voidmote` `cleft` `gazer`.
Bosses: `weft` (THE FINAL BOSS, at the master glyph) · `witness` (optional Echo-III+ sixth
knot — cut line if the wave runs long).
Elites: `quaking` (tremor) · `searing` (sear) · `tithing` (tithe, loot 2.2).
Boss patterns: `press` `seal` (+ PAT_NAME rows). Ramp: `seam` (weft). Enemy fields: `end`
(weft), `frag` (five knot bosses), `split:{into,n}` (replaces `split:2`), `heal` (felter),
`swind` front-shield refinement (pavise).

### 1.7 WORLD
Room templates (+9 → 15, banded `{b,g}` format): ruins gatehouse/archive/tenement · fungal
gall/throat · forge slag-run/firebox · abyss last-stair/door. Vent kinds: `grit` (caves)
`volt` (ruins). BSHAPE fields: `ventP`, `under` (caves), `flue` (fungal+abyss), `trav`
(forge), `fungal.dark:0.85`, `abyss.heat:12`. Pockets: UNDERCUT / FLUE / TRAVERSE (terrain
strand, hash primes 23/41/43; **flue heights re-ruled §2.R7**). Secret language: tile-10 teal
glints + `upSecrets()`/`SECRETT`. Master-glyph arena: `MG` at (CAMP_X, ty 3170), boss strand.

### 1.8 STORY / META-STRUCTURE
LORE.frag (+28 → 44): buried `g1`–`g18` + `f14`; event `knot1`–`knot5` `rites` `annealed`
`mended` `usurped` (ESCAPE reuses shipped `escape`). CAST: `anvil` `carto` `verse`. DIALOG:
`anvil1-14` `carto1-14` `verse1-13` (41 nodes). Tables: `CAMP_LINES` `ECHO_FRAME` `TAGLINES`.
Endings: `doEnding('escape'|'mend'|'usurp')`, `openEnding`, `openGlyphSeat`, `wakeWeft`,
`glyphFelled`, run flag `MGS`. Forge: `FORGE_OPS` (`fup` `frr` `fsock` `frisk`), helpers
`affTierCap` `forgeItem` `wornUniq` `uniqueDef`, panel fns `openForge*`/`doForgeOp`, item
fields `it.cut` `it.owk`.

### 1.9 MOVEMENT / ONBOARDING
MOVES (6, own table, never in UNLOCKS): `draught` `airdash` `wallkick` `glide` `longarm`
`seamstep`. Edge action: `grap` (8-place checklist; DOM `bGrap`; pad button 3). SFX: `thunk`
`dash`. Baseline tank 60→**45** (draught +20 → 65). Dodge feel: afterimage ghosts, cyan
i-frame tint, perfect dodge (`P.pd`, +8 focus), roll-cancel clamp **0.22** (re-ruled §2.R8),
dodge-jump cancel. Dig feedback: `CARVE_BLOCK`/`CARVE_BED`/**`CARVE_VAULT`** (§2.R6) +
`digOf()` on cards. Collection view: `seen.gem`/`seen.uni` buckets, `openCollection`/`collList`.

### 1.10 REPLAY
BOUNTIES (+12 → 24): `carver` `plunge` `ghost` `sparks` `letting` `crew` `fuser` `tempered`
`outrun` `clean` `echoed` `loom` (+ `ok` draw-predicate field; doEnding banks bountyPayout).
ECHOES (+5 rungs 11–15, APPEND ONLY): Crowned(`elite`1.5) Seeping(`vent`1.6) Charged(`spark`)
Thin(`pfuel`.85) Braced(`rec`.9). BOONS (+6 → 27): `redheart` `skyborne` `cohort` `stormfed`
`gale` `redprice`. ATTUNE (+7 → 36): `jolt` `gash` `buoy` `slick` `wake` `shift` `span`.
bTick kinds: `dig` `fall` `ghost` `shock` `bleed` `raise` `forge` `fuse`. BSTATE flags:
`weighted` `bossclean` `weftdown`.

### 1.11 Cross-cutting registries (one owner each)
- **Attack fields** (suite-13 FIELDS): `slam aloft vsFull farshot raise stormcall noSt hpCost
  mine` (owner: classes §0) + `vsBleed` (owner: gear §4). CONDS rows: slam, aloft, vsFull,
  vsBleed. upSentry copy-list additions: `vsFull`, `vsBleed` ONLY (never raise/stormcall).
- **RUNM keys** (suite-13 KNOWN): `vsBleed aloft hpCost construct stormEcho dodgeRush crewcap`
  (owner: replay — writers + KNOWN; the underlying fields stay with their owners above).
- **RUNB0**: `reach:0` (consumer: gear's `inc('reach')` fold; writer: `span`).
- **classFx**: `shockBonus` `bloodRise`. **foc value**: `'shock'`.
- **META v3** (ONE bump, §2.R4): `endings{}` `forge{n,owk}` `dlg{}` `firsts{}` `tips{}`
  (migrated from `hints`) `moves{}` `seen.gem{}` `seen.uni{}`.
- **TIPS ids** (merged catalogue, §2.R5): `move fight dodge punish hover socket lattice heat
  depth camp` (the ten live, migrated) + `dig vaultdig cold tour collect shrine hidden wayout`.
  **`movetier` is CUT** — the gait celebration toast already teaches it.
- **Run-scoped state** (reset in `newRun` where flagged): `MGS`* `P.stormN`* `P.lode`*
  `P.grapCd` `P.airDash` `P.pd` `P.lastDodge` `P.thunkT` `SECRETT` `TIP/TIPQ`
  `BSTATE.weighted/.bossclean/.weftdown` (BSTATE wipe covers). Const: `MELEE_STEP=8`.

Scale check vs the brief's targets — every dimension lands inside its band: skills 29,
supports 39, auras 19, abils 21, bases 17, uniques 42, affixes 16, modaffs 17, enemies 38+2,
elites 11, bosses 5+1+final, rooms 15, frags 44, bounties 24, echoes 15, boons 27, attunes 36.
Unlock pool 6,735 → 10,355◆.

---

## 2. CONTRADICTIONS AND RULINGS

**R1 — the seven mechanically-detected duplicate ids.** Ruling per id:
- `aloft`, `hpCost` — attack fields minted by spec-classes §0 (four-place wiring is theirs);
  spec-replay's identically-named RUNM keys are the house transfer pattern
  (`RUNM.x → a.x` in applyRunMods), NOT collisions. One owner: classes. Replay lands writers
  + KNOWN entries only. No rename.
- `vsBleed` — same pattern; owner is spec-gear-forge §4 (condMul clause + ride-along +
  upSentry copy + suite-13 rows land ONCE, char-identical). Classes did not mint it; replay's
  `redheart` consumes it. No rename.
- `raise` — attack field (classes/cairn) vs bTick kind (replay/crew). Disjoint namespaces
  with live precedent (`burn` is both a bounty count-kind and a status). No rename; the crew
  bounty's `bTick('raise')` sits INSIDE cairn's SENTRY-cap check plus the sentry/effigy
  branches.
- `shock` — foc value (classes) vs bTick kind (replay) vs status vs HAZ kind (both live).
  Four disjoint key-spaces, live precedent (`foc:'dig'` vs the `dig` field). No rename.
- `reach` — NOT a collision: one inc() key, deliberately shared. Gear owns the consumer
  (`a.range*=1+inc('reach')` in computeAttack); writers are the affix row and the `span`
  attunement. Replay's `RUNB0.reach:0` must land with-or-after gear's fold.
- `dig` — three legitimate uses (attack field + foc, live; bTick kind, replay — `burn`
  precedent holds) and ONE real duplicate: story's hint id `dig` vs movement's tip id `dig`
  are the same tip specified twice with different copy and triggers. Ruling: **one TIPS row
  `dig`**, trigger = movement's `nodig` hook (the blocked-carve report — it fires at the
  exact moment of silent failure), copy = story's line ("That stone is past this tool. Dig
  power opens it — it is printed on every gear card."). Movement owns machinery; story owns
  copy — which is what both specs already declared.

**R2 — unique names vs aura ids (found beyond the mechanical list).** Spear primary
"Plumbline" vs aura `plumbline`, and harness UNIQ3 "Slipstream" vs aura `slipstream` — two
player-facing things sharing one name is a coherence bug even when the id namespace is clean.
The display string loses: spear unique → **Fathom** (guild rope-measure diction; anvil11
already speaks in fathoms), harness UNIQ3 → **Tailwind**. Flag but accept: Lodestar (staff
UNIQ2) vs `lodestone` (ability) — distinct words; `seam` ramp vs the Seam strand display name
(final-boss flagged it deliberately).

**R3 — "mender" is used for three different things.** Spec-enemies mints fungal enemy
`mender`; spec-story's corpus uses "menders" for the choir (g9, g12 — and the Chanter
character IS one); verse12 calls the Weft "the mender"; and spec-final-boss explicitly
rejected `mender` for near-missing the live `mend` gem. The fungal nurse loses the word:
**`mender` → `felter`** (n:'Felter' — "a drift of cap and thread"; the blurb survives with
one word swapped). Update: ENEMIES row, BIOMES fungal roster, SPR key, LORE.enemy key,
spec-enemies §7 cost note, suite-11 healer-test naming. The choir keeps "mender" exclusively;
the story's g9/g12/verse resonance now lands clean.

**R4 — SAVE_VER: four specs bump 2→3; ONE merged migrate ships.** Gear (`forge`), final-boss
(`endings`), story (`dlg`,`firsts`), movement (`tips`,`moves`,`seen.gem`,`seen.uni`). The
single v3 block (lands in wave 0, before any feature):

```js
 if(m.ver<3){
  m.endings=m.endings||{};
  m.forge=m.forge||{n:0,owk:0};
  m.dlg=m.dlg||{}; m.firsts=m.firsts||{};
  m.tips=Object.assign({},m.hints||{});          // shown-once history survives; hints retired
  m.moves={};
  m.seen=m.seen||{}; m.seen.gem={}; m.seen.uni={};
  for(const k in (m.seen.item||{}))if(k.indexOf('#')>0)m.seen.uni[k]=1;   // alt uniques recoverable
  for(const g of DEFAULT_GEM_POOL)m.seen.gem[g]=1;
  for(const k in (m.unlocks||{}))if(GEMS[k])m.seen.gem[k]=1;
  m.ver=3}
```

plus `loadMeta()` belt-and-braces for every field above, the seen-bucket list += `'gem','uni'`,
and `checkMoves(1)` at the loadMeta tail once MOVES exists (wave 2; the call is added then).
`hint(id,text)` becomes the one-line shim writing `META.tips` in the SAME commit (no
hints/tips divergence window). pwa.js: ver literals → 3; v1-blob asserts ALL eight fields;
movement's v2-blob retro-grant block added in wave 2. **No spec may add a v4 this wave.**

**R5 — hints vs tips: one system.** Movement's TIPS table + queue + boss-deferral +
dismissal is the substrate; the ten live `hint()` call sites convert to `tipEv` hooks per
movement §3.3; story owns all copy (movement's drafts yield to story's §7 wording where both
exist: `dig`, `camp`, `socket`). Additions to movement's table: `vaultdig` (ev:'nodig',
`when:c=>c.vault>0`, ordered BEFORE `dig`), `shrine` (first takeBoon), `cold`
(ev:'dry', `when:c=>c.bn==='abyss'` — world's abyss line) with `heat` gaining
`when:c=>c.bn==='forge'`; the `dry` hook passes `{bn}`. World's `hidden` and final-boss's
`wayout` ride the `hint()` shim (immediate, non-queued — both fire out of combat; accepted).
Combat-feel §3.4 needs NO new calls — its three tips are already live; they migrate with the
rest. Story's suite fixtures assert `META.tips.*`, never `META.hints`.

**R6 — the vault-seal tip needs a third counter.** Story's `vaultdig` requires
distinguishing the vault-seal tile in the blocked-carve report. Movement's carve() edit gains
`CARVE_VAULT` beside CARVE_BLOCK/CARVE_BED (the skip branch tests the vault-seal tile id);
`doMelee`'s thunk site passes `{blocked:CARVE_BLOCK,vault:CARVE_VAULT}` to `tipEv('nodig',…)`.

**R7 — the flue is unclimbable at the new baseline tank.** World calibrated pockets against
a ~2.4s hover (≈100 fuel); the live tank is 60 and movement cuts the base to 45 (draught →
65). A 19–23-tile bore exceeds even a 65-tank climb (~18 tiles). Ruling: **fungal flue
h = 12+rS(0,3) (12–15 tiles); abyss flue keeps 16+rS(0,4)** (deep players hold draught+glide
+ fuel affixes; the abyss flue is SUPPOSED to want the track). The never-stranded argument
(hard≤2 walls, ground regen 58/s) is untouched. World's §4 calibration paragraph is corrected
to the real numbers (45/65 base, 1.07–1.55s).

**R8 — slipstream aura vs the universal roll-cancel.** Movement's §2.4a clamp
(`mcd/rcd ≤ 0.12` on every dodge) reduces the `slipstream` aura ("dodging reloads both
weapons") to a 0.12s refund. Ruling: the universal clamp is **0.22** (one roll-length — still
a real cancel window for heavy recovery); slipstream's full zero stays meaningfully better.
Suite-17's clamp assertion tests 0.22.

**R9 — endings flow: one owner, five contributors.** Final-boss owns
`wakeWeft/glyphFelled/openEnding/doEnding` (+ `doEscape` alias). Merged `doEnding` duty list,
in order: gate checks (MGS, mend, usurp) → **bounty bank** (replay §1.1) → ending purse +
`escapes`/`maxEcho`/`maxThreat` writes → `META.endings[kind]=1` → fragment grant → **`checkMoves()`**
(movement — seamstep's deed) → `saveMeta()` → epilogue panel (+ "Bounties honored" row).
The MEND gate uses story's hoisted helper — `const KNOTS=Object.values(BIOME_BOSS);
const allKnots=m=>KNOTS.every(b=>(m.bosses||{})[b])` — ONE source of truth for "the five";
final-boss's inline `Object.values(BIOME_BOSS).every(...)` and story's hand-list are both
replaced by it. USURP gate `(META.echoLv|0)>=6` is consistent everywhere it appears
(openEnding, carto10) and appending rungs 11–15 does not renumber rung 6 (Brittle) —
verified live. Camp acknowledgment: final-boss's §5.7 inline ternary is DROPPED; story's
`CAMP_LINES`/`campLine()` is the one mechanism. Epilogue texts land ONCE (final-boss §8.2 is
the master copy; story ratifies verbatim). Movement's `checkMoves` doEscape hook moves into
doEnding.

**R10 — hurtPlayer's i-frame early-out is edited by two specs.** Movement's perfect dodge
and replay's `ghost` bTick merge into one block:

```js
 if(P.inv>0||P.dead){
  if(P.dodgeT>0&&!P.dead&&dmg>0){bTick('ghost');
   if(!P.pd){P.pd=1;gainFocus(8);burst(P.x,P.y,'#9fd0ff',8);sfx('block',P.x);hitStop(0.05,0.35,0.012)}}
  return}
```

(`P.pd=0` set in `dodge()`; post-hit inv never ticks either feature — both key on `dodgeT`.)

**R11 — story's Smith vs gear's Forge.** Story's act-beat gates are ACCEPTED as canon:
(a) the Forge camp row appears at `bosses>=1` (gear already agrees); (b) **OVERWORK's op row
is disabled until `META.bosses.forgelord`** (one condition in `openForgeItem`; anvil7→anvil8
sequencing depends on it); (c) `doForgeOp('frisk')` grants the `annealed` fragment (one line
in gear's function). Replay's suite fixture for `tempered`/OVERWORK sets
`META.bosses.forgelord=1`.

**R12 — collection view must be UNIQ3-aware.** Movement's `seen.uni` keying and totals
assumed two alts. Ruling: discovery key is `base+'#'+((it.alt||0)+1)` everywhere (gear's
seen.item keying already agrees); uniques total = `|UNIQUES|+|UNIQ2|+|UNIQ3|` computed live;
`collList('uni')` iterates each base's actual alt count; codexTitle parses `#N`. Additionally
`uniqueDef` ships EARLY (wave 2, two-table form: `alt&&UNIQ2[id]?UNIQ2[id]:UNIQUES[id]`) so
movement's `digOf()` compiles; gear's wave replaces it with the three-way version.

**R13 — elite HAZ calls drop the `friendly` argument (real bug).** Spec-enemies' quaking and
searing consumption sites pass 8 args — the kind string lands in `friendly` and the hazard
becomes truthy-friendly, i.e. harmless to the player. Corrected calls:
`addHaz(e.x,e.y+e.h/2,T.r,T.t,e.dmg*T.dmg,null,'#c98a4a',0,'shock')` and
`addHaz(p.x,p.y,p.sear.r,p.sear.t,p.searDmg,null,'#ff9a5a',0,'fire')`. Suite-11's elite
blocks assert the hazards DAMAGE the player (which would have caught this).

**R14 — suite numbering collision.** Combat-feel owns **suite-16** (THE DANCE). Movement owns
**suite-17**. Story's suite renumbers to **suite-18** (THE CAMP). Classes' new blocks (abil
branches, auras, mine, hpCost, foc:'shock') become **suite-19** (STORM & BLOOD). Gear's new
tests fold into suite-12 ("the forge", base gating) and suite-7 ("uniq3 + resonance", affix
consumers) — no new suite. `run.sh` SUITES += 16 17 18 19 (one edit, wave-by-wave).

**R15 — Seeping × ventP share one expression.** The vent gate becomes
`< Math.min(0.9,(SH.ventP||0.42)*(ECHO.vent||1))` — world lands the `ventP` half first;
replay's wave upgrades the same line. Neither spec lands its own variant independently.

**R16 — impale outranges grunts post-combat-feel.** Combat-feel raises sword 26→34; impale
(range ×2.1) now reaches 71px — past most grunt engage distances. Accepted: the spacing law
(suite-16 §A) governs BASES; skills buy reach with arc 32 + cd ×1.3 (longhaft/Fathom
precedent). Watch in shots.js; fallback is ×2.1→×1.8. Same logic covers spear 44 (envelope
59 < fungal's min-of-max 62 — passes the law by 3px; suite-16 §A2 is the tripwire as rosters
grow).

**R17 — no-drift clauses.** (a) suite-10 class-list/build() edits exist in spec-classes AND
spec-replay §5.2 — land ONCE (classes' version). (b) `mended`/`usurped` fragment texts exist
in final-boss AND story — land ONCE (final-boss's). (c) LORE.class conductor/bloodletter —
land ONCE (classes'). (d) combat-feel's three tips — already live; nobody re-lands them.

---

## 3. POWER-BUDGET AUDIT (vs INC_SOFT 3.0, CRIT_SOFT 4.0, more-pool shape)

**More-pool shape** — all 10 new supports write `a.more` never `a.dmg` ✓; all 11 skills own
`a.dmg` ✓; suite-13's pure-multiplier budget stays at 4/4 (every new support writes a
non-more field, so the probe classes all ten as contract-changers) ✓. Largest new
more-stack: sterile 1.35 × bloodtithe 1.45 × overdraw 1.5 = **2.94×** carrying three real
drawbacks (no statuses, hp drain, focus-vs-ability competition) — under the live ceiling
(conc × overload × heavyimpact = 4.04× melee). Largest new single: overdraw 1.5 — classes'
own guard stands: trim to 1.4 if suite-13 spread exceeds 4.5×.

**Conditional stacking (the vertical build is the hot spot):** deadweight slam at terminal
fall = ×2.65, × vantage 1.4 × skyborne 1.25 ≈ ×4.6 while falling — gated on the single most
commitment-heavy state in the game and paid for in CONDS parity + effDps credits (slam .25,
aloft .35). The `Skyfall` ARCH row is the canary; first trim is slam's 1.1 coefficient.
vsFull 1.7 on alpha shots (mine 2.2×dmg × firstblow ≈ one-shot openers) is Ambush-shaped by
design; effDps credits it at ×0.15 so the harness can't be gamed by it.

**Crit:** Quill (+20% chance, +0.6 mult) + precision + keen/c4 + crit affixes pushes chance
~55–65% and mult toward ~4.4 — CRIT_SOFT 4.0 engages exactly as designed; no new entry
bypasses the soft cap's fold. No action.

**INC pool:** the four new affix keys are NEW AXES (ailment/aildur/reach/area), not dmg-inc
stack — INC_SOFT pressure unchanged. Ailment column: ailmentMul can now reach ≈2.5–3×
(venom+s5+Venom+T5 ailment affix) on a 0.5 bleed ratio (stR takes max, not sum ✓) under
STACK_MAX 3 — flurry saturation is the intended payoff; suite-13's soup test is the guard.
Armor shred: rasp 2 + Whetstone 3 + sunderer 3 = 8/hit — floors at 0; classes' ruling stands
(shred IS the designed Threat-II counter).

**Boons/attunes:** redprice (fx dmg .40 = inc pool, Ruin precedent ✓ + hpCost 2 with the
lethal-refusal gate ✓); stormfed's kill-gated acd refund matches `echo`'s uncapped shape at
1.5s behind a build gate — the 1-per-0.5s cap is pre-agreed if abuse shows. gale/buoy add
fuel to the inc pool (`fuel` key exists in RUNB0) ✓. wake (+30% for 1.5s post-dodge) is a
window, not a state ✓.

**Aura power:** surfeit's overshield capped 0.3×maxhp ✓; plumbline rides depthDmg (thorns
precedent) and is featherfall-exclusive ✓; foreman multiplies constructs that already derive
output from the player ✓ (support-output law holds through cairn/upSentry).

---

## 4. PER-BIOME AUDIT

Role coverage after the twelve (suite-11's six roles): every band now covers ≥5 roles; the
two full bands (ruins, forge) took recombinations, not an 11th role ✓.

| band | roster (old+new) | new roles | toughest (raw / bulk) | deadliest | verdict |
|---|---|---|---|---|---|
| caves | 6+1=7 | +denial (blackdamp) | rockling 70 / 105 — UNCHANGED | burrower 20 — UNCHANGED | ✓ |
| fungal | 6+2=8 | +support (felter), +terrain/denial (hypha) | bloomback 120 / 165 — UNCHANGED | stalker 19 (hypha 16) — UNCHANGED | ✓ |
| ruins | 7+3=10 | +swarm (drudge, lurcher), blocker-sniper (pavise) | brute 85 raw; shieldman 175 bulk (pavise 165 stays under) — UNCHANGED | brute/burrower 20 (lurcher 16) — UNCHANGED | ✓ |
| forge | 6+2=8 | +swarm/anti-air (cinder), blocker-exploder (clinker) | smith 150 / 356 (clinker 234) — UNCHANGED | smith 24 (clinker 18) — UNCHANGED | ✓ |
| abyss | 5+4=9 | +swarm (voidmote), denial (seep), splitter (cleft), sniper-flyer (gazer) | hollowed 140 / 262 (cleft 130) — UNCHANGED | hollowed 24 (cleft 20) — UNCHANGED | ✓ |

**TTK band re-aiming: NONE required** — every band's toughest and deadliest species is
preserved on both raw-hp and bulk (hp×(1+arm/8)) measures, so suite-10's live-derived bands
hold by construction for all six classes. Single-hit spikes: gazer's 26-dmg shot ≈0.30× a
band-reference pool (under the 0.40–0.45 law, bought with a 0.65s tell) ✓; **blackdamp's
`burstOnDeath:40` at caves depth is the one unaudited spike — verify against the clamp at
implementation** (§7). Suite-11 invariants (bulk ≥3× min, ≥1 shooter, ≥3 roles, support in
≥2 bands, split-chain ≤4 hops acyclic) all strictly improve ✓.

**Top-shape uniqueness** — spec-enemies §3's top-row strings were collision-checked per-biome
against every live inventory AND each other (incl. the two shared-width pairs:
lurcher/burrower 15w and gazer/wraith/voidspawn 14w — row differences stated) ✓. The felter
rename changes no pixels. Bosses (weft, witness) are roster-free and Law-2/3 exempt; `seam`
passes Law 1 (step-0 .4643 ≤ cap) ✓. Elites: quaking/searing/tithing pass the
delay-before-lethality law; the two new eliteFor bars (sear needs shoot; tremor excludes
trail species) join the 300-roll fairness sweep ✓.

**Encounter economics:** cleft `cost:8` + voidspawn override `cost:4` accepted (splitter-soup
guard); felter's heal-field surcharge is automatic; density unchanged (budgets fixed, variety
rises via repeat damping). Ruins at 10 species dilutes chanter/warder frequency — accepted,
flagged for the next balance pass (their own words, ratified).

---

## 5. THE BUILD ORDER — ten waves, each ends green

Run `./test/run.sh` (all) + `node test/pwa.js` after EVERY wave; `node test/browser.js` and
`node test/shots.js` where noted; `./design/audit.sh` after any table wave.

- **W0 — THE SAVE SPINE** (tiny, unblocks everything). SAVE_VER 2→3 + the R4 merged migrate
  + loadMeta belt-and-braces + the `hint()` shim (hints→tips in one commit) + pwa.js edits
  (ver literals, v1-blob field asserts). No features. Green: full run + pwa.
- **W1 — COMBAT FEEL** (spec-combat-feel entire; suite-16 NEW, run.sh += 16). No deps beyond
  W0 (its tips are the live ids, now in META.tips). Green: full + browser + shots (dance scene).
- **W2 — MOVEMENT & ONBOARDING** (spec-movement per R5/R6/R8/R10/R12; suite-17 NEW, run.sh
  += 17; suite-16 edits per movement §7.4; pwa.js v2-blob retro-grant block; `checkMoves(1)`
  added to loadMeta tail; early two-table `uniqueDef`). Deps: W0, W1 (suite-16 exists to
  edit). Green: full + pwa + browser (bGrap, COLLECTION).
- **W3 — WORLD DEPTH** (spec-world with R7 flue heights; suite-9 vent whitelist, suite-14
  edits, suite-4 secrets block asserting META.tips). Deps: W2 (tipEv/`dry` ctx, shim). Vent
  gate lands as `<(SH.ventP||0.42)` (R15's first half). Green: full + shots (glints/glow).
- **W4 — STORM & BLOOD** (spec-classes entire: fields §0, classes, 11+10+5+5 gems, UNLOCKS;
  suite-10 seats, suite-13 FIELDS/CONDS/effDps/ARCH×4; suite-19 NEW, run.sh += 19). Deps: W1
  (melee base ranges under the new skills — R16 noted). Green: full (suites 7/10/13 load-
  bearing) + browser (codex class pages).
- **W5 — GEAR & FORGE** (spec-gear-forge with R2 renames + R11 gates + R12 three-way
  uniqueDef; suite-13 vsBleed rows, suite-12 forge/gating blocks, suite-7 uniq3/resonance/
  affix-consumer blocks). Deps: W0 (META.forge live), W4 (suite-13 FIELDS list exists to
  extend; ARCH rows reference plumbline/surfeit auras). Green: full + audit.sh.
- **W6 — THE ROSTER** (spec-enemies with R3 felter + R13 addHaz fix; suite-11's 8 edits;
  split field-ification). No deps past W0. Green: full + shots (12 silhouettes).
- **W7 — THE WEFT & THE ENDINGS** (spec-final-boss per R9; MG arena, press/seal, wake/kill/
  ending flow, doEnding with checkMoves hook; witness OPTIONAL — first cut; suite-9 §6 edit
  + truth table, suite-10 impl+weft block, suite-11 press/seal blocks, suite-14 arena block;
  pwa endings assert). Deps: W2 (checkMoves), W6 (summon bench — soft), W0. Green: full +
  shots (arena).
- **W8 — THE CAMP & THE CORPUS** (spec-story per R5 copy pass + R11: 25 fragments, CAST/
  DIALOG/CAMP_LINES, knot `frag` grants, rites/annealed grants, OVERWORK gate, tips copy;
  suite-18 NEW, run.sh += 18; browser camp asserts). Deps: W5 (forge hooks), W7 (endings
  fields live; gates were defensive but the maxed-fixture reachability test wants the real
  flow). Green: full + browser.
- **W9 — THE LONG TAIL** (spec-replay: bounties + `ok` + doEnding payout, rungs 11–15 +
  consumers (R15 second half on the W3 line), boons/attunes + RUNM wiring, ECHO_FRAME/
  TAGLINES/Weight-line/death-row; suite-15 edits **including the mandatory echoLv 24→36
  re-pin in the same commit as the rungs**, suite-13 KNOWN/ARCH×2/raise-credit, suite-8
  RUNB0.reach + behavior blocks). Deps: W4 (aloft/hpCost/cairn), W5 (vsBleed/reach), W3
  (ventP line), W7 (loom/weftdown/doEnding), W2 (P.lastDodge in dodge()). Green: full.
- **W10 — CLOSE-OUT.** `./design/audit.sh` regenerate (counts per §1), full test sweep,
  shots.js feel pass, changelog line for the air-dodge gating (movement's flagged veteran
  change). Playtest round two.

Dependency spine in one line: W0 → W1 → W2 → {W3, W4, W6} → W5 → W7 → W8 → W9 → W10.

---

## 6. CONSOLIDATED TEST-EDIT LIST (deduped; owner wave in brackets)

**run.sh**: SUITES += 16 [W1], 17 [W2], 18 [W8], 19 [W4].
**pwa.js**: ver literals 2→3; v1-blob asserts ver 3 + endings/forge/dlg/firsts/tips/moves/
seen.gem/seen.uni [W0]; v2-blob gait-retro block [W2]; endings-fragment assert [W7].
**suite-4**: upSecrets/tile-10 block (PART fires, `META.tips.hidden`) [W3].
**suite-7**: "uniq3 + resonance" block (uniqueDef triple, Fever+Lifelode cache coherence,
Fulgurite+Static); affix-consumer block (reach moves melee only, area scales explode,
aildur enemy-only) [W5].
**suite-8**: no source edits for enemies/frags (dynamic — rows land WITH sprites+lore each
wave); RUNB0 `reach` key auto-assert [W9]; wake/stormfed/shift+construct behavior blocks
[W9]; seam ramp auto [W7].
**suite-9**: line 281 spawn whitelist += `'vent'` [W3]; §6 `MGS=2` before doEscape + reset;
wake/ending truth-table block (mend needs all five BIOME_BOSS; usurp 5-refuses/6-fires;
fragments; per-kind META.endings) [W7].
**suite-10**: line ~290 impl += `'press','seal'`; "the weft" hits-band (90≤H≤320, tune hp
only) + press-clamp assert [W7]; line 247 class list += conductor,bloodletter; build() br/
wslot maps [W4 — land ONCE per R17a].
**suite-11**: integrity soak += the 12 ids; felter heal block; hypha burrow+trail block
(and seep trail); split `{into,n}` + cleft cascade + chain-terminates law; elites ≥11 + two
eliteFor negatives + tremor/sear/tithe behaviors (hazards HURT the player — R13 tripwire);
pavise swind front-law; pack generalization + lurcher arrival [W6]; press/seal blocks (mark
dmg 0, lands at lock, corpse-safe, seal never entombs, 60s ≤ HAZ_MAX) [W7]; witness gated-
arena assert IF it ships [W7].
**suite-12**: "the forge" block (tier cap, RECAST invariants, CUT once, OVERWORK once+closes,
refusals, exact charges, vault round-trip, affTierFor≤Cap); base-gating pool extension
(dagger@200, all five @2800) [W5].
**suite-13**: FIELDS += slam aloft vsFull farshot raise stormcall noSt hpCost mine [W4] +
vsBleed [W5]; CONDS += slam/aloft/vsFull [W4] + vsBleed [W5]; effDps credits vsFull .15 /
slam .25 / aloft .35 / farshot .5 [W4] + vsBleed full-if-self-applied [W5] + raise ×1.2
[W9]; ARCH += Storm Conduit / Blood Price / Minelayer / Skyfall [W4] + Turret Crew / Tempo
Dancer [W9]; KNOWN += vsBleed aloft hpCost construct stormEcho dodgeRush crewcap [W9].
**suite-14**: ROOMS ≥14, `{b,g}` shape+band-validity loop, per-band pool/gate sweeps, caves
`rooms===undefined` kept; vent-declared pair rewrite (four bands declare / surface+abyss do
not); grit/volt emission asserts (volt shock 1.3 flat at two depths); ventP knob assert +
gate-count sweep; abyss heat hover deltas + `abyss.heat<forge.heat` + `fungal.dark<1<
abyss.dark`; `-- pockets --` block (flags, sweep finds ≥1, chest present, positional
solidity under strand rerolls, no bedrock) [W3]; "the master arena" block (interior air,
slab bedrock, ring tile 7, reroll-stability, no POI/voidmaw records) [W7].
**suite-15**: pool-integrity (`ok` filter, ≥20), bTick amount, ghost roll-only, weighted,
bossclean, shock/bleed kills, fuse, dig; ending-payout assert; ECHOES.length 15 + per-rung
behavior asserts; **echoLv pin 24→36 + loop bound 36** [all W9].
**suite-16** (NEW, combat-feel §8: reach/spacing law, soft-aim matrix, step-in, cashable
punish, hold-at-range, GLYPH surfacing) [W1]; edits: hints→tips key + `P.onG=true` before
direct dodge() calls + `META.moves` cleared at suite start; clamp assert at 0.22 [W2].
**suite-17** (NEW, movement §7.2: MOVES integrity/grants/idempotence, fuel 45/65, airdash
gating, wallkick, longarm 8-place, seamstep phasing, dodge feel + perfect dodge, TIPS
machinery incl. boss-deferral, dig counters + digOf, collection buckets — plus CARVE_VAULT
and the `#N` uni keying per R6/R12) [W2].
**suite-18** (NEW, story §8: dialogue integrity incl. no-unreachable-nodes under the maxed
fixture, gate safety, seen-tracking, campLine order, event fragments incl. forgelord-gated
OVERWORK fixture, tips-copy asserts against META.tips) [W8].
**suite-19** (NEW, classes §7.10: five abil branches, five auras, mine lifecycle, hpCost
refusal/pay-once, foc 'shock' both paths) [W4].
**browser.js**: codex shows two class pages [W4]; camp THE SMITH row + new-count + dpad
focus [W8]; #bGrap hidden/shown + COLLECTION button [W2].
**shots.js**: dance scene [W1]; twelve silhouettes in situ [W6]; arena/boss scene [W7];
glint/glow reads [W3].

---

## 7. VERIFY-AT-IMPLEMENTATION (carried risks, ratified)

1. **Weft live HP vs the two depth curves** — CURRENT-STATE's single depthMul column (4.49×
   @3140m) disagrees with final-boss's depthHP≈6.14 assumption; the suite-10 hits-band
   (90–320) is the truth — tune `ENEMIES.weft.hp` only.
2. **blackdamp burstOnDeath 40** vs the single-hit clamp at caves depth (§4).
3. **dragline's negative kb** through hurtEnemy's shove path; **lodestone's cd-assign order**;
   **mine's terrain-arm vs bounce order** (all classes §8, ratified).
4. **`P.acd=a.cd` ordering** for lodestone; **pad button-3 index** for grap (movement §8).
5. **suite-13 spread** after W4+W5+W9 — trim order: overdraw 1.5→1.4, staff dmg 24→23,
   cairn 0.85→0.9 (from below), slam 1.1→0.9.
6. **`phase:1` on the weft** (rock-loitering feel) — one field, shots.js decides.
7. **Forge-on-run-items tempo** and **wallkick vs forge shafts** — playtest round two items.
8. **Witness** ships only if the wave holds schedule; nothing depends on it (MEND gate
   explicitly excludes it via BIOME_BOSS).
