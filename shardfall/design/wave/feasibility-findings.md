# FEASIBILITY FINDINGS — adversarial review of the eight specs

Reviewed against the six ref contracts and, wherever a ref was ambiguous, against the live
code at `/workspaces/Sweet-Spot/shardfall/index.html` @ 3c446e9 and the test suites. Every
finding below carries the code line or ref quote that proves it. Cleared checks are listed at
the end so the absence of a finding is meaningful.

---

## BLOCKERS — ship broken behavior or failing tests as written

### B1. spec-enemies §5 — Quaking and Searing hazards are player-owned as written (missing `friendly` arg)

**Claims (paste-ready):**
- `addHaz(e.x,e.y+e.h/2,T.r,T.t,e.dmg*T.dmg,null,'#c98a4a','shock')` (tremor)
- `addHaz(p.x,p.y,p.sear.r,p.sear.t,p.searDmg,null,'#ff9a5a','fire')` (sear)

**Why it fails:** the signature is `addHaz(x,y,r,t,dmg,st,col,friendly,kind)` (index.html:3288;
ref-systems §2.1 verbatim). Both calls pass **8 arguments**, so `'shock'`/`'fire'` land in the
`friendly` slot — truthy → `friendly:1` → the hazard **ticks enemies and never touches the
player**, and `kind` defaults to `'cloud'`. Both elites would silently buff the player.
Compare the correct 9-arg call the spec itself cites as template: `bossSlam` →
`addHaz(e.x,e.y+e.h/2,110,0.55,e.dmg*0.8,null,'#b0a070',0,'shock')`. The spec's own §8.5 test
("exactly one `friendly:0` `'shock'` hazard") contradicts its own code.

**Fix:** insert the missing `,0,` before the kind in both calls.

### B2. spec-classes-skills §5 — Lodestone's plant-arm `a.cd=0.8` is verified WRONG on live code, and it corrupts the cached ability

**Claim:** "`a.cd=0.8` in the plant arm works because `useAbility` assigns `P.acd=a.cd` AFTER
the branch — VERIFY that order at implementation."

**Why it fails (verified):** index.html:2285-2290 —
`const a=ATK.abil; … if(!spendFocus(a.fc||0)){…} P.acd=a.cd;sfx('abil'); … if(a.fx==='blink'){…`
`P.acd=a.cd` executes **BEFORE** the fx dispatch, so the plant still charges the full 9 s.
Worse: `a` **is the cached `ATK.abil` object** — `a.cd=0.8` permanently rewrites the cache, so
after the first plant every future cast (plants included) runs at 0.8 s until the next
`refreshAttacks()` (only fired by equip/socket/boon/class events, ref-items §2.1). A 15-focus
teleport on a 0.8 s cooldown, forever.

**Fix:** never write `a.cd`. In the plant arm set `P.acd=0.8` directly (the spec's own named
fallback) and delete the primary variant from the spec.

### B3. spec-classes-skills §3 — Overdraw's focus drain is economically a no-op (`chan` charges per swing, not per second)

**Claim:** "+50% more damage, attacks drain focus … rides the existing `chan` gate … so
attacking now competes with abilities for Focus."

