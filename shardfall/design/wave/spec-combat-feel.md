# SPEC — COMBAT FEEL: "slide in, strike, get out"

Owner playtest verdict: "enemies are almost impossible to hit... half rng... run at enemies
and swing fast." This spec makes melee read as SKILL inside the existing machinery. No new
systems, no new EDGE actions, no table fields on enemies, no hitstop/shake/windup changes.
Line numbers are commit `3c446e9` of `/workspaces/Sweet-Spot/shardfall/index.html`.

## 0. VERIFIED DIAGNOSIS (measured from the code, not the prompt)

Player melee hit test (`doMelee`, line 2556): `d < a.range + e.w/2`.
Sword range 26 → **33px** effective vs a 14px grunt. Enemy AI initiates a windup at
`d < atkReach(e.atk)*0.85 + e.w/2` (line 3143). Measured engage distances:

| enemy | atkReach | engages at | | enemy | atkReach | engages at |
|---|---|---|---|---|---|---|
| crawler | 54.4 | 53.2 | | ember | 55.6 | 53.8 |
| bat | 62.4 | 59.0 | | smith | 69.2 | 70.8 |
| rockling | 67.6 | 64.5 | | wraith | 69.6 | 66.2 |
| stalker | 60.0 | 56.5 | | voidspawn | 61.2 | 60.0 |
| brute | 64.0 | 64.4 | | hollowed | 69.0 | 66.2 |
| shieldman | 60.0 | 60.0 | | bloomback | 62.0 | 62.2 |

Every band-defining grunt commits from 53–71px against a 33px sword. The intended loop —
dodge through the lunge (i-frames, `dodge()` line 3465), punish the rec window
(`RECOVER_DMG=1.25`, hurtEnemy line 2748) — is real but barely cashable: dodge displaces
~90px (`ms*2.4*0.22`, line 3413), leaving you 10–45px behind a spent enemy whose rec is
0.16–0.50s, against a 33px reach and a 0.38s swing cd. One marginal attempt, often a whiff
because the cone (`fang = P.face` horizontal, line 2552) missed a flyer or the wrong side.
Extension to the diagnosis: **`P.face` is set ONLY by the movement axis** (upPlayer line
3415) — the mouse aims ranged (`aimVec`) but never melee, so a keyboard+touchpad player
cannot point a swing at anything, and standing still they can never hit behind or above.

Verified suite freedom: suite-10 `hitsToKill` (test/suite-10.js:224-240) reads
`dmg/crit/critMult/cd/count/pierce` — never `range`. suite-13 `effDps` reads `dpsOf`
(dmg/cd) plus conditionals — never `range`. **Range-only and behavior-only changes cannot
move the TTK/TTD bands or the archetype spread.** Every change below is range/behavior-only;
weapon `dmg`/`cd` are untouched.

---

## 1. MELEE REACH & FORGIVENESS

### 1.1 Base range per melee weapon (GEAR table, lines 761–774)

| base | line | current | proposed | envelope vs 14px grunt (range + e.w/2 + step 8) |
|---|---|---|---|---|
| sword | 762 | `range: 26` | `range: 34` | 49px |
| axe | 763 | `range: 24` | `range: 32` | 47px |
| greataxe | 771 | `range: 32` | `range: 42` | 57px |
| shield | 773 | `range: 20` | `range: 26` | 41px (bash, front-only) |

Spacing law preserved: the largest melee envelope (greataxe 57px) stays below the SMALLEST
per-biome max grunt engage distance (ruins/shieldman 60px); the starter sword envelope
(49px) is below EVERY band-definer (min crawler 53px). Enemies still commit first from
outside your reach; you still cannot trade toe-to-toe. The punish window becomes cashable:
a dodge-exit separation of 10–45px is now inside one swing.

Side effects checked: dig carve center `P.face*a.range*0.8` (line 2567) moves to 27–34px
ahead with `digR` default 24px — still overlaps the face tile, digging unchanged in
practice. Chest reach `a.range+10` (line 2565) grows 8px — harmless. Whirlwind
(`range*1.05`) and Lunge gem (`range*1.1`) scale off the new bases proportionally.

Suites: suite-10 TTK — **no impact** (range unread). suite-13 no-dead-gems — `range` is in
`FIELDS`, ratios preserved, still green. suite-12/7 — no range assertions. NEW assertion:
suite-16 §A below.

