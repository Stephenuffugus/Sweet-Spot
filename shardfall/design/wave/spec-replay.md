# SPEC — THE LONG TAIL: bounties, the Echo ladder, run rewards, and life after the ending

Designed against: creative-brief.md, CURRENT-STATE.md @3c446e9, ref-story.md (BOUNTIES/ECHOES/
THREATS contracts — the law here), ref-items.md, ref-enemies.md, ref-research.md, and the six
sibling specs. Every line anchor below was re-verified against the LIVE file at 3c446e9, not
taken from a ref. All entries are paste-ready in the file's terse style.

## ID MANIFEST (one namespace — checked against GEMS 77(+31), GEAR 12(+5), UNLOCKS 83(+36),
## ENEMIES 26(+14), ELITES 8(+3), BOUNTIES 12, BOONS 21, ATTUNE 29, CLASSES 4(+2), TREE 15,
## SIGILS 5, FORGE_OPS 4, MODAFF 12(+5), hint ids, and every id minted by the sibling specs)

- BOUNTIES (12): `carver ghost sparks letting crew clean outrun echoed loom tempered fuser plunge`
- BOONS (6): `redheart skyborne cohort stormfed gale redprice`
- ATTUNE (7): `jolt gash buoy slick wake shift span`
- New BOUNTIES table field: `ok` (draw predicate over META — one rollBounties edit)
- New BSTATE flags (run-scoped, never persisted): `weighted bossclean weftdown`
- New bTick kinds: `dig ghost shock bleed raise forge fuse fall`
- New ECHOES entries (no ids — names): `Crowned Seeping Charged Thin Braced`;
  new ECHO keys: `elite vent spark pfuel rec` (`spark` is flag-style — one echoes() edit)
- New RUNM keys (all → suite-13 KNOWN): `vsBleed aloft hpCost construct stormEcho dodgeRush crewcap`
  (`vsBleed` shared with spec-gear-forge, `aloft`/`hpCost` shared with spec-classes-skills —
  the FIELD wiring is theirs; the RUNM WRITERS and KNOWN entries are mine)
