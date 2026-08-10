# SPEC — MOVEMENT PROGRESSION · FINESSE · ONBOARDING (playtest findings 1–4)

Designed against: creative-brief.md, CURRENT-STATE.md, ref-systems.md, ref-story.md,
ref-world.md, ref-research.md, HANDOFF §3.6, and the live code at HEAD `3c446e9`
(`dodge()` index.html:3515, `upPlayer` dodge/hover path :3441–3512, `carve()` :1893,
`hint()` :3949, `upPickups` :3366, `doMelee` dig line :2583, touch cluster :228–232,
`maxFuel()` :2163, KEYMAP :4221). Where a number below cites a line it was read, not assumed.

**Save**: one shared bump, `SAVE_VER 2 → 3` (§6). New META fields: `tips{}`, `moves{}`,
`seen.gem{}`, `seen.uni{}`.

**New ids** (one namespace, collision-checked against GEMS/GEAR/UNLOCKS/ATTUNE/BOONS/TREE/
ECHOES/BOUNTIES/enemy ids/hint ids — zero grep hits for all): MOVES `draught airdash
wallkick glide longarm seamstep`; edge action `grap`; SFX `thunk dash`; tip ids `dig tour
collect` (all other tip ids are the ten existing hint ids, migrated, names kept); seen
buckets / codex kinds `gem uni`; DOM id `bGrap`.

---

## 1. THE MOVEMENT TRACK — six gaits, earned by deeds

Dead Cells rune model: permanent, meta-earned, never bought (they do NOT enter `UNLOCKS` —
suite-13's honest-shop check requires every UNLOCKS id to exist in GEMS/GEAR; gaits live in
their own table, like classes). Stored `META.moves[id]=1`.

### 1.1 The table — paste-ready

```js
// ============ MOVEMENT — GAITS ============
// Permanent movement, earned by deeds, never sold. The deed is the price.
// ck runs on a snapshot s={best,bosses,echo}; fx keys are read by moveFx() only
// ('fuel' adds, 'drain' multiplies). Input notes: airdash/seamstep ride DODGE,
// wallkick rides JUMP, longarm is the one new edge action ('grap').
const MOVES=[
 {id:'draught', n:'Long Draught', deed:'reach 150m',        ck:s=>s.best>=150,  fx:{fuel:20},
   d:'the tank holds more — +20 fuel'},
 {id:'airdash', n:'Air Step',     deed:'reach the Bloom',   ck:s=>s.best>=340,
   d:'dodge works in the air — once per airborne, back on landing'},
 {id:'wallkick',n:'Rebound',      deed:'fell your first Knot',ck:s=>s.bosses>=1,
   d:'jump against a wall to kick off it'},
 {id:'glide',   n:'Slow Burn',    deed:'reach the Forge',   ck:s=>s.best>=1540, fx:{drain:0.68},
   d:'hover burns a third less fuel'},
 {id:'longarm', n:'The Long Arm', deed:'fell three Knots',  ck:s=>s.bosses>=3,
   d:'a grapple line of your own — no gem, no focus'},
 {id:'seamstep',n:'Seamstep',     deed:'escape twice',      ck:s=>s.echo>=2,
   d:'your dodge passes through one tile of rock'},
];
function moveFx(k){let v=k==='drain'?1:0;
 for(const M of MOVES){if(!META.moves[M.id]||!M.fx||M.fx[k]===undefined)continue;
  v=k==='drain'?v*M.fx[k]:v+M.fx[k]}return v}
```

Deed snapshot: `s={best:Math.max(META.bestDepth||0,runDepth||0),
bosses:Object.keys(META.bosses||{}).length, echo:META.maxEcho||0}` — `bestDepth` only
updates at `die()` (:3523), so live `runDepth` must be folded in or a deed reached mid-run
would not grant until death.

`checkMoves(quiet)` — iterate MOVES; each unowned entry whose `ck(s)` passes: set
`META.moves[id]=1`, `saveMeta()`, and unless quiet: `toastQ(M.n.toUpperCase())`,
`toast('GAIT EARNED — '+M.d)` (interpolate `pr('dodge')`/`pr('grap')` where the d names an
input), `sfx('level')`, `flash(0.2)`, `UNLOCK_MSG.push('gait: '+M.n)` (death-screen line,
the sanctioned channel per ref-story §11). Call sites:
- `upPlayer`, after the `runDepth` update (:3503), throttled: only when `runDepth` has grown
  ≥25m past a `MOVE_CK` watermark (depth deeds);