### 1.2 Step-in fold (doMelee, new constant + 1 line)

Every committed swing carries a small forward step — Dead Cells root motion, not the Lunge
gem's dash.

- New constant, CONSTANTS section (append to line 239 cluster):
  `const MELEE_STEP=8;   // px folded into every committed melee swing`
- In `doMelee`, AFTER aim resolution (§2) and BEFORE the hit loop (i.e. between current
  lines 2552 and 2553):
  `if(!a.lunge&&!a.chan&&!P.block&&(IN.x===0||Math.sign(IN.x)===P.face))collideMove(P,P.face*MELEE_STEP,0);`

Rules encoded by that guard, each deliberate:
- `!a.lunge` — the **Lunge gem** (line 666: `a.lunge=340` + 0.12s i-frames at doMelee 2551)
  stays the BIG dash and keeps its i-frames unique; the step never stacks on it.
- `!a.chan` — Whirlwind ticks every ~0.08s; a step per tick would be a 96px/s free move
  engine. Channelled skills get no step.
- `!P.block` — a shield-holder planted is planted.
- input-direction guard — stepping only when neutral or moving INTO the facing direction.
  (Symmetric: mash-swinging while retreating also drifts you 8px per swing along your
  retreat — that is swing momentum, and it is fine.)
- `collideMove`, never `P.x +=` — respects walls, same mover as everything else.
- Position step, not a velocity impulse — so the SAME swing's hit test benefits (the punish
  math needs this: from 46px, step to 38px, 41px envelope, hit), and the Momentum gem
  (`condMul` reads `|P.vx|`, line 2642) gets no free credit at a standstill.

Suites: none read player position in the damage pipeline. NEW: suite-16 §C.

### 1.3 Hit-test forgiveness: overlap always hits (doMelee, line 2558)

Current: `if(diff<=half||d<12){` — the point-blank exemption misses a bat chewing your head
(centers ~15px apart). Replace the exemption with true box overlap:

```js
if(diff<=half||(Math.abs(dx)<(P.w+e.w)/2&&Math.abs(dy)<(P.h+e.h)/2)){
```

Any enemy overlapping your body is hit by any swing regardless of arc. This is
forgiveness, not reach: it only fires inside `a.range+e.w/2` (the outer `d` test at 2556
still gates). `e.h` now participates exactly where it matters (tall/short overlaps);
no elliptical-distance rework needed. Arc values themselves are untouched (sword 100°,
axe 80°, greataxe 120°, shield 70°).

Suites: none assert the d<12 exemption. NEW: suite-16 §B2.

---

## 2. MELEE SOFT-AIM (new helper + 1-line change in doMelee)