- New RUNB0 key: `reach:0` (consumer is spec-gear-forge's `inc('reach')` fold)
- New tables: `ECHO_FRAME` `TAGLINES` (post-ending frame text, first-match rows)
- New P field (run-scoped): `P.lastDodge`
- NO new META fields, NO SAVE_VER bump from this spec. `ECHO_FRAME`/`TAGLINES` gates read
  `META.endings`/`META.escapes` (spec-final-boss's v3 field) defensively (`(m.endings||{})`),
  so this spec is legal to land before or after theirs.
- Near-miss audit: bounty `deeper` REJECTED (live bounty id, line 1543); attunement `sparked`
  rejected for `sparks` adjacency → `jolt`; `swift` rejected (elite id); `echo`/`echoes`
  rejected (attunement id / META field) → bounty `echoed`; `crew` (bounty) vs RUNM
  `construct`/`crewcap` kept deliberately distinct.

---

## 1. BOUNTIES — 12 new (pool 12 → 24), one table-field extension, one payout repair

### 1.1 The `ok` field + the ending payout — two small mechanism edits first

**`ok` (draw predicate).** Four of the new bounties are meaningless on a fresh save (the forge
is cold, no echo is earned, the glyph's keeper is unreachable). Precedent for drawn-but-dead
bounties exists (`burn` with no burn source) but a LITERALLY impossible draw is a wasted slot.
One edit in `rollBounties()` (line 1557):

```js
 const pool=BOUNTIES.filter(b=>!b.ok||b.ok(META)),pick=[];
```

(`BOUNTIES.slice()` becomes the filter.) With 24 entries and at most 4 gated, the pool never
drops below 20 — the 3-distinct draw is always satisfiable.

**Endings must bank bounties.** Today `bountyPayout()` is banked ONLY in `die()` (line 3548) —
a run that ends at the master glyph forfeits every finished bounty, which taxes the game's best
moment. In `doEnding()` (spec-final-boss §5.6 — or `doEscape()` at 3852 if this lands first),
immediately before `saveMeta()`:

```js
 {const bp=bountyPayout();if(bp>0){META.shards+=bp;RUNSHARDS+=bp}}
```

and one row in the epilogue stats table: `<tr><td>Bounties honored</td><td>+N◆</td></tr>`
(render the computed `bp`). Suite-15 asserts it (§7.1.9).

### 1.2 The rows — paste at the end of `BOUNTIES` (line 1554), under one banner

```js
 // ---- the long tail: verbs for the new archetypes, the forge, the ladder, and the floor ----
 {id:'carver', n:'Carve 250 stones',              pay:100, goal:250,count:'dig'},
 {id:'plunge', n:'Survive 3 hard landings',       pay:90,  goal:3,  count:'fall'},
 {id:'ghost',  n:'Slip through 12 attacks',       pay:140, goal:12, count:'ghost'},
 {id:'sparks', n:'Kill 20 while they spark',      pay:120, goal:20, count:'shock'},
 {id:'letting',n:'Kill 25 while they bleed',      pay:110, goal:25, count:'bleed'},
 {id:'crew',   n:'Raise 6 constructs',            pay:130, goal:6,  count:'raise',
   ok:m=>!!(m.unlocks.sentry||m.unlocks.cairn||m.unlocks.effigy||m.unlocks.decoy)},
 {id:'fuser',  n:'Fuse a gem',                    pay:130, goal:1,  count:'fuse'},
 {id:'tempered',n:'Work the forge twice',         pay:120, goal:2,  count:'forge',
   ok:m=>Object.keys(m.bosses||{}).length>=1},
 {id:'outrun', n:'Reach 700m before the Weight stirs',pay:190,goal:1,test:s=>runDepth>=700&&!s.weighted},
 {id:'clean',  n:'Fell a Knot untouched',         pay:260, goal:1,  test:s=>!!s.bossclean},
 {id:'echoed', n:'Reach 1,500m in an echoed world',pay:250,goal:1,  test:s=>runDepth>=1500&&(META.echoLv|0)>=1,
   ok:m=>(m.echoLv|0)>=1},
 {id:'loom',   n:'Fell what keeps the glyph',     pay:400, goal:1,  test:s=>!!s.weftdown,
   ok:m=>Object.keys(m.bosses||{}).length>=3},
```

Payout-ladder audit (existing band 90–220): generic-verb rows sit low (carver 100, plunge 90,
letting 110 — mirrors `burn` 25@110), skill rows sit high (ghost 140, outrun 190, clean 260 —
one notch above `nohit` 220 because it is strictly harder), ladder rows pay for the harder
world (echoed 250 > `deeper` 180 at 300m less depth, priced by the echo), and `loom` 400 is
the ceiling on purpose — the final boss is the game's biggest single ask. `tempered`/`fuser`
under-pay their shard cost (forge ops 65–260◆, fusion 150◆) by design: they are discovery
nudges (playtest finding #1 — the game does not reveal its systems), not income.

### 1.3 Emitter sites — every new kind/flag, exact and complete

Counters only tick while drawn (`bTick` guards); flags are set unconditionally like
`hurt`/`shrine` and reset by `rollBounties`' `BSTATE={hurt:0,shrine:0}` wipe (absent = falsy —
no reset-list edit needed). `bTick(kind,n)` already takes an amount (line 1562).

| kind/flag | site (exact) | line to add |
|---|---|---|
| `dig` | `doMelee`, beside the dig-focus hook (2584) | `if(cut){bTick('dig',cut);if(CLASSES[META.cls].foc==='dig')gainFocus(cut*1.5)}` (fold into the existing `if(cut&&...)`) |
| `dig` | `upProj` friendly tunneler (3253, already `p.friendly`-gated) | after `const cut=carve(...)`: `if(cut)bTick('dig',cut);` |
| `dig` | `useAbility` `shaft` branch (its one carve call returns n) | `bTick('dig',n)` — Burrow is EXCLUDED (per-frame carve would flood the counter); Quake excluded (`explode()`'s carve is shared friendly/hostile) |
| `fall` | the fall-damage application in `upPlayer` (~3490), when `dmg>0 && !P.dead` after the hit | `bTick('fall');` — plumbline/deadweight's bounty |
| `ghost` | `hurtPlayer` (2882) — the i-frame rejection, ROLL-ONLY | `if(P.inv>0||P.dead){if(P.dodgeT>0&&!P.dead)bTick('ghost');return}` — `P.dodgeT>0` restricts credit to a live dodge roll (0.22s), so the 0.7s post-hit invulnerability can never tick it. Finesse, not luck. |
| `shock` | `killEnemy` beside the burn tick (2806) | `if(hasSt(e,'shock'))bTick('shock');` |
| `bleed` | same site | `if(hasSt(e,'bleed'))bTick('bleed');` |
| `raise` | (a) the cairn `raise` onKill block (spec-classes §0), INSIDE the `SENTRY.length` cap check; (b) `useAbility` `sentry` and `effigy` branches | `bTick('raise');` at each — a construct counts when it actually stands |
| `forge` | `doForgeOp` (spec-gear-forge §5.4), after the shard charge succeeds | `bTick('forge');` |
| `fuse` | `fuseGem` (3750), after `META.shards-=cost` | `bTick('fuse');` |
| `weighted` | `applyWeight` (3446), inside `if(target>P.weight){` | `BSTATE.weighted=1;` — the flag means "the Weight ever ticked this run"; band changes and camp reset `P.weight` but never the flag |
| `bossclean` | `killEnemy` boss tick (2805) | `if(e.boss&&!BSTATE.hurt)BSTATE.bossclean=1;` |
| `weftdown` | `glyphFelled()` (spec-final-boss §5.4) | `BSTATE.weftdown=1;` |

Verb coverage vs the assignment: movement (`carver`, `plunge`, `outrun`), finesse/timing
(`ghost`, `clean`), crafting (`tempered`, `fuser`), new archetypes (`sparks` storm, `letting`
blood, `crew` minion), endings (`loom`, plus the doEnding payout repair), no-hit (`clean`),
speed (`outrun`), ladder (`echoed`). No two rows share a verb-and-counter shape with an
existing row except `letting`/`sparks`, which deliberately complete the `burn` family across
the three damage schools — a build-gated set, not a duplicate.

---

## 2. THE ECHO LADDER — five new rungs, APPEND ONLY (rungs 11–15)

Suite-15 hard-codes rungs 8 (Hollow) and 9 (Silent); appending after `Rich` (index 9) is the
only legal move and these land at indices 10–14. Earning rung 11 takes eleven escapes — this
is content for the hundred-hour save, and every rung obeys the house law: a NAMED, single-axis,
readable rule; no rung shortens a tell or blocks a verb (ref-research §6).

### 2.1 Paste at the end of `ECHOES` (line 1519)

```js
 // ---- the ladder past the first lap: structure, not inflation (rungs 11+) ----
 {n:'Crowned',d:'The dark has more captains.',           elite:1.5},
 {n:'Seeping',d:'The floor remembers how to hurt.',      vent:1.6},
 {n:'Charged',d:'What dies here still argues.',          spark:1},
 {n:'Thin',   d:'The air gives you less to burn.',       pfuel:0.85},
 {n:'Braced', d:'The dark recovers sooner.',             rec:0.9},
```

### 2.2 The one `echoes()` edit (flag list, line ~1527)

`else if(k==='wound'||k==='nomark')o[k]=1;` → `else if(k==='wound'||k==='nomark'||k==='spark')o[k]=1;`

`elite`/`vent`/`pfuel`/`rec` are multiplicative — the fold handles them untouched.

### 2.3 Consumer sites (each key, one read, exact)

| key | consumer (exact site) | edit |
|---|---|---|
| `elite` | the spawn elite roll, line 2940 | `...*(T.elite||1)` → `...*(T.elite||1)*(ECHO.elite||1)` — the existing `Math.min(0.55,...)` cap absorbs any stack (Threat IV/V ×2.2 × Crowned ×1.5 = ×3.3, still capped). Generation already reads live ECHO (`dens` at the chunk budget) — precedent holds. |
| `vent` | the vent gate in `genChunk`, line 1796 | `<0.42` → `<Math.min(0.9,(SH.ventP||0.42)*(ECHO.vent||1))` — one expression serves spec-world's `ventP` AND this rung; the 0.9 ceiling keeps a double-stacked Seeping (×2.56 at echo 27) from making the gate a constant. Positional hash, no stream draws — fingerprints untouched. |
| `spark` | `killEnemy`, beside the Hollow wound line (2811) | `if(ECHO.spark)addHaz(e.x,e.y-4,30,1.1,e.dmg*0.35,{shock:1.2},'#e6d34a',0,'shock');` — the Hollow shape with the storm school's teeth: every corpse briefly argues, so melee-range kills cost positioning. HAZ-capped like wound; a wound+spark corpse is 2 HAZ, fine under 64. |
| `pfuel` | `maxFuel()`, line 2163 | `return f` → `return Math.max(30,Math.round(f*(ECHO.pfuel||1)))` — floor 30 (the php-floor idiom: taxed, never zeroed). The movement-progression track is the designed counter. |
| `rec` | `mkAtk()`, line 2982 | `*(T.rec||1)` → `*(T.rec||1)*(ECHO.rec||1)` — the 0.10 floor already sits outside the product. Worst compound (Threat V 0.65 × Braced 0.9): crawler rec .26→.152 — the punish window narrows, never vanishes. Threat III's own comment blesses recovery as the fair knob; windup is untouched by construction. |

### 2.4 Why these five (and the new-content interactions the brief demands)

Crowned feeds the three new elite modifiers (quaking/searing/tithing — spec-enemies) more
stage time; Seeping multiplies spec-world's four vent kinds — the world content IS the rung;
Charged is the storm archetype reflected back at the player (a storm build shrugs at shock,
a blood/melee build has to move — kill-discipline pressure); Thin taxes the flight game the
movement track grows (soft counter, floor 30); Braced compresses the punish literacy that
spec-combat-feel just taught. Structural escalation, zero stat inflation past what the first
lap already does (the Hades law).

### 2.5 Ladder math the suite must re-pin (real catch, do not skip)

Suite-15 line 46 pins `META.echoLv=24` and asserts combined pressure
`(hp*dens/php) > 6`. That assert is CONTENT-DEPENDENT: with 10 rungs, echo 24 stacks
Thick/Crowded three times (pressure ≈ 6.5); with 15 rungs, echo 24 stacks them only twice
(1.69×1.69/0.7396 ≈ **3.9 — the assert FAILS**). The intent ("every rule has stacked two or
three times over") now lives at echo 36: indices 0–5 land three times →
2.197×2.197/0.636 ≈ **7.6 > 6**. Edit: line 46 `META.echoLv=24` → `36`, message text
"by Echo 36", and widen the monotonicity loop bound (line 37) `n<=24` → `n<=36`. The rung-8/9
asserts, the wrap `x2` assert, and the pays-better assert (echo 10 includes Rich) are all
untouched by appending.

---

## 3. BOONS (+6, 21 → 27) and ATTUNEMENTS (+7, 29 → 36)

Serving the four new archetypes plus the movement/finesse dimension. `fx` keys are all in
`RUNB0()` (with the one `reach` addition below); every `m` key gets a named read site AND a
suite-13 KNOWN entry. Mechanical counts after: 14 mech boons (≥6 ✓), 21 mech attunements
(≥12 ✓). takeBoon/takeAttune apply `fx` and `m` to their own bags independently (verified,
lines 4036–4041 / takeAttune) — the one mixed entry (`redprice`) is legal.

### 3.1 ATTUNE — paste into the table (line ~1481)

```js
 // ---- the long tail: the missing elements, and the body ----
 {id:'jolt',  n:'Jolted',       d:'your hits shock',                     m:{hitShock:1.3}},
 {id:'gash',  n:'Opened',       d:'your hits bleed',                     m:{hitBleed:.28}},
 {id:'buoy',  n:'Buoyant',      d:'+35 fuel',                            fx:{fuel:35}},
 {id:'slick', n:'Slick',        d:'longer dodge i-frames',               fx:{iframes:.35}},
 {id:'wake',  n:'In the Wake',  d:'+30% damage just after a dodge',      m:{dodgeRush:.3}},
 {id:'shift', n:'Second Shift', d:'one more construct may stand',        m:{crewcap:1}},
 {id:'span',  n:'Long-Armed',   d:'+15% melee reach',                    fx:{reach:.15}},
```

- **jolt/gash** complete the kindled/rimed/sunderer element family — storm and blood get the
  same in-run on-ramp fire and frost have. Existing keys (`hitShock` is the ≥1 multiplier
  shape, `hitBleed` the stR ratio shape — verified in applyRunMods 2213–2216). Zero wiring.
- **buoy** — the first in-run fuel pick; `fuel` sits unused in RUNB0. Movement track synergy.
- **slick** — `iframes` sits in RUNB0 (dodge reads `0.30*(1+inc('iframes'))`, line 3524).
  Stacks with meta node c3; the dodge build's third leg.
- **wake** — timing rewarded with damage (playtest finding #4), read in `condMul` (§3.3).
- **shift** — raises the cairn turret cap 3 → 4 (§3.3); the stack-count axis for the minion
  build (ref-research: capped stacks make the cap a build resource).
- **span** — requires `reach:0` appended to `RUNB0` (line 2117) — suite-8's fx-key assert
  demands it — and rides spec-gear-forge's `a.range*=1+inc('reach')` fold. DEPENDENCY: lands
  with or after their affix consumer.

### 3.2 BOONS — paste into the table (line ~1050)

```js
 // ---- the long tail: storm, blood, crew, and the air ----
 {id:'redheart',n:'Redheart', d:'your hits bleed, and bleeding hurts more', m:{hitBleed:.26,vsBleed:.20}},
 {id:'skyborne',n:'Skyborne', d:'+25% damage while airborne',               m:{aloft:.25}},
 {id:'cohort',  n:'Cohort',   d:'your constructs stand longer',             m:{construct:4}},
 {id:'stormfed',n:'Stormfed', d:'shocked kills hasten your ability',        m:{stormEcho:1.5}},
 {id:'gale',    n:'Gale',     d:'+40 fuel, +10% move speed',                fx:{fuel:40,ms:.10}},
 {id:'redprice',n:'Red Price',d:'+40% damage, every swing costs blood',     fx:{dmg:.40}, m:{hpCost:2}},
```

- **redheart** completes the Emberheart/Rimeheart/Stormheart set for the blood school —
  hit-rider + payoff in one pick, same shape, same numbers class.
- **skyborne** — the flight-offense boon; pays the vantage/deadweight/levitate game.
- **cohort** — +4s on every construct (sentry, decoy, effigy, cairn turrets).
- **stormfed** — the `echo` attunement's shape (0.6s per any kill) gated on shock, 1.5s. The
  gate is the rate limit (ref-research §1: kill-driven refunds need one); acd floors at 0, it
  refunds, never loops. Conductor's ability engine without the aura slot.
- **gale** — the stat boon the movement dimension was missing (fuel appears in no boon today).
- **redprice** — Ruin's shape with the blood school's currency: the hpCost drain feeds
  hunger/undertow/cornered/bloodRise on purpose, and the existing hpCost gate refuses at
  lethal, so it cannot kill you (Ruin's hp-floor precedent).

### 3.3 Wiring — every new RUNM key, exact

**applyRunMods (line 2212)** — three new transfer lines (both hands pay, rule 16):

```js
 if(RUNM.vsBleed)a.vsBleed=(a.vsBleed||0)+RUNM.vsBleed;
 if(RUNM.aloft)a.aloft=(a.aloft||0)+RUNM.aloft;
 if(RUNM.hpCost)a.hpCost=(a.hpCost||0)+RUNM.hpCost;
```

The FIELDS themselves are sibling-owned: `vsBleed`'s condMul clause + ride-along + upSentry
copy are spec-gear-forge §4; `aloft`'s condMul clause + ride-along are spec-classes §0;
`hpCost`'s doMelee/doRanged pay-gate is spec-classes §0. If a sibling spec is cut, its boon
here is cut with it (dependency table in §8).

**Direct reads:**

| key | site | line |
|---|---|---|
| `dodgeRush` | `condMul` (2639-block) — new clause: `if(RUNM.dodgeRush&&perf-(P.lastDodge||-9)<1.5)m*=1+RUNM.dodgeRush;` plus one stamp in `dodge()` (3523): `P.lastDodge=perf;`. A 1.5s window after a roll — a window, not a state (the conditional-trap rule: never reward NOT playing). Both paths pay via condMul. |
| `stormEcho` | `killEnemy`, beside the `RUNM.echo` read (2813): `if(RUNM.stormEcho&&hasSt(e,'shock'))P.acd=Math.max(0,P.acd-RUNM.stormEcho);` |
| `construct` | lifetime sites: `useAbility` sentry `t:perf+8` → `perf+8+(RUNM.construct||0)`; decoy/effigy `+t` the same; cairn raise `t:` gains `+(RUNM.construct||0)` (coordination: spec-classes owns those branches — one added term each). |
| `crewcap` | the cairn raise cap (spec-classes §0): `SENTRY.length<3` → `SENTRY.length<3+(RUNM.crewcap||0)`. |

**suite-13 KNOWN (line 331)** += `'vsBleed','aloft','hpCost','construct','stormEcho','dodgeRush','crewcap'`.

---

## 4. THREAT TIER AUDIT — verdict: NO retune, NO seventh tier

Audited each of the six tiers against every sibling spec's content. THREATS stays exactly as
shipped; all three monotonic sequences untouched. The findings, tier by tier:

| tier | new-content interaction | holds? |
|---|---|---|
| I Watched (weight×2) | `outrun` bounty gets harder up-ladder — correct, pay is fixed, risk is chosen | ✓ |
| II Armed (arm+6) | the armor-shred wave (rasp support, `astun`, Whetstone+Sunderer stacks) softens II for shred builds — that is buildcraft answering a stated rule, the tier's whole point | ✓ |
| III Swift (spd 1.25, rec 0.65) | compounds with echo rung 15 Braced (×0.9): worst first-lap compound .26→.152s rec, above the 0.10 mkAtk floor; windup untouched by construction | ✓ |
| IV Teeming (elite 2.2, dens 1.6) | × Crowned (echo 11, ×1.5) = ×3.3 elite chance — absorbed by the existing `min(0.55,…)` cap; dens × Crowded wrap already asserted finite by suite-15 | ✓ |
| V Buried (dark 1.35) | spec-world's fungal `dark:0.85` and the render-side 0.86 total cap coexist; no echo touches `dark` | ✓ |
| — | a hypothetical VI (req 6, now reachable via weft/witness) was considered and REJECTED: the Echo ladder is the designed post-V spine (replayability doctrine: extend the spine, don't fork it), and `doEscape`'s maxThreat bump is already capped at `THREATS.length-1` so 7 distinct bosses overflow nothing | — |

The one threat-adjacent edit this wave needs is spec-final-boss's (weft/witness join
`META.bosses` harmlessly). Nothing for this spec to change.

---

## 5. BALANCE HARNESS EXTENSIONS

### 5.1 suite-13 ARCH — two rows IN ADDITION to spec-classes' four

Spec-classes §7.6 already seats Storm Conduit / Blood Price / Minelayer / Skyfall. Those cover
storm, blood, trap, and vertical. Still missing from the assignment's list: a true MINION
build and a movement-heavy build that isn't vertical. Add (same format, after their rows):

```js
  { n: 'Turret Crew',  cls: 'marksman', slot: 'ranged', base: 'bow',   gems: ['cairn', 'fasteratk', 'pierce'],   armor: ['foreman'] },
  { n: 'Tempo Dancer', cls: 'delver',   slot: 'melee',  base: 'sword', gems: ['flurry', 'momentum', 'serration'], armor: ['tempo'] },
```

Expected position at 1500m/lvl-11 (the suite asserts spread ≤4.5× and brute-kill ≤12s, not
absolutes — these are the design targets the seats should land in):

| build | own-hand eff. DPS estimate | brute@1500m (~274hp) | notes |
|---|---|---|---|
| Turret Crew | LOW band (~30–40): cairn ×0.85 dmg ×1.1 cd on a bow, pierce/fasteratk recover most of it | ~7–9s ✓ | the turret output is invisible to `dpsOf` — the `raise` credit below keeps it off the spread floor |
| Tempo Dancer | MID band (~55–75): flurry ×0.55/×0.45 ≈ ×1.22 rate, momentum ×0.85+credit, serration's bleed rides `stR` | ~4–5s ✓ | the ailment-saturation archetype (cd 0.17 « bleed dur/3) |

**effDps credit edit** (suite-13 ~70–75, alongside spec-classes' vsFull/slam/aloft/farshot
credits): `if(at.raise)m*=1.2;` — turret uptime valued at +20%, else the minion archetype
scores at a fraction of real output and drags the spread assert.

**Stability note:** neither row should enter the top-6 at either depth — they are floor
coverage. If `Turret Crew` breaches the 4.5× spread from BELOW, raise cairn's `a.dmg` factor
0.85 → 0.9 in spec-classes' table (one number, their file).

### 5.2 suite-10 — the two class seats (RATIFIED from spec-classes §1, land ONCE)

1. Line 247: `for (const cls of ['vanguard','marksman','pyromancer','delver','conductor','bloodletter'])`.
2. `build()` (~204–207): br map `conductor→'s'`, `bloodletter→'m'`; wslot set += conductor
   (ranged) — exact lines in spec-classes §1.
3. Expected fits (their numbers, re-checked): conductor rides pyromancer's passing seat
   (rangedDmg .10 + cdr .12 ≈ pyro+5–8% dps; hpMul −.10 > pyro's −.15 so TTD is safer);
   bloodletter rides vanguard's melee seat (meleeDmg .12, full hp pool; bloodRise/leech never
   fire in the harness — measured conservatively). Bands stay trash 1–6 / tough 3–16 /
   TTD 4–20 for all six classes at all five bands.

The merge hazard is drift: these edits exist in spec-classes §7.1–2 and here. Land theirs;
this section is the audit trail that the replay spec's content (bounties, echoes, boons)
changes NOTHING that suite-10 measures — no enemy stat, no weapon number, no depth curve.

---

## 6. POST-ENDING REPLAY HOOKS — table entries, not systems

### 6.1 USURP frames the Echo ladder — `ECHO_FRAME` + one line in `openEcho()` (4052)

```js
// The ladder's fiction follows the ending you chose. First match wins; silence before any.
const ECHO_FRAME=[
 {gate:m=>!!(m.endings||{}).usurp, t:'The world re-forms harder because you sign it that way. Each echo is a clause in your hand.'},
 {gate:m=>!!(m.endings||{}).mend,  t:'The sky holds. The deep does not have to. Each echo is a strain you order it to bear.'},
 {gate:m=>(m.escapes|0)>0,         t:'Every escape writes the world over once more. It remembers being rewritten.'},
];
```

In `openEcho()`, after the header sub-div:
`const ef=ECHO_FRAME.find(f=>f.gate(META));if(ef)h+='<div class="sub">'+ef.t+'</div>';`
The mechanics are identical for all three endings (equal payout, no farm ending —
spec-final-boss law); the FRAME is what USURP buys: the ladder stops being punishment and
starts being authorship, which is the dark ending's whole promise.

### 6.2 The title remembers — `TAGLINES` + one line in `openTitle()` (3937)

```js
// The first sentence of the game, kept true to the save that is reading it.
const TAGLINES=[
 {gate:m=>!!(m.endings||{}).usurp,t:'Something fell. It answers to you now.'},
 {gate:m=>!!(m.endings||{}).mend, t:'Something fell. The sky is back where it was.'},
 {gate:m=>(m.escapes|0)>0,        t:'Something fell. You have been to the bottom that is not there.'},
 {gate:m=>true,                   t:'Something fell. We have been mining it for nine hundred years.'},
];
```

`openTitle()` renders `TAGLINES.find(t=>t.gate(META)).t` where the literal string sits today.
The shipped line is row 4, verbatim — a virgin save reads exactly what it always read.

### 6.3 The Weight defers — one gated string in `applyWeight()` (3448)

```js
 toast('THE WEIGHT ×'+P.weight+((META.endings||{}).usurp?' — it attends':' — descend'));
```

The `usurped` fragment promises "the Weight reports to you"; this is that promise kept in the
cheapest possible way — same pressure, different posture. Mechanics untouched.

### 6.4 The death screen shows the ladder — one row in `die()`'s table (3555-block)

After the Threat row: `${(META.echoLv|0)?'<tr><td>Echo</td><td>×'+META.echoLv+'</td></tr>':''}`
— the run summary names the world you chose (discovery finding: the game must reveal its own
systems; the ladder was invisible at the moment it mattered most).

### 6.5 Already-covered hooks, ratified not duplicated

Camp acknowledgment lines (`CAMP_LINES`), per-ending dialogue (anvil11–13, carto12–13,
verse7–9), and the ending fragments are spec-story/spec-final-boss property. The bounty-side
NG+ hooks are §1's `echoed` and `loom` rows plus the `doEnding` payout repair. The Witness
(echo-gated sixth boss) is spec-final-boss §9 — this spec's rung 11+ content is tuned assuming
it ships, but depends on nothing in it.

---

## 7. TEST-SUITE EDITS — exhaustive

### 7.1 suite-15 (bounties + echoes — the load-bearing suite)

1. Pool integrity: with 24 rows, `rollBounties()` on a VIRGIN META never holds `crew/echoed/
   loom/tempered` (assert the filter directly: `BOUNTIES.filter(b=>b.ok&&!b.ok(META))`
   contains those four and the drawn pool excludes them); with a maxed fixture (bosses×5,
   echoLv 3, unlocks.sentry) every `ok` returns true; filtered pool length ≥ 20 always.
2. `bTick('dig',7)` increments a drawn `carver` by 7 (the amount arg is now load-bearing).
3. `ghost`: draw it, `BSTATE` reset; `P.dodgeT=0.1; P.inv=0.2; hurtPlayer(10)` → hp
   unchanged AND `BSTATE.ghost===1`; then `P.dodgeT=0; P.inv=0.2; hurtPlayer(10)` → still 1
   (post-hit inv never counts).
4. `weighted`: off camp, one band, force `P.weightT` past grace, `applyWeight(dt)` →
   `BSTATE.weighted===1`; `outrun`'s test false after, true on a fresh BSTATE at depth 700.
5. `bossclean`: kill a hand-built boss with `BSTATE.hurt=0` → flag set; repeat with
   `hurt=1` → not set. (`EN.length=0`, keep refs, `OFF()` floor — harness traps.)
6. `shock`/`bleed` kills: `applyStatus(e,{shock:1.3})` (and bleed) then `killEnemy` →
   drawn `sparks`/`letting` tick; an undrawn kind does not (existing pattern).
7. `fuse`: plant 3 identical gems + 150◆ → `fuseGem` ticks a drawn `fuser`.
8. `dig`: axe vs carved-in rock via `doMelee` → `BSTATE.carver >= 1` and equals tiles cut.
9. Ending payout: draw a completable bounty, complete it, set `MGS=2`, `doEnding('escape')`
   → `META.shards` grew by ≥ its `pay` on top of the ending purse. Reset `META.endings/
   escapes/maxEcho/echoLv` after (trap). (If landing before spec-final-boss: same assert
   through `doEscape()`.)
10. Echoes: `ECHOES.length===15`; rungs 11–15 are `Crowned/Seeping/Charged/Thin/Braced` with
    exactly the keys above; line 46 `echoLv=24`→`36` and line 37 loop bound →`36` (§2.5 —
    without this edit the suite FAILS on landing); at echoLv 13 a kill leaves a `'shock'` HAZ
    (`ECHO.spark===1` + HAZ delta, the Hollow test's shape); at 14 `maxFuel()` < echo-0 value
    and `>=30`; at 15 `mkAtk(ENEMIES.crawler.atk,THREATS[0]).rec` < the echo-0 value and
    `>=0.10`; at 11 `ECHO.elite===1.5`; at 12 a 200-chunk vent-gate sweep passes more chunks
    than at echo 0 (hash-count, no world build). Reset `META.echoLv/maxEcho` after each.

### 7.2 suite-13

1. KNOWN (line 331) += `'vsBleed','aloft','hpCost','construct','stormEcho','dodgeRush','crewcap'`
   — without this the suite fails with "writes a key nothing reads" on every new boon.
2. ARCH += `Turret Crew` and `Tempo Dancer` rows (§5.1).
3. effDps += `if(at.raise)m*=1.2;` (§5.1).
4. (Ratify, don't duplicate: spec-classes' FIELDS/CONDS edits; spec-gear-forge's vsBleed rows.)

### 7.3 suite-10

Class list + build() edits per §5.2 — spec-classes' edit, landed once. Nothing else: this
spec touches no number suite-10 reads (rec via ECHO only, and the suite builds at echo 0).

### 7.4 suite-8

`RUNB0` gains `reach:0` BEFORE `span` lands or the fx-key assert fails. New behavioral block
(suite-8's attunement-behavior style): `wake` — damage ×1.3 within 1.5s of `dodge()`, ×1.0
at 2s (pin `perf`); `stormfed` — `P.acd` drops 1.5 on a shocked kill, not on a clean one;
`shift`+`construct` — with `RUNM.crewcap=1` a fourth cairn turret stands, with
`RUNM.construct=4` its `t` is 4s later. (Reset RUNM/RUNB — trap.)

### 7.5 No edits needed

pwa.js (no META/save changes here); suite-9/11/12/14 (no world, enemy, or item numbers
touched); run.sh (no new suite — 15 extended in place). After landing: `./design/audit.sh`
(published counts move: bounties 24, echoes 15, boons 27, attunements 36) then
`./test/run.sh` full.

---

## 8. RISKS / COORDINATION

- **Dependency table (hard):** `skyborne`→spec-classes' `aloft` field; `redprice`→their
  `hpCost` gate; `cohort`/`shift`→their cairn/sentry branches; `crew` bounty→their
  cairn/effigy + the live sentry/decoy; `redheart`→spec-gear-forge's `vsBleed` condMul
  clause (if theirs is cut, this spec carries the identical three-line §3.3 clause set —
  char-identical, per their own coordination note); `span`→their `reach` fold; `tempered`→
  their `doForgeOp`; `loom`/`weftdown`/doEnding-payout→spec-final-boss; `Seeping`'s
  `SH.ventP` term→spec-world (degrades to `0.42*(ECHO.vent||1)` if theirs slips). Each
  orphan is one row to hold back — nothing here blocks the wave.
- **Suite-15's echo-24 pin** is the one place appending is NOT automatically safe — §2.5 is
  mandatory in the same commit as the rungs, or the suite fails on a number nobody changed.
- **`sparks`/`letting` on ailment-immune rosters**: a drawn bounty with no shock/bleed source
  in the build is dead weight for that run — accepted, exact precedent `burn`. The unlock
  pool always offers a source (conduit/serration are wave-1 gems).
- **`ghost` and hazard ticks**: dodging through a HAZ tick counts — accepted, it is still a
  timed roll through damage. If playtests farm it on a Crucible-style friendly... impossible:
  friendly hazards never call `hurtPlayer`.
- **`outrun` at Threat 0** is nearly free for a rushing player (grace 90s/band) — priced at
  190 not 220 for that reason; it teaches the Weight mechanic by naming it, which is worth a
  soft bounty (discovery finding).
- **`loom` pay 400 + ending purse + weft's 220 shards** stack into the game's largest single
  payday (~1000◆+) — intended: it is the game's largest single ask, and the Echo ladder it
  unlocks is the sink.
- **stormEcho under Tempest** (everything shocked, kills streaming): worst case a full acd
  refund per room — matches the `echo` attunement's existing uncapped shape at 2.5× the rate
  behind a build gate. If instrumented abuse appears, cap refunds at 1 per 0.5s (the
  rate-limit pattern ref-research names) — one guard line, noted here so it isn't invented
  twice.
- **Bounty-id blind spot closed**: the live ids (`deep deeper elites boss chests burn punish
  nohit swarm sigil rare thrifty`) were read from the file this session — `deeper` was a real
  collision caught and renamed (`echoed`). Any spec touching BOUNTIES after this one must
  re-grep, not trust CURRENT-STATE (which prints names, not ids).
- **Voice**: all player-facing strings here (bounty `n`s, echo `d`s, frame/tagline rows)
  follow the corpus — declarative, no exclamation marks, dread as understatement ("It
  attends."). If spec-story's editor pass wants to trim `ECHO_FRAME`, the gates are the
  contract; the sentences are theirs to tune.