**Why it fails (verified):** the chan gate sits AFTER the cooldown early-out —
doMelee:2549-2553 `if(!a||a.kind!=='melee'||P.mcd>0)return; … if(a.chan&&!spendFocus(a.chan*DT,true))return;`
(doRanged:2655 same). It is paid once per **fired attack**: cost = `chan×DT` = 8/60 ≈ **0.13
focus per swing** ≈ 0.35 focus/s on a sword — against `FOCUS_REGEN=2`/s idle and `FOCUS_HIT=8`
GAINED per melee hit (index.html:276). Net focus goes UP while overdraw "drains". The wave's
largest new more-multiplier (×1.5) costs nothing; it will also crown the suite-13 spread (the
spec's §8 risk note assumes the drain is real when trimming). The channel gems only feel their
`chan` because their cd is ~0.08 s.

**Fix:** pay a real per-swing price (e.g. a `focusCost` field beside the `hpCost` gate:
`if(a.focusCost&&!spendFocus(a.focusCost,true))return;` with cost ≈ 6-8), or reprice overdraw
as a near-free multiplier (which the pure-multiplier budget — `pure <= 4`, full — forbids).

### B4. spec-story §8 + spec-movement §7 — both mint `test/suite-17.js`, and they contradict each other on where one-shot tips live

**Claims:** story §8.1 "**`test/suite-17.js`** — NEW, 'THE CAMP'"; movement §7.2 "NEW
**`test/suite-17.js`** — movement/tips/dig/collection". Same filename, two different suites.
Beyond the filename: movement §3.2 **retires `META.hints`** ("`META.hints` itself is retired
(migrated)" into `META.tips`, with `hint()` becoming a shim that writes `META.tips`), while
story's §7 catalogue and story's suite-17 assertions are written against `META.hints`
("a carve blocked by hard rock sets `META.hints.dig`"), and spec-world §6 suite-4 edit asserts
`META.hints.hidden===1`. If movement lands, every `META.hints.*` assertion in story/world is
asserting a dict the game no longer writes.

**Fix:** one owner for the tip store (movement's TIPS table is the superset — story owns copy,
movement owns machinery); story's and world's assertions target `META.tips`; renumber one of
the two new suites to 18 and add both to `SUITES` in run.sh.

### B5. Four specs bump SAVE_VER 2→3 and the one "merged block" omits a whole spec — migrated saves silently skip it

**Claims:** story §0 declares the canonical merged block — "**(one block, three specs)**:
spec-final-boss adds `endings`, spec-gear-forge adds `forge`, this spec adds `dlg` and
`firsts`" — but spec-movement §6 ALSO bumps 2→3 with `tips` (copied from `hints`), `moves`,
`seen.gem`, `seen.uni`, plus DEFAULT_GEM_POOL seeding and the retroactive `checkMoves(1)`.
Story's coordination list names only "the four sibling specs (spec-final-boss,
spec-classes-skills, spec-enemies, spec-gear-forge)" — movement (and its migration) is
invisible to it.

**Why it fails:** `migrate()` is stepwise on `m.ver`. Whichever v3 block lands first stamps
`ver=3`; a save touched in between never runs the other spec's v3 body (`if(m.ver<3)` is now
false). Belt-and-braces defaults rescue empty dicts, but movement's hints→tips copy and
seen.gem seeding are **content**, not defaults: a veteran's save migrated early re-fires every
one-shot tip and shows an empty gem collection. pwa.js also hard-codes `ver === 2` at :100 —
one edit, not four competing ones.

**Fix:** one canonical v3 block = `endings + forge + dlg + firsts + tips(from hints) + moves +
seen.gem/seen.uni (+ seeding)`, one loadMeta belt-and-braces list, one pwa.js edit asserting
all fields. Name movement in story's §0 coordination note.

---

## HIGH — soft-fails, wrong math, cross-spec integration breaks

### H1. spec-final-boss §5.3 — `wakeWeft()` spawns through `queueEnemy`, which silently refuses at the 120 cap

**Claim:** "spawn through `mkEnemy` … via `queueEnemy` (cap-safe; bosses may push EN to 124
and evict a far sleeper)."

**Why it fails (verified):** `function queueEnemy(e){if(EN.length+SPAWNQ.length<120)SPAWNQ.push(e)}`
(index.html:2114) — no boss exception, no eviction. The 124/evictFar path exists only inside
`spawnFromChunks` ("Bosses never yield a slot…", :2899-2903). At a crowded floor (abyss
density × Teeming × Crowded) the WAKE fires MGS=1, toast, shake — and no boss. Recoverable
(the seat re-offers because "no live weft ∧ MGS<2"), but the climax visibly no-ops.

**Fix:** wakeWeft runs from a UI handler, outside any EN iteration — evict then push directly:
`while(EN.length>=124&&evictFar()); EN.push(mkEnemy('weft',…))`, mirroring the
spawnFromChunks boss path.

### H2. spec-final-boss §5.3 — the paste-ready entrance fill entombs a doorway-stander; the safety guard exists only in prose

**Claim (code):** `for(let x=797;x<=802;x++)for(let y=3148;y<=3149;y++)setTile(x,y,7);`
**Claim (prose, same section):** "Entrance fill skips any player-overlapping tile (standing in
the doorway at wake must shove, never entomb — same skip as sealFill)."

**Why it fails:** the pasted loop has no overlap check. Tile 7 is hard 2 — a non-digger sealed
into the doorway cannot carve out. The spec bills its code as paste-ready; this one is not.

**Fix:** add the same player/boss-overlap skip `sealFill` specifies to the fill loop.

### H3. spec-story §0/§7 — the "new hint ids" manifest is wrong: `socket` and `camp` already exist in the live file; `dig` is double-minted against spec-movement

**Claim:** "New hint ids: `dig camp socket shrine vaultdig movetier`."