Philosophy (matches `aimVec`'s aimassist, line 2582): **manual aim IS the player; auto
assist bends and never replaces held input.**

New helper beside `aimVec` (~line 2607), consumed by `doMelee` replacing line 2552's
`const fang=P.face>0?0:Math.PI` with `const fang=meleeAim(a), half=...`:

```js
// Swing-time aim. The cursor/right stick is intent and owns the swing; auto-aim only ever
// bends when the hands are neutral, and never overrides a held direction (assist philosophy).
function meleeAim(a){
 if(IN.manual){P.face=IN.aimX<0?-1:1;return Math.atan2(IN.aimY,IN.aimX)}
 if(!SET.aimassist)return P.face>0?0:Math.PI;
 let best=null,bd=a.range+MELEE_STEP+12;
 for(const e of EN){if(e.hp<=0||(e.invT||0)>0)continue;
  const d=Math.hypot(e.x-P.x,e.y-P.y)-e.w/2;if(d<bd){bd=d;best=e}}
 if(!best)return P.face>0?0:Math.PI;
 const dx=best.x-P.x;
 if(IN.x===0)P.face=dx<0?-1:1;                                  // neutral: face the bite
 if(Math.sign(dx||P.face)!==P.face)return P.face>0?0:Math.PI;   // held away: never override
 return Math.atan2(best.y-P.y,dx)}                              // on-side: tilt for flyers
```

Behavior matrix:

| device state | result |
|---|---|
| mouse/right-stick aimed (`IN.manual`, 1.5s decay, line 4352) | swing cone points at the cursor/stick, full 2D; `P.face` snaps to the aim side for the swing. The kb+touchpad fix: point at the bat, press `mel`, hit the bat. |
| auto, input neutral (`IN.x===0`) | face + cone snap to the nearest viable target inside the strike envelope (+12px margin). Standing still and mashing turns you to fight what's biting you. |
| auto, input held, target on facing side | cone TILTS vertically to the target (flyers above/below become hittable) — facing never changes. |
| auto, input held, target behind | nothing. Held direction is law; you cannot be spun. |
| `SET.aimassist === 0` | auto path fully off — exactly today's behavior. Manual aim still works (aiming is not assist). |

`doMeleeAs` (shield bash, line 2627) is **deliberately untouched**: front-only
`Math.sign(e.x-P.x)===P.face` is the shield's directional identity.

Order inside `doMelee`: pay cd → lunge-gem branch → `fang=meleeAim(a)` (may snap face) →
step-in (§1.2, uses the resolved face) → hit loop. Aim resolves before the step so the step
goes toward the thing you are about to hit.

Suites: harness has no pointer; `IN.manual` defaults false and suite-16 sets it explicitly.
`nearestEnemy`/`aimVec` untouched — ranged auto-aim and suite behavior unchanged.
NEW: suite-16 §B.

---

## 3. THE DANCE MADE LEGIBLE

### 3.1 Spent-enemy tell (render, lines 4714–4719)

Today: sag to 0.9h, desaturate to `#5a5550`, a static 6×2px pale tick. The tick becomes a
**draining punish countdown** — same visual grammar as the windup marker (a bar that is a
clock), same colors, zero new machinery. Replace lines 4718–4719:

```js
if(spent){h=e.h*0.9;
 const rmax=(e.atk&&e.atk.rec)||0.24,rt=Math.max(0,Math.min(1,e.rec/rmax));
 ctx.fillStyle='#ffe9a030';ctx.fillRect(x-7,y-e.h/2-7,14,3);
 ctx.fillStyle='#ffe9a0d0';ctx.fillRect(x-7,y-e.h/2-7,14*rt,3)}
```

Amber (`#ffe9a0` — the game's existing "opportunity" color: interrupt burst, cull flash)
draining left-to-right: how much window remains. Render-only, no RNG, works on bosses too
(the final boss requires three-beat literacy; this is where it gets taught). Respects
nothing in `ECHO.nomark` — Silent removes windup markers (the threat), not the spent tell
(your earned reward); this is a deliberate reading of Echo 9, note it in the code comment.

### 3.2 Spent-entry dust (upEnemies `endAct`, line 3120)

The moment the window OPENS must pop. `endAct` is the single choke point (rule 15's
"recovery can never be skipped"), so one line inside it:

```js
const endAct=()=>{e.act=0;e.rec=(e.atk&&e.atk.rec)||0.24;e.vx*=0.35;burst(e.x,e.y+e.h/2-2,'#9a938a',3)};
```

3 dust particles at the feet — "it stumbled". `burst` self-caps at PART 350 (line 2539).
endAct only runs within the 1400px sim radius, so no off-screen particle waste. The
sleep-conversion path (line 3061) sets rec directly without endAct — correct, it's
off-screen by definition.

### 3.3 Dodge-through feel (upPlayer, line 3413)

The i-frame blink already exists (render 4770: player skips every other frame while
`P.inv>0`, plus white tint over 0.45). Add an afterimage streak — sim-side particles, no
new render machinery. In the dodge branch:

```js
if(P.dodgeT>0){P.dodgeT-=dt;P.vx=P.face*ms*2.4;P.vy=Math.min(P.vy,0);
 if(PART.length<330)PART.push({x:P.x,y:P.y-2,vx:0,vy:0,t:0.16,col:'#9fd0ff90'});}
```

~13 particles per dodge (0.22s × 60fps), guarded at 330 to leave headroom under the 350
cap. Cyan matches the existing dodge/blink family. Dodge numbers themselves (0.22s roll,
0.55s cd, 0.30s i-frames ×(1+inc('iframes'))) are **untouched** — the cooldown gap is the
skill ceiling and it is correct.

### 3.4 Contextual tips — riding the ONBOARDING spec's mechanism, not duplicating it

The tips mechanism is the existing `hint(id,text)` (line 3899: once per save via
`META.hints`, gated on `SET.hints`, `pr()`-interpolated, toast delivery — never modal).
The movement/onboarding spec owns the tip catalogue and any upgrades to delivery; this
spec CONTRIBUTES three combat tip ids to that catalogue. If that spec renames or restyles
the mechanism, these ride it unchanged. Exact copy and trigger sites:

| id | trigger site | copy |
|---|---|---|
| `fight` | first enemy windup start within 240px of P — the initiate branch, line 3143, one call after `e.wind=e.atk.wind` | `` `Strike ${pr('mel')} · shoot ${pr('rng')} · dodge ${pr('dodge')}` `` |
| `dodge` | first melee hit taken from an enemy — `hurtPlayer` call site at line 3127, after the hit lands | `` `${pr('dodge')} dodges THROUGH an attack — you are untouchable for a beat` `` |
| `punish` | first `endAct` within 240px of P (same closure as §3.2, guarded `if(Math.hypot(e.x-P.x,e.y-P.y)<240)`) | `It is SPENT — the amber bar is your window. Strike now for extra damage` |

`hint()` early-returns on seen ids, so the hot-path cost is one property read. All three
interpolate `pr()` (rule 11). Do not add any other teaching UI — the brief is explicit:
contextual tips only, no tutorial wall.

---

## 4. INPUT ON REAL HARDWARE (keyboard + touchpad)

The bindings already exist and are correct — the failure is surfacing. `KEYMAP` (line
4171): mel `J/Z`, rng `K/X`, dodge `Shift/Shift/L`, abil `F/Q`. A touchpad user has no
comfortable RMB (two-finger click) and no MMB at all, but `GLYPH.kb` (line 4391) labels
the actions `LMB`/`RMB`/`SHIFT`, so nothing ever tells them the keys exist.

Change `GLYPH.kb` labels only (line 4391):

| action | current | proposed |
|---|---|---|
| `mel` | `'LMB'` | `'LMB/J'` |
| `rng` | `'RMB'` | `'RMB/K'` |
| `dodge` | `'SHIFT'` | `'SHIFT'` (already a key — unchanged) |

That one edit propagates everywhere by construction: every prompt goes through `pr()`
(rule 11), the CONTROLS panel redraws from GLYPH (`refreshPrompts`, line 4398), and the
`fight` tip in §3.4 now surfaces `LMB/J · RMB/K · SHIFT` to exactly the player who needs
it, at the moment of first contact. Touch users see the touch GLYPH set (unchanged —
`bRng`/`bDodge` overlay buttons already exist, lines 4315–4316); pad users see pad glyphs.

**No new EDGE action is added** — mel/rng are HELD actions and dodge already exists — so
the 8-place new-action checklist (ref-systems §1.2) is NOT triggered. Do not add
double-tap dashes, tap-modifiers, or new bindings; that is scope the playtest did not ask
for (rule 14).

Suites: suite-8 GLYPH assertions check key PRESENCE per device set, never label text —
green. NEW: suite-16 §F asserts the kb labels carry the key alternatives.

---

## 5. ENEMY APPROACH TUNING (surgical: one behavior, zero table changes)

After §1–2 the reach duel is fair, but walkers still ease toward `dir*spd` whenever not
winding/lunging/recovering (line 3151) — they nuzzle into your sprite between swings, so
there is no NEUTRAL, and neutral is where a dance happens. Enemies with an `atk` block do
no contact damage outside `act` (only atk-less enemies body-check, line 3172), so an enemy
standing off at range costs nothing mechanically and buys everything legibly.

**Hold-at-range**: while its swing is on cooldown, an armed enemy closes to ~70% of its
reach and WAITS there — visibly coiled, honestly out of your static reach, one step-in
away from your envelope, and one `acd` tick away from its own committed windup.

Walk branch, line 3151 — replace:

```js
if(!winding&&!lunging&&!recovering)e.vx+=(e.dir*e.spd*cm-e.vx)*Math.min(1,dt*6);
```

with:

```js
if(!winding&&!lunging&&!recovering){
 const hold=e.atk&&!e.boss&&e.acd>0&&d<atkReach(e.atk)*0.7+e.w/2&&Math.abs(dy)<60;
 e.vx+=((hold?0:e.dir*e.spd*cm)-e.vx)*Math.min(1,dt*6)}
```

Fly branch, line 3160 — the seek gains the same gate:

```js
else if(d<380&&d>0.001){
 const hold=e.atk&&!e.boss&&!ED.phase&&!ED.burrows&&e.acd>0&&d<atkReach(e.atk)*0.7+e.w/2;
 if(hold){e.vx*=0.95;e.vy*=0.95}
 else{e.vx+=(dx/d*e.spd*cm-e.vx)*dt*3;e.vy+=(dy/d*e.spd*cm-e.vy)*dt*3}}
```

Exclusions, each load-bearing:
- `!e.boss` — bosses stay relentless; their menace is pressure and suite-10 boss sims run
  hand-built enemies with `acd:99`.
- `!ED.phase && !ED.burrows` — wraith/burrower identity is "the wall is not a plan /
  nothing between you and it"; also suite-11 asserts the burrower CLOSES distance
  (test/suite-11.js:158) — holding would fail it.
- `e.acd>0` — the initiate branch (line 3143) is untouched: when the cooldown expires the
  enemy still commits from hold distance (0.7×reach+w/2 < the 0.85×reach+w/2 trigger, so
  it fires immediately). The 0.85 initiate factor itself is NOT changed.
- `Math.abs(dy)<60` (walkers) — never hold at the base of a ledge it should be pathing
  around.

Resulting standoffs (0.7×atkReach + e.w/2): crawler 45, bat 50, rockling 54, shieldman 51,
brute 55, delvemite 30 (swarms still crowd). Against the sword's 41px static / 49px
step-in envelope: a WAITING enemy is reachable only by committing the step — slide in,
strike, get out is now the literal geometry of neutral.

Deliberately NOT touched on the enemy side: every `atk` table row (all windups, act, rec,
cd, kb, all lunge speeds), the 78px grunt / 105px boss reach caps, `WINDUP_FLOOR`, all
`shoot` blocks. TTK/TTD are pure table math — unaffected. suite-11 checks re-verified:
bloomback trail test (`acd:99`, walks 200px→hold at ~53px, sheds the whole way) green;
lunge-commit test initiates from hold distance; frenzied cd-tick test measures `acd`
decay, not movement. NEW: suite-16 §E.

---

## 6. WHAT NOT TO TOUCH (the overreach fence)

| left alone | why |
|---|---|
| every enemy `atk` row: wind/act/rec/cd/range/lunge/kb | telegraph honesty + reach caps are suite-10 law; the fix is player-side |
| `WINDUP_FLOOR=0.26`, `RECOVER_DMG=1.25`, the 0.85 initiate factor | the contract the whole spec builds on |
| weapon `dmg`/`cd`/`arc`, all gem `mod`s | TTK bands (suite-10) and archetype spread (suite-13) are green; range-only changes keep them green |
| dodge: 0.22s roll / 0.55s cd / 0.30s i-frames / ×2.4 speed | the cd>iframe gap is the skill ceiling (comment at 3463) |
| `MOVE=170`, depth curves, `depthHP/depthDmg` | movement heaviness explicitly OK'd by the owner (brief §7) |
| hitstop/shake calibration (melee hit 0.045/0.30/0.012, no shake on hits) | rule 20 + suite-15 caps; nothing here adds a call |
| `aimVec()` / ranged aimassist / `aimRange()` | ranged already aims; only melee lacked it |
| `doMeleeAs` front-only bash | shield's directional identity |
| boss reach/patterns/`ph` tables, `shoot` blocks | out of scope; boss literacy comes free via §3.1 |
| touch overlay layout, KEYMAP codes | bindings were already right; only labels change |

---

## 7. CHANGE LEDGER (every number, one table)

| # | change | current → proposed | location (fn, ~line) | suite impact |
|---|---|---|---|---|
| 1 | sword range | 26 → 34 | GEAR, 762 | none read it; NEW 16§A |
| 2 | axe range | 24 → 32 | GEAR, 763 | NEW 16§A |
| 3 | greataxe range | 32 → 42 | GEAR, 771 | NEW 16§A (spacing law) |
| 4 | shield range | 20 → 26 | GEAR, 773 | NEW 16§A |
| 5 | `MELEE_STEP` const | — → 8 | CONSTANTS, ~239 | NEW 16§C |
| 6 | step-in fold | — → collideMove guarded | doMelee, after 2552 | NEW 16§C |
| 7 | overlap forgiveness | `d<12` → box overlap | doMelee, 2558 | NEW 16§B2 |
| 8 | `meleeAim()` helper + fang | face-only → aim matrix §2 | new fn ~2607; doMelee 2552 | NEW 16§B |
| 9 | spent punish bar | static tick → draining bar | render, 4718 | render-only; shots.js |
| 10 | endAct dust | — → burst 3 | upEnemies endAct, 3120 | PART-capped; NEW 16§D |
| 11 | dodge afterimage | — → 1 part/frame, guard 330 | upPlayer, 3413 | PART-capped; NEW 16§D |
| 12 | tips `fight/dodge/punish` | — → 3 hint() calls | 3143 / 3127 / endAct | NEW 16§F |
| 13 | GLYPH.kb mel/rng | LMB, RMB → LMB/J, RMB/K | GLYPH, 4391 | suite-8 green; NEW 16§F |
| 14 | hold-at-range | always-close → hold at 0.7×reach | upEnemies, 3151 & 3160 | 10§3, 11 re-verified green; NEW 16§E |

After implementing: `./test/run.sh` (all), `node test/browser.js`, `node test/shots.js`
(the punish bar and afterimage are FEEL — judge the screenshots), and `./design/audit.sh`
(GEAR ranges appear in CURRENT-STATE.md).

---

## 8. TEST PLAN — `test/suite-16.js` "THE DANCE" (+ add `16` to SUITES in test/run.sh)

Copy suite-10's harness shape (`OFF()`, `mkE`, `NOCRIT/NOARMOR`, A()). Reset
`META.hints={}`, `IN.manual=false`, `SET.aimassist=55` at the top; restore at the end.
All positions via `OFF()` + carved floor; `EN.length=0` and keep references (harness
traps). Assertions, precise enough to write directly:

**§A — reach & spacing law (static table math, live lookups like TTK's `toughestOf`):**
1. `GEAR.sword.range >= 34 && GEAR.sword.range <= 38` — the cashable-punish floor.
2. For every melee base `m`: `GEAR[m].range + MELEE_STEP + 7 < maxAtkReach(biome)` for
   every biome, where `maxAtkReach(biome)` = max `atkReach(ENEMIES[t].atk)` over the
   biome's rostered melee grunts (non-boss). (Live: greataxe envelope 57 < min-of-max 60 —
   shieldman's ruins. A roster change re-aims this automatically.)
3. `GEAR.sword.range + MELEE_STEP + 7 < atkReach(ENEMIES[t].atk)` for every band-defining
   grunt t in `[crawler, rockling, brute, shieldman, smith, hollowed, bloomback, wraith]`
   — the starter weapon out-ranges nothing that defines a band.

**§B — soft-aim:**
1. FLYER: sword equipped, `refreshAttacks()`. Bat via `mkE({type:'bat',w:12,h:10})` at
   `(P.x, P.y-28)`, `IN.x=0`, `IN.manual=false`, `P.mcd=0`, NOCRIT/NOARMOR. `doMelee()` →
   bat hp decreased (was unhittable: d 28 < range but 90° off a 50° half-arc).
2. OVERLAP: same bat at `(P.x+2, P.y-14)` (box overlap), `SET.aimassist=0` → `doMelee()`
   still hits (forgiveness is unconditional).
3. NEVER OVERRIDE: enemy at `(P.x-40, P.y)`, `IN.x=1`, `P.face=1` → `doMelee()` hits
   nothing, `P.face===1` after.
4. NEUTRAL SNAP: same enemy, `IN.x=0` → `doMelee()` hits, `P.face===-1` after.
5. MANUAL: enemy at `(P.x, P.y-30)`, `IN.manual=true`, `IN.aimX=0.05, IN.aimY=-1`,
   `IN.x=1` → `doMelee()` hits (cursor owns the swing even while moving).
6. ASSIST OFF: `SET.aimassist=0`, `IN.manual=false`, enemy at `(P.x-40,P.y)`, `IN.x=0` →
   no hit, no face change (today's behavior preserved exactly).

**§C — step-in:**
1. `IN.x=0`, no enemy in range, `P.face=1`, record `x0` → `doMelee()` → `P.x - x0 === MELEE_STEP`
   (±0.5 for collision rounding on open floor).
2. LUNGE GEM EXCLUSION: socket `lunge` (or set `ATK.melee.lunge=340` via a fitted item),
   record x0 → `doMelee()` → position unchanged this frame AND `P.vx === P.face*340` AND
   `P.inv >= 0.12`.
3. RETREAT NEUTRALITY: enemy at `(P.x-40)`, `IN.x=1` → step lands toward +x (away), never
   toward the enemy.
4. WALL: place solid tiles at `P.x+10` → `doMelee()` → player does not enter solid
   (`solidAt` check at the new position is false).

**§D — the punish is cashable (the headline sim):**
1. Spent crawler: `mkE({type:'crawler', w:14, h:12, atk:mkAtk(ENEMIES.crawler.atk),
   acd:99, rec:0.30, hp:1000, maxhp:1000})` at `(P.x+46, P.y)`. `IN.x=0`, NOCRIT,
   NOARMOR, `P.mcd=0`. `doMelee()` → hp delta ≈ `ATK.melee.dmg * RECOVER_DMG` (tol 2%) —
   **one swing from dodge-exit distance cashes the 1.25× punish** (46 − 8 step = 38 <
   34+7 envelope).
2. Same but `rec:0` → delta ≈ `ATK.melee.dmg` — the multiplier came from the window, not
   the reach.
3. FULL LOOP (integration): live crawler `acd:0` at engage distance, `P.inv=0` initially;
   run `upEnemies(DT)` until `e.wind>0`, assert wind observed; force-run until `e.rec>0`
   (suite-10 already owns the state machine — here assert only that at `rec` start a
   player at `e.x±46` with `IN.x=0` lands a hit within `ceil(rec/DT)` frames of calling
   `doMelee` once (mcd 0.38 < rec+wind margin — the window is humanly wide enough for one
   action).
4. AFTERIMAGE/DUST budgets: `PART.length=0`; `dodge()` + 14× `upPlayer(DT)` → `PART.length`
   in [10, 20]. `PART.length=0`; drive a crawler through act→rec via `upEnemies` →
   `PART.length >= 3` within 3 frames of `e.rec>0` first becoming true. Both stay < 350.

**§E — hold-at-range:**
1. Crawler `acd:1.2, spd:42` (real `mkEnemy`) at `(P.x+120, P.y)`, `P.inv=999`; run 300×
   `upEnemies(DT)` with acd pinned `e.acd=Math.max(e.acd,0.5)` each frame → final
   `d = |e.x-P.x|` in `[atkReach*0.55, atkReach*0.85]` (≈30–46 for crawler) and
   `|e.vx| < 30` — it approached, then WAITED, and never nuzzled into overlap.
2. Release: stop pinning, `e.acd=0` next frame → `e.wind>0` within 5 frames (the initiate
   branch is untouched and hold distance is inside the 0.85 trigger).
3. EXCLUSIONS: same setup with a hand-built `boss:1` crawler → it closes below
   0.55×reach (bosses never hold). Burrower via `mkEnemy` at +200 through rock (copy
   suite-11's rig) → still closes distance (suite-11's assertion stays green by
   construction, but assert it here too — it is this spec's exclusion).

**§F — surfacing:**
1. `GLYPH.kb.mel.indexOf('J') >= 0 && GLYPH.kb.rng.indexOf('K') >= 0` — the keyboard
   alternates are surfaced wherever `pr()` speaks.
2. `KEYMAP.mel.includes('KeyJ') && KEYMAP.rng.includes('KeyX')` — the keys the labels
   promise exist (regression lock).
3. Tips: `META.hints={}`; drive a crawler to windup within 240px → `META.hints.fight===1`.
   Drive a melee hit onto the player → `META.hints.dodge===1`. Drive act→rec within 240px
   → `META.hints.punish===1`. Each fires exactly once (second trigger leaves the count of
   toasts unchanged — assert via META.hints only; toast text belongs to browser.js).
   Restore `META.hints` and `SET`/`IN` state at suite end (META persists — harness trap).

Not testable in node (assert by eye in `test/shots.js` + `test/browser.js`): the punish
bar drains, the afterimage streak reads, the amber matches the interrupt family, prompts
show `LMB/J` on keyboard. Add one shots.js scene: player mid-dodge through a winding
crawler with a second spent crawler behind — the whole dance in one frame.