- `killEnemy` boss branch, immediately after the `META.bosses[type]=1` write (:2835 area);
- `doEscape`, after the `maxEcho` write;
- `migrate()`/`loadMeta` tail with `quiet=1` (retroactive grants, §6).

### 1.2 Baseline hover — the modest start, exact numbers

Constants stay: `FLY_THRUST 2100` (must exceed GRAV 1500 — the shipped bug), `FLY_DRAIN 42`,
`FLY_REGEN 58`, `FLY_REGEN_AIR 8`, `FLY_VMAX -190`, `MOVE 170`, `JUMPV 430`. What changes:

| knob | today | new baseline | with gaits |
|---|---|---|---|
| base tank (`maxFuel()` :2163, `P` literal :2136) | 60 | **45** | 65 with `draught` |
| hover time from full | 1.43s | 1.07s | 1.55s (`draught`), 2.27s (`draught`+`glide`) |
| hover drain | 42/s | 42/s | ×0.68 = 28.6/s with `glide` |
| air dodge | free | **grounded/coyote only** | airborne, 1 charge, with `airdash` |

Edits: `maxFuel()` → `45+moveFx('fuel')+inc('fuel')` (Updraft +70 and Harness fuel ride on
top unchanged); hover drain line (:3479) → `P.fuel=Math.max(0,P.fuel-FLY_DRAIN*moveFx('drain')*dt)`;
`P` literal `fuel:45,maxfuel:45`. Sputter (:3477), heat (:3487), regen: untouched.
A veteran past 150m holds 65 ≥ 60 — never nerfed into the floor; a fresh save holds 45 for
roughly its first ten minutes and feels the first deed land. Forge heat 30/s now eats a
45-tank in 1.5s of standing — acceptable: `glide` does not reduce heat (heat is the band's
identity, drain is the gait's), and every player reaching the forge deed-owns `draught`.

### 1.3 The gaits, mechanically

**draught** — passive. No input. Fuel bar simply fills further (percent fill, no HUD edit).

**airdash** — rides the existing `dodge` edge action; zero new input on any device
(SHIFT / B / ○ / DODGE button). `dodge()` gains the gate: refuse when
`!P.onG && P.coyote<=0 && (!META.moves.airdash || !P.airDash)`. Airborne dodge consumes
`P.airDash` (set to 1 on landing and on a wall-kick); horizontal only, direction = held axis
else `P.face`; during it the existing dodgeT branch runs with `P.vx=P.face*ms*3.1`
(527 px/s × 0.22s ≈ 116px; ground roll stays `ms*2.4` ≈ 90px) and the existing
`P.vy=Math.min(P.vy,0)` (:3461) already floats it. Same cd 0.55, same i-frames. No vertical
dash — keeps the verb identical on thumb, stick and cursor (the move cluster owns direction
on all three; cursor aim deliberately not consulted — dodge is a movement verb).

**wallkick** — rides jump; zero new input. In `upPlayer`, AFTER the ground-jump block
(:3470) and BEFORE the hover block (:3478):
```js
 if(META.moves.wallkick&&P.jbuf>0&&!P.onG&&P.coyote<=0){
  const wd=solidAt(P.x+P.w/2+3,P.y)||solidAt(P.x+P.w/2+3,P.y-6)?1:
           solidAt(P.x-P.w/2-3,P.y)||solidAt(P.x-P.w/2-3,P.y-6)?-1:0;
  if(wd){P.vy=-JUMPV*0.92;P.vx=-wd*MOVE*1.6;P.face=-wd;P.jbuf=0;P.airDash=1;
   burst(P.x+wd*P.w/2,P.y,'#9fd0ff',5);sfx('swing',P.x)}}
```
vy −396, push 272 away, refreshes the air dash. No fuel cost, no kick cap: chaining needs
two facing walls, so open caverns still belong to fuel; two-wall shafts become the skill
route (and a fuel-free answer to forge heat in shafts — accepted, noted in §8). Jump buffer
already decays on real time (:3448) so hitstop doesn't stretch the kick window.

**glide** — passive drain multiplier, consumed at the one drain site. Thrust untouched, so
the jetpack FEEL (accel 600 px/s² net) is identical; only endurance grows.

**longarm** — the one NEW edge action, `grap`. Terrain-only grapple line: refactor the ray
march out of the `grapple` ability branch (:2335–2345) into `grapLine()` returning
`{hx,hy,hitTile,hitE}`; the gem branch keeps enemy-yank + shock (its edge), longarm calls
terrain-only: on `hitTile` — same yank numbers (`P.vx=dx/dd*620; P.vy=dy/dd*620-90;
P.noFall=max(,1.2); P.inv=max(,0.2)`), `GRAPPLE={x,y,t:0.25}` line render, cd `P.grapCd=3.5`
(new field, decays with the other cds at :3450; real time not needed — it is not a
forgiveness window); on miss `sfx('deny')`, `P.grapCd=0.5`. No focus. The Grapple GEM stays
strictly better for combat (enemy yank, 20fc/5s cd scaled by abilCdr) — longarm's value is
the freed armor socket. **Eight-place checklist (ref-systems §1.2):**
1. `EDGE` literal: `grap:0`.
2. `KEYMAP`: `grap:['KeyQ']` + its keydown dispatch line.
3. `pollPad()` unpaused branch: `if(edge(3))fire('grap')` — standard button 3 (Y / △).
   Suppressed while paused (no pause-menu meaning).
4. Touch: `<div class="tb" id="bGrap" style="display:none">GRAP</div>` inside the `#btns`
   thumb cluster, first row beside `bAbil` (:229 — inside the corner the thumb owns, legal);
   `bindBtn('bGrap',()=>fire('grap'))`; shown (`display:''`) only when `META.moves.longarm`,
   toggled in `refreshPrompts()`.
5. `GLYPH` all four sets: kb `'Q'`, xbox `'Y'`, ps `'△'`, touch `'GRAP'` (key name `grap`).
6. `readInput()`: `if(consumed('grap')&&META.moves.longarm)doGrap();` — consume
   unconditionally so an unearned press never queues.
7. `menuInput()` drain list: add `consumed('grap');`.
8. Prompts: the earn toast and the MOVEMENT panel interpolate `pr('grap')`;
   `refreshPrompts()` writes the bGrap label from `GLYPH.touch.grap`.

**seamstep** — passive dodge modifier. In the `upPlayer` dodgeT branch, before `collideMove`
(:3497): if the horizontal step is blocked, probe the wall: tile at
`P.x+P.face*(P.w/2+3)` solid at both `P.y-6` and `P.y+6`, tile one full TILE beyond air at
both rows, and neither wall tile `hard 9` → translate `P.x` to the far side
(`P.x += P.face*(TILE+P.w+4)` clamped to the first air column), `burst` both faces 3
particles each, `sfx('dig',P.x)`. Phasing, not carving — no `setTile`, no `carve`, the wall
survives (rule 3 untouched; terrain strand untouched). Exactly one tile, never bedrock.
Soft-gates 1-tile seams everywhere; secret caches (tile 10) stay reachable by anyone — this
opens AUTHORED thin walls, a hook the world spec may lean on (§8 note).

### 1.4 Where the track is shown

- Camp: new row in `openCamp()` between STARTING LOADOUT and THREAT:
  `MOVEMENT — ${Object.keys(META.moves).length}/6` → `openMoves()`.
- `openMoves()` — non-modal, `openPanel(h,false,openMoves)`, a stack of buttons per the menu
  law: owned rows enabled `${M.n} <span class="sub">${M.d}</span>`; unowned rows
  `<button disabled>??? <span class="sub">${M.deed}</span></button>` — the deed is SHOWN
  (codex philosophy :3957 — a map of what you have not done). Footer line, computed live:
  `DODGE — 0.22s roll · ${(0.30*(1+inc('iframes'))).toFixed(2)}s untouchable · 0.55s cycle`
  (makes c3 and iframe affixes visible — finding #4's "make its upgrades visible").
  Header sub: `Not bought. Taken.`
- Mid-run: the §1.1 celebration (toastQ + toast + level sfx + flash). Non-modal by
  construction; boss-kill deeds fire after the fight ends by definition.

---

## 2. DODGE FEEL (finding #4) — against the real implementation

The real dodge: `dodge()` :3515 — dodgeT 0.22, cd 0.55, `P.inv=max(inv,0.30*(1+inc('iframes')))`,
`burst(#ffffff50,5)`, `sfx('swing')`, `RUNM.dodgeBlast` rider. Roll movement + a 13-particle
streak live in the `upPlayer` dodgeT branch (:3461–3463). c3 tree node (:1024) feeds
`inc('iframes')` +0.15 → 0.345s. All additions below: **zero `addShake` calls**, hitStop
inside the §5.2 calibration table, particles untouched (suite-16 pins the streak at 10–25).

1. **Afterimages** (render-only, no particles): in the player draw path (:4828 area), while
   `P.dodgeT>0` draw 3 trailing ghosts via the existing
   `drawEntityTinted(ctx,'player',x-P.face*10*k,y,P.h,P.face,pf,'#9fd0ff',0.42-0.12*k)`
   for k=1..3. No state mutation, no RNG (fixed offsets), falls back with the rect
   fallback like everything in `drawEntity`.
2. **I-frame flash**: while `P.dodgeT>0`, tint the player cyan
   (`drawEntityTinted(...,'#9fd0ff',0.5)`) — distinct from the post-hit white flicker which
   keys on `P.inv>0.45` (:4837). The player can now SEE the untouchable beat.
3. **Perfect dodge**: in `hurtPlayer` (:2878), before the `if(P.inv>0||P.dead)return;`
   early-out: `if(P.inv>0&&P.dodgeT>0&&!P.pd&&dmg>0){P.pd=1;gainFocus(8);
   burst(P.x,P.y,'#9fd0ff',8);sfx('block',P.x);hitStop(0.05,0.35,0.012)}` — an attack
   swallowed by your roll pays 8 Focus (FOCUS_HIT — modest, and c3/iframe gear widen the
   window, so the meta node buys finesse economy too), once per roll (`P.pd=0` set in
   `dodge()`). hitStop 0.05/0.35/0.012 sits between landing-a-hit (0.045) and taking one
   (0.15) — suite-15's "taking stops harder than dealing" ordering is preserved. The
   enemy-side landed-hit detector (`before=P.inv … if(P.inv>before)` :3161) is untouched —
   inv does not rise on the early-out path. Backdraft (`RUNM.dodgeBlast`) unchanged and now
   visibly a perfect-dodge-adjacent build hook.
4. **Cancel windows**: (a) roll-cancel — `dodge()` adds `P.mcd=Math.min(P.mcd,0.12);
   P.rcd=Math.min(P.rcd,0.12)` — dodging forgives weapon recovery beyond 0.12s (heavy swing
   → roll → swing tempo; rewards timing, adds zero damage); (b) dodge-jump — in the dodgeT
   branch: `if(P.dodgeT<0.12&&P.jbuf>0)P.dodgeT=0` — the roll's tail can be cancelled into
   a jump/hover (i-frames keep their remainder; jbuf already real-time).
5. **Sound**: new SFX entry `dash:{w:'sawtooth',f:340,f2:90,d:.12,g:.18}`; `dodge()` plays
   `sfx('dash')` instead of `'swing'` (a dodge should not sound like an attack).

---

## 3. ONBOARDING — THE TIPS SYSTEM (findings #1–2)

One table, one queue, riding the existing toast machinery. Replaces the ten scattered
`hint()` call sites (ids kept, so veterans' `META.hints` migrate 1:1 into `META.tips` and
nothing re-fires). Copy for `tour`/`collect` and any wording poilsh is OWNED BY THE STORY
SPEC — lines below are placement drafts in the fragment voice (terse, second person, no
exclamation marks).

### 3.1 The table — paste-ready

```js
// ============ TIPS ============
// ev = named hook; when = predicate over live state AT that hook; msg deferred so pr()
// reads the current device (rule 11). Once per save (META.tips, flagged at SHOW time),
// deferred while a boss is near, dismissed by any edge action or attack press.
const TIPS=[
 {id:'move',   ev:'run',   when:()=>!META.runs, msg:()=>`${pr('move')} to move · ${pr('jump')} to jump — hold it in the air`},
 {id:'fight',  ev:'near',  msg:()=>`Strike ${pr('mel')} · shoot ${pr('rng')} · dodge ${pr('dodge')}`},
 {id:'dodge',  ev:'hurt',  when:c=>c.srcX!==undefined, msg:()=>`${pr('dodge')} rolls THROUGH an attack — you are untouchable for a beat`},
 {id:'punish', ev:'spent', msg:()=>'It is SPENT — the amber bar is your window. Strike now'},
 {id:'dig',    ev:'nodig', when:c=>c.blocked>0, msg:()=>'This tool does not dig stone. Stone wants dig 1 — an Axe has it'},
 {id:'hover',  ev:'jump',  msg:()=>'Hold jump in the air to hover — the blue bar is fuel'},
 {id:'socket', ev:'gem',   msg:()=>`Open the bag (${pr('bag')}) and socket that gem — colors must match`},
 {id:'lattice',ev:'sigil', msg:()=>`Open the lattice (${pr('pause')} → THE LATTICE) to rewrite the world`},
 {id:'heat',   ev:'dry',   msg:()=>'The forge burns your fuel. Updraft and the harness carry more'},
 {id:'depth',  ev:'band',  when:c=>c.bn!=='surface', msg:()=>'Deeper enemies hit harder and drop far more. Anchors let you start here'},
 {id:'camp',   ev:'camp',  msg:()=>`At camp — ${pr('camp')} to spend shards`},
 {id:'tour',   ev:'shop',  msg:()=>'Most of what can drop is still buried in the pool below. Unlocks are forever'}, // copy: story spec
 {id:'collect',ev:'unique',msg:()=>'The codex keeps a collection. What you have seen, and the shape of what you have not'}, // copy: story spec
];
```

### 3.2 Machinery

```js
let TIP=null,TIPQ=[];
function bossNear(){for(const e of EN)if(e.boss&&e.hp>0&&Math.hypot(e.x-P.x,e.y-P.y)<560)return true;return false}
function tipEv(ev,ctx){if(!SET.hints)return;
 for(const T of TIPS){if(T.ev!==ev||META.tips[T.id]||(T.when&&!T.when(ctx||{})))continue;
  if(TIPQ.indexOf(T.id)<0)TIPQ.push(T.id)}}
function upTips(){if(TIP||!TIPQ.length||paused||bossNear())return;
 const id=TIPQ.shift(),T=TIPS.find(t=>t.id===id);
 if(!T||META.tips[id])return;
 META.tips[id]=1;saveMeta();TIP={id,t:7};toast(T.msg(),1)}   // flag at SHOW time
```

- `upTips()` runs once per frame from `sim()` (beside `upVents`). Non-modal by construction
  — never a panel, never pauses.
- **Never during a boss fight**: `bossNear()` (any live `boss:1` within 560px — the boss
  telegraph range +80) defers the queue; the tip lands when the arena is done. Flagging at
  show time means a deferral lost to death simply re-queues on the next trigger.
- **Dismiss on any input**: `toast(msg,hold)` — second arg keeps the toast up (no auto-fade)
  until `TIP.t` (7s) expires or `readInput()` clears it: after its dispatch block, if `TIP`
  and any edge action was consumed this frame OR `HELD.mel/rng` newly pressed → `TIP=null`
  plus the toast fade. Plain movement does NOT dismiss (a tip must survive walking).
- `SET.hints=0` kills the whole system at `tipEv` (existing SETTINGS row, suite-15's
  accessibility list unchanged).
- `hint(id,text)` survives as a one-line shim writing `META.tips` (other in-flight specs
  may call it): `if(!SET.hints||META.tips[id])return;META.tips[id]=1;saveMeta();toast(text)`.
  `META.hints` itself is retired (migrated, §6).

### 3.3 Hook sites — the exact functions

| ev | fires from | replaces |
|---|---|---|
| `run` | `startRun()` tail (:3946) | inline `hint('move',…)` |
| `near` | enemy-proximity site :3180 | `hint('fight',…)` |
| `spent` | recovery-window site :3154 | `hint('punish',…)` |
| `hurt` | `hurtPlayer()`, after `P.hp-=dmg` (:2892), ctx `{srcX}` — `when` excludes fall damage (no srcX) | `hint('dodge',…)` at :3163 (delete both call sites) |
| `nodig` | `doMelee()` after the carve line :2583, ctx `{blocked:CARVE_BLOCK}` (§4) | — new |
| `jump` | ground-jump block :3470 | `hint('hover',…)` |
| `gem` | `upPickups` gem branch :3379 | `hint('socket',…)` |
| `sigil` | `upPickups` sigil branch :3377 | `hint('lattice',…)` |
| `dry` | forge-heat site :3488 (keep its `chance(dt*1.5)` throttle) | `hint('heat',…)` |
| `band` | `upPlayer` band site :3506, ctx `{bn}` | `hint('depth',…)` |
| `camp` | camp-regen site :4931 | `hint('camp',…)` |
| `shop` | first render of `openCamp()` (:4017) | — new (the unlock-pool tour line) |
| `unique` | `upPickups` gear branch, inside the `rarity>=3` arm (:3384) | — new |

---

## 4. DIG FEEDBACK (finding #2)

1. **The blocked-carve report.** `carve()` (:1893) gains two module globals, per-call
   scratch, read-immediately contract (the very next line after your own carve call —
   `explode`/`projStrike` also carve and will overwrite them):
   `let CARVE_BLOCK=0,CARVE_BED=0;` — zeroed at carve entry; in the skip branch
   `if(T.hard>maxHard||T.hard>=9){if(T.hard>=9)CARVE_BED++;else CARVE_BLOCK++;continue}`.
   Return value unchanged; every existing caller unaffected.
2. **Spark + thunk.** In `doMelee`, immediately after :2583, gated so it reads as "I tried
   to dig and was refused", not combat noise:
   ```js
   if(!cut&&!hit&&(CARVE_BLOCK||CARVE_BED)&&perf>(P.thunkT||0)){P.thunkT=perf+0.5;
    const hx=P.x+P.face*a.range*0.8;burst(hx,P.y,'#e8e2c9',3);sfx('thunk',hx);
    if(CARVE_BLOCK)tipEv('nodig',{blocked:CARVE_BLOCK})}
   ```
   `!hit` = the swing struck no enemy (a wall swing, deliberate); 0.5s rate limit; 3
   particles (PART 350 cap untouched); bedrock sparks but never tips (no tool exists — the
   tip must not lie). New SFX entry `thunk:{w:'square',f:90,f2:45,d:.07,g:.3}` — dull,
   distinct from `dig` (120→70, .05).
3. **Dig power on item cards.** Helper, honest against unique mods (Worldbreaker digs 3 on
   a dig-2 base, Bulwark digs 1 on a dig-0 shield):
   ```js
   function digOf(it){const b=GEAR[it.base];
    const a={dmg:0,more:1,cd:1,range:0,arc:0,kb:0,dig:b.dig||0,st:null,leech:0,pierce:0,explode:0};
    const u=it.unique&&uniqueDef(it.unique,it.alt);if(u&&u.mod)u.mod(a);return a.dig||0}
   ```
   (Stub carries every field the 24 shipped mods touch; a future mod referencing a missing
   field extends the stub.) Shown on every melee/shield card — `openBag` slot rows (:3684),
   bag gear rows (:3690), `itemMenu` (:3699) — appended to the sub: `· dig ${digOf(it)}`.
   Shown even at 0: the sword saying `dig 0` IS the lesson.
4. **One-time tip** — `dig` in the TIPS table, fired only from the refused-carve hook, names
   the tool. Finding #2's third leg (the starter path to an Axe) belongs to the economy/camp
   spec; this spec makes the need legible.

---

## 5. COLLECTION VIEW (finding #1)

Codex gains a discovery-progress wing. Buttons-only, reads live tables + `META.seen`, no new
save data beyond two seen buckets that the audit showed MISSING (ref-story bucket list is
`en item biome frag cls sigil diss`):

- **`seen.gem`** — nothing records gems today. New quiet call sites:
  `discover('gem',k.id,true)` in the `upPickups` gem branch (:3378) and
  `discover('gem',CLASSES[cls].gem.id,true)` where `newRun()` sockets the signature gem
  (:3521 per ref). Fusion changes tier, not id — no-op by design.
- **`seen.uni`** — :3385 records a PRIMARY unique under the plain base key, identical to a
  common drop; found-uniques are indistinguishable from seen-bases. New quiet call site
  beside it: `if(k.item.unique)discover('uni',k.item.base+(k.item.alt?'#2':'#1'),true)`.
  The existing `item` write stays (bases-seen keeps working; `'#2'` keys keep alt art).
- Also: `newRun()` marks the three starting-kit bases `discover('item',base,true)` — the
  gear in your hands on run one must not read as undiscovered.
- Registration (per ref-story §12 "new codex category", minimum footprint): both buckets in
  the `META.seen` literal (:1932), in `loadMeta`'s belt-and-braces bucket list, and
  `codexTitle` branches (`'gem'`→`GEMS[id].n`, `'uni'`→`uniqueDef(id.slice(0,-2),id.slice(-1)==='2').n`)
  for safety even though all calls are quiet. No `loreEntry` branch — collection rows carry
  no prose pages.

**`openCodex()`** (:3960) gains one button after DELVERS:
`COLLECTION <span class="sub">what the deep has shown you</span>` → `openCollection()`.
Headline percentage unchanged (browser.js expectations stay stable).

**`openCollection()`** — `openPanel(h,false,openCollection)`, a stack of buttons:
```
COLLECTION            (h2; sub: counts line)
GEAR — a/12 bases         → collList('base')
UNIQUES — b/24            → collList('uni')
GEMS — c/77               → collList('gem')
BESTIARY — d/31 <sub>met on first kill</sub>   → openCodexList('en')   (existing screen)
BACK
```
Counts: `a` = keys of `META.seen.item` that contain no `#` and exist in `GEAR`;
`b` = keys of `META.seen.uni`; `c` = keys of `META.seen.gem`; `d` = keys of `META.seen.en`.
Totals from the tables (`Object.keys(GEAR).length`, 2×|UNIQUES| (every base has a UNIQ2
alt), `Object.keys(GEMS).length`, `Object.keys(LORE.enemy).length`).

**`collList(kind)`** — rows in the codex seal idiom (`???` rows leak their shape on
purpose, :3957):
- `base`: per GEAR id — seen: `${G.n} <sub>${G.slot}${G.dig?' · dig '+G.dig:''}</sub>`;
  sealed: `??? <sub>${G.slot}</sub>`.
- `uni`: per GEAR id with a UNIQUES entry, two rows (`#1`,`#2`) — seen:
  `${U.n} <sub>${U.d}</sub>`; sealed: `??? <sub>${GEAR[id].n}</sub>` (the base leaks — you
  learn WHERE to hunt).
- `gem`: per GEMS id — seen: `◆ ${G.n} <sub>${G.t} · ${SOCK[G.col||'r'].n}</sub>`; sealed:
  `??? <sub>${G.t} · ${SOCK[G.col||'r'].n}</sub>` (type+color leak — the D2 grid effect: 77
  sockets-shaped holes you can count).
All rows `<button disabled>` (display list — no lore pages behind them); BACK enabled.
Dpad-navigable by the existing focus cursor; nothing but buttons (menu law).

---

## 6. SAVE MIGRATION — SAVE_VER 2 → 3 (shared bump)

`migrate()` appends (old blocks kept, per rule 2):
```js
 if(m.ver<3){
  m.tips=Object.assign({},m.hints||{});                     // shown-once history survives
  m.moves={};
  m.seen=m.seen||{};m.seen.gem={};m.seen.uni={};
  for(const k in (m.seen.item||{}))if(k.slice(-2)==='#2')m.seen.uni[k]=1;  // alt uniques recoverable
  for(const g of DEFAULT_GEM_POOL)m.seen.gem[g]=1;
  for(const k in (m.unlocks||{}))if(GEMS[k])m.seen.gem[k]=1; // a bought gem is a known gem
  m.ver=3}
```
`loadMeta` belt-and-braces: `META.tips=META.tips||{}`, `META.moves=META.moves||{}`, extend
the seen-bucket list with `'gem','uni'`; then `checkMoves(1)` — **retroactive deeds**: a
veteran's `bestDepth`/`bosses`/`maxEcho` grant every gait already earned, silently.
bestDepth 340 → draught+airdash (air dodge never lost); 1540 → +glide; 1 boss → wallkick;
3 bosses → longarm; 2 escapes → seamstep. Fuel: 45+20=65 > 60 for anyone past 150m. The
only unrecoverable history: PRIMARY uniques found before v3 (recorded as bare base keys) —
those collection rows re-seal until re-found. Named as a risk, accepted: no honest
reconstruction exists.

---

## 7. TEST-SUITE EDITS — the complete list

1. **`test/run.sh`**: `SUITES` gains `17` (16 is already THE DANCE).
2. **NEW `test/suite-17.js`** — movement/tips/dig/collection. Assertions:
   - MOVES: 6 entries; ids unique AND absent from GEMS/GEAR/UNLOCKS/ATTUNE/BOONS/TREE;
     every entry has `n,d,deed,ck`; every `fx` key ∈ {fuel,drain}.
   - Grants: empty META → no gaits; snapshot best 340 → draught+airdash; best 1540 → +glide;
     bosses 3 → wallkick+longarm; echo 2 → seamstep; `checkMoves` idempotent; celebration
     writes `UNLOCK_MSG` exactly once per gait.
   - Fuel: `maxFuel()===45` bare; `65` with draught; 60 hover frames with glide drain
     ≈0.68× the drain without (measure fuel deltas, not wall time — Date.now is pinned).
   - Airdash: grounded dodge works without the gait; airborne dodge (`P.onG=false,coyote=0`)
     refuses without it, fires with it, consumes `P.airDash`, second refuses until landing;
     `P.vy` clamped ≤0 during; `shake===0` after any dodge; i-frames
     `===0.30*(1+inc('iframes'))`.
   - Wallkick: airborne + wall + `P.jbuf` → `P.vy===-JUMPV*0.92`, vx sign away, face
     flipped, fuel unchanged, `P.airDash===1`; no wall → no kick; no gait → no kick.
   - Longarm: `EDGE.grap` exists; `GLYPH.kb/xbox/ps/touch` all carry `grap`;
     `fire('grap')`+`readInput()` is a no-op without the gait; with it, a carved wall in aim
     direction yanks (vx/vy set, `noFall>0`, no focus spent) and `P.grapCd` blocks reuse;
     `menuInput()` drains a queued grap (press in a panel, close, nothing fires).
   - Seamstep: dodge into a 1-tile stone wall with air beyond crosses it AND the wall tiles
     are unchanged (phasing, not carving — assert `getTile` before/after); a 2-tile wall
     blocks; bedrock always blocks.
   - Dodge feel: `dodge()` clamps `P.mcd/P.rcd` to ≤0.12; perfect dodge — `hurtPlayer`
     during dodge i-frames leaves `P.hp` untouched, grants exactly +8 focus once per roll,
     and its `HS.t` after is LESS than after an unblocked real hit.
   - TIPS: table ids unique; `tipEv` dead at `SET.hints=0`; first fire queues → one
     `upTips()` shows and writes `META.tips` (at show time); repeat never re-queues; a live
     boss at 400px defers (flag unset, queue holds), shows after `EN.length=0`; dismissal
     path clears `TIP`.
   - Dig: `carve(stone, maxHard 0)` returns 0 with `CARVE_BLOCK>0`; dirt → `CARVE_BLOCK===0`;
     bedrock → `CARVE_BED>0, CARVE_BLOCK===0`; sword swing at a stone wall, no enemy →
     `nodig` queued; axe swing carves and doesn't; `digOf`: sword 0, axe 1, greataxe 2,
     Worldbreaker 3, Bulwark 1.
   - Collection: buckets exist; gem pickup writes `seen.gem`; unique pickup writes
     `seen.uni['<base>#1'|'#2']` AND still writes `seen.item`; count helpers match bucket
     sizes. (Suite gotchas apply: `EN.length=0` first, carve a floor, `P.noFall=1` after
     teleports, reset `META.echoLv/maxEcho/threat` at block end.)
3. **`test/pwa.js`**: ver literals `2`→`3` (:100, :120); v1-blob block additionally asserts
   `tips/moves/seen.gem/seen.uni` exist. ADD a v2-blob block (`bestDepth:1600`,
   `bosses:{warden:1,sporemother:1,sentinel:1}`, `hints:{socket:1}`,
   `seen:{item:{'plate#2':1,axe:1},…}`, `unlocks:{fireball:1}`) asserting: ver 3;
   `moves.draught/airdash/glide/wallkick/longarm` granted, `seamstep` NOT;
   `tips.socket===1`; `seen.uni['plate#2']===1`; `seen.gem.fireball===1` and
   DEFAULT_GEM_POOL seeded.
4. **`test/suite-16.js`**: (a) :219 `META.hints.dodge` → `META.tips.dodge`, and pump
   `upTips()` (one call, no boss present) between the hit and the assert; (b) every section
   that calls `dodge()` directly (:154 afterimage count, the D-section punish spacings) sets
   `P.onG=true` first and clears `META.moves` at suite start — air dodge is now gated.
   Afterimage particle band [10,25] needs NO change (ghosts are render-only).
5. **`test/browser.js`**: assert `#bGrap` present and hidden on a fresh save; visible after
   `META.moves.longarm=1;refreshPrompts()`. Assert the codex shows the COLLECTION button.
6. **`test/suite-6.js`**: no edits — its fuel asserts are relative (`maxFuel()>base`,
   `base+60` vs Updraft's +70 still true at base 45). Run it to confirm.
7. **Suites 2/8/15**: no edits expected — 15's SETTINGS/shake/hitstop lists untouched (new
   hitStop call obeys the ordering it asserts); 8's discovery tests don't enumerate buckets.
   Run all suites regardless (rule 9).

---

## 8. RISKS / NOTES FOR SIBLING SPECS

- **Air-dodge is newly gated.** Sub-340m veterans lose airborne dodge until they re-reach
  the Bloom (one run). Judged acceptable; the alternative (grandfathering) makes the deed
  meaningless. Flagged for the changelog line on the death screen.
- **Primary-unique collection history is lost** for v2 saves (§6) — rows re-seal.
- **Wallkick vs forge heat**: two-wall shafts are now climbable at zero fuel, softening the
  forge's resource identity in exactly those shafts. Watch suite-14's band-identity feel in
  playtest 2; if it reads as a bypass, the forge fix is geometry (wider shafts), not a gait nerf.
- **`CARVE_BLOCK` is per-call scratch** — read it on the line after your own `carve()` call,
  never later; `explode`/projectile digs overwrite it.
- **Pad button 3 (Y/△)** for grap assumes the standard-mapping index used by `pollPad`'s
  `edge()` helper — verify against the shipped helper before wiring.
- **Story spec owns**: final copy for `tour`/`collect` tips and any polish on MOVES `d`
  strings/celebration lines. **World spec may lean on**: airdash (+~116px horizontal reach),
  wallkick (2-wide chimneys), seamstep (authored 1-tile seams) as soft-gates for optional
  pockets — the way vaults gate on dig. No new POIs are specced here.
- **Deliberately out of scope** (brief: deepen, don't invent): no new meta currency, no
  movement shrine, no stamina; the track reads existing META fields only.