**Why it fails (verified):** live call sites — `hint('socket',…)` index.html:3402,
`hint('camp',…)` :4958 (plus fight :3193, dodge :3176, punish :3167, hover :3494, heat :3511,
depth :3529, lattice :3400, move :3969). `socket`/`camp` are not new; story gives them new
copy at new trigger sites, but `hint()` self-gates on the saved flag so veterans never see it,
and fresh saves get whichever site fires first. Separately, `dig` is minted by BOTH story
(§7: "That stone is past this tool…") and movement (§3.1: "This tool does not dig stone…") at
the same blocked-carve site with different copy. Story's own §9 risk ("Grep `hint('` before
landing") is the confession that the grep was never run.

**Fix:** strike camp/socket from the manifest (adopt live ids/copy or explicitly re-key);
merge the two `dig` tips — movement owns the trigger (its `CARVE_BLOCK` machinery), story owns
the words.

### H4. spec-world §4 — pocket fuel math is calibrated against a 100-fuel tank that does not exist; the flue misses its own bar at the real baseline

**Claim:** "baseline tank ≈ `100 fuel / 42 per s ≈ 2.4 s` thrust … ~20-24 tiles of real climb
per tank" → the 16-20-tile flue bore = "most of a baseline tank."

**Why it fails (verified):** `P` literal `fuel:60,maxfuel:60` (index.html:2136),
`maxFuel(){let f=60+inc('fuel');…}` (:2163), `FLY_DRAIN=42` (:243). Real baseline = **60
fuel ≈ 1.43 s ≈ ~12-17 tiles** — the flue is a two-tank climb today for every non-delver
(the 100 figure is a delver with `fuel:40` class fx). spec-movement then cuts the base to
**45** (≈1.07 s), the exact "below ~80" tripwire world's own §7 risk names. Fungal flues stay
soft (hard-0 walls, dig handholds); the **abyss** flue (tile 7, hard 2) is enterable at
baseline only via the gait track — i.e. it silently depends on spec-movement landing first
and on its retroactive grants.

**Fix:** restate the math at 60/45; either shorten the bore to ~12-14 tiles or add a mid-bore
perch every ~8 tiles; declare the abyss-flue → movement-track landing-order dependency.

### H5. spec-movement §5/§6 — the collection view and `seen.uni` keying do not survive spec-gear-forge's UNIQ3

**Claims:** `seen.uni` keyed `k.item.base+(k.item.alt?'#2':'#1')`; "uni: per GEAR id with a
UNIQUES entry, **two rows (#1,#2)**"; totals "2×|UNIQUES| (every base has a UNIQ2 alt)";
`codexTitle` branch `uniqueDef(id.slice(0,-2),id.slice(-1)==='2')`.

**Why it fails:** gear-forge §2.1 adds `UNIQ3` (alt **2**, discovery bucket **'#3'**:
"alt 2 opens `#3`") and 42 uniques total. Under movement's code every third-alternate records
as `'#2'` (mislabeled as the UNIQ2 item), `#3` rows never render, and the totals are wrong.
Both specs also write the same pickup site (movement `seen.uni`, gear-forge the `seen.item`
alt-key change) — one integration, currently specced twice, incompatibly.

**Fix:** key `'#'+((alt||0)+1)`; derive per-base row count from UNIQUES/UNIQ2/UNIQ3 presence;
parse the numeric suffix in codexTitle; reconcile the pickup-site edit with gear-forge's.

---

## MEDIUM

### M1. The Witness "cut line" is false across the wave

spec-final-boss §9: "if the wave runs long, cut it — **nothing above references it**." But
spec-story ships `carto14` and `verse13` gated on `(m.bosses).witness` (§3.2) and ratifies the
Witness bestiary (§6); spec-replay §6.5 tunes rungs 11+ "assuming it ships". Story's suite
can't catch it: the maxed fixture sets `bosses.witness=1` unconditionally, so the
"every node reachable" assert passes while two nodes are permanently unreachable in real play.
**Fix:** story marks carto14/verse13 cut-with-witness; final-boss's cut note names them.

### M2. Two in-wave display-name collisions: "Plumbline" ×2, "Slipstream" ×2

spec-classes §4 mints aura `plumbline` (n:'Plumbline') and aura `slipstream` (n:'Slipstream');
spec-gear-forge mints UNIQUES.spear `n:'Plumbline'` (§2.3) and UNIQ3.harness `n:'Slipstream'`
(§2.5). Ids don't collide (unique names are display strings — gear-forge §8 checked
Static/Patience/Mercy but not these two), so no suite will ever object — which is why it
ships confused: two same-named, thematically adjacent (vertical / movement) items in one wave.
**Fix:** rename one of each pair (spear → 'Plummet'/'Fathom'; harness third → 'Tailwind').

### M3. spec-classes §4/§0 + spec-gear-forge §3 — the `applyStatus` duration edits target a `const`

Both galvanic (`dur*=1.5`) and `aildur` (`dur*=1+inc('aildur')`) patch "where the duration is
set" — the live line is `const pot=st[k],dur=STATUS[k].dur*(1-resist);` (applyStatus,
index.html:2469-2470). As written the edits are a syntax error; the site must be refactored to
`let` (or the multipliers folded into the initializer). One-line fix, but two specs paste it
as ready.

---

## LOW / NOTES

- **spec-enemies vs spec-final-boss, `mender`:** final-boss's manifest says "`mender` was
  rejected for its near-miss with the `mend` ability gem" (gem verified live at index.html:653)
  — spec-enemies mints enemy id `mender` anyway. Legal (distinct strings, zero table
  collisions verified by scan), but the wave applies opposite standards to the same near-miss;
  decide once.
- **spec-enemies §5 `tithe`:** formula reads `runShards`; the live global is `RUNSHARDS`
  (die(), index.html:3549). Naming slip only.
- **spec-final-boss §7.2:** the weft grid header says "32×38" but the pasted frame has 37 rows
  (its own §7.2 footer says "row 30 of 37"). The grid is self-consistent; fix the header so
  nobody "corrects" the art to 38.
- **spec-replay §2.5 is mandatory-same-commit:** verified — test/suite-15.js pins
  `META.echoLv=24 … pressure > 6` (with 15 rungs, pressure at 24 ≈ 3.9 → FAIL). The spec's own
  24→36 edit is correct and must land with the rungs, not after.
- **spec-movement §1.2 / spec-classes §4 dodge overlap:** movement clamps `P.mcd/P.rcd` to
  ≤0.12 on every dodge; classes' slipstream aura zeroes them. Compatible, but neither spec
  cites the other; land movement's clamp first and phrase slipstream as the upgrade.

---

## CLEARED — checked and found sound (no action)

- **Id namespace:** every minted id across all eight specs scanned against the live GEMS/GEAR/
  UNLOCKS/ENEMIES/ELITES/CLASSES tables — zero collisions (incl. `chain`-style traps).
- **Pure-multiplier budget:** suite-13 `pure.length <= 4` verified; all ten new supports touch
  a non-more/cd/dmg/kb field and classify as contract-changers.
- **suite-13 CONDS `set:null`** (vsFull): legal — the harness guards `if (setup) setup(e)`.
- **FALL_SAFE=520** exists (:247); slam/aloft CONDS and condMul clauses are parity-correct.
- **spec-enemies stat envelope:** all 12 rows verified inside every band's toughest/deadliest
  (suite-10 TTK/TTD targets unchanged); atkReach ≤78 and wind floors hold row by row; costs
  recomputed and match; top-2-row strings checked against the full ref-art inventory — all
  distinct; ramps clear Law 1/2 in their bands; `dirt` unused.
- **Split field-ification** is behaviorally identical for voidspawn (children carry no `split`).
- **Front-shield refinement** site verified (:2776); shieldman unaffected (no `shoot`).
- **Master-glyph geometry:** chunks (16,65)-(17,66) verified outside suite-14's sealed-chunk
  sweep (cy 12-60) and ownership sample; depth/dmg/hp arithmetic re-derived and correct
  (depthHP(3110)≈6.14, depthDmg≈2.78, reach 104≤105).
- **doEnding gates:** `echoLv>=6` = through Brittle (index 5) — matches the stated fiction;
  MEND via `Object.values(BIOME_BOSS)` cannot be satisfied by weft/witness.
- **Fragment ordering:** merged 44-entry order re-checked non-decreasing; depth<0 entries are
  exempt from the order assert (live `escape` already sits after f13 and suite-8 passes).
- **spec-world RNG ledger:** stamp order (rooms→vents→…→vault→cache→pockets→boss) verified in
  genChunk; new hash primes 23/41/43 unused on the terrain strand; pocket chests classify into
  F.poi and stay fixed under poi/ore/spawn rerolls exactly as argued; suite-9:281 whitelist
  edit is required and correctly quoted; suite-14 line anchors (82/102/119-120) all verified.
- **spec-replay wiring:** `rollBounties` pool line (:1558), `bTick(kind,n)` amount arg,
  `RUNM0=()=>({})` (no factory edit needed), `applyRunMods` transfer-line site, killEnemy
  `bTick('burn')`/`RUNM.echo` neighbors, `applyWeight` toast line, fuseGem cost site — all
  verified present; the `ok`-filter and echo fold edits match the live shapes.
- **Resonance pairs:** `mod()` runs only via computeAttack/refreshAttacks, and refreshAttacks
  fires on every equip/unequip — wornUniq reads are cache-coherent as claimed.
- **affTierCap refactor** is behavior-identical to the live `affTierFor` internals (:839-842).
- **arcblade** is genuinely the first b-color melee skill (grep verified none exist).
- **upSentry copy-list** edits (vsFull, vsBleed) target the verified list (:3316-3319);
  `raise` correctly excluded from it.
