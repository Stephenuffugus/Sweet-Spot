# SHARDFALL systems reference — FEEL / INPUT / RUNTIME plumbing

Ground truth extracted from `/workspaces/Sweet-Spot/shardfall/index.html` (line numbers are from that
file as of commit 3c446e9) and `/workspaces/Sweet-Spot/shardfall/test/suite-15.js`. This is the
contract for anyone adding content that touches input, hazards, statuses, buffs, feel (hitstop/shake),
Focus, projectiles, summons, or audio. CLAUDE.md hard rules referenced by number.

---

## 1. Input abstraction (lines 4130–4465)

**Law (rule 10):** devices write intent; `readInput()` (line 4339) turns intent into game actions
exactly once per frame, *before* `sim()`. A `keydown` handler that calls a gameplay function directly
is a bug — it will fire while paused and behind menus.

### 1.1 The three layers

```js
const IN={x:0,tx:0,aimX:1,aimY:0,manual:false};          // resolved axis + aim vector (line 4138)
const HELD={mel:false,rng:false,jmp:false};              // continuous held state (line 4139)
const EDGE={dodge:0,abil:0,bag:0,camp:0,map:0,pause:0,confirm:0,cancel:0,navU:0,navD:0,navL:0,navR:0};
function fire(a){EDGE[a]=1}                              // one-shot press (line 4144)
function consumed(a){const v=EDGE[a];EDGE[a]=0;return v} // read-and-clear (line 4145)
```

- **Held actions (3):** `mel`, `rng`, `jmp`. Read by `sim()` (`HELD.mel` → `doMelee()` etc., lines
  4858–4862) and by `upPlayer` (`HELD.jmp` → hover). Shield semantics live in `sim()`: hold =
  block, tap-release ≤ 0.18 s = bash.
- **Edge actions (12):** `dodge`, `abil`, `bag`, `camp`, `map`, `pause`, `confirm`, `cancel`,
  `navU`, `navD`, `navL`, `navR`. These are the ONLY valid arguments to `fire()`/`consumed()`.
- `IN.x` is the movement axis, resolved per device inside `readInput()`: pad → `IN.padX`, touch →
  `IN.tx`, keyboard → `kbAxis()`. `IN.aimX/aimY` + `IN.manual` carry aim; manual aim expires 1.5 s
  after the last mouse/right-stick input (line 4351).
- Jump is special: the keydown/pad/touch handlers set `P.jbuf=0.12` (jump buffer) directly *and*
  `HELD.jmp=true` (lines 4184, 4286, 4312). That is the sanctioned exception, not a pattern to copy.

`readInput()` dispatch (lines 4352–4364): if `paused` → `menuInput()` and return; else
`consumed('dodge')→dodge()`, `consumed('abil')→useAbility()`, `consumed('bag')→openBag()`,
`consumed('camp')→openCamp() if nearCamp()`, `consumed('map')` → minimap toggle / double-press
(< 0.45 s) full map, `consumed('pause')→openPause()`; then it *drains* `confirm/cancel/navU/navD/navL/navR`
unconditionally so they never queue.

`menuInput()` (line 4375) drains **every** gameplay edge action while a panel is open:
`consumed('dodge');consumed('abil');consumed('bag');consumed('camp');consumed('map');`
— comment at line 4380: returning early left them queued, so a key pressed in a menu fired the moment
the menu closed.

### 1.2 Adding a NEW edge action — every place the name must appear

1. `EDGE` object literal (line 4143) — add `myact:0`.
2. `KEYMAP` (line 4170) — add `myact:['KeyG']` (KeyboardEvent **codes**, not characters), and a
   `if(KEYMAP.myact.includes(e.code))fire('myact');` line in the keydown handler (lines 4187–4192).
3. `pollPad()` — a `if(edge(PAD.__))fire('myact');` line in the **unpaused** branch (lines 4279–4286);
   decide what it does (or is suppressed) while `paused`.
4. Touch — a `<button>` in the HTML overlay plus `bindBtn('bMyact',()=>fire('myact'))` (line 4309ff),
   or an ordinary `.addEventListener('click',()=>fire('myact'))` like `bagBtn` (line 4317). Rule:
   the thumb owns the bottom-right corner; nothing else may live there.
5. `GLYPH` — a label in **all four** device sets (`kb`, `xbox`, `ps`, `touch`, lines 4390–4395).
   `pr()` falls back to `a.toUpperCase()` if missing, which will show "MYACT" on a PlayStation pad.
6. `readInput()` — the actual dispatch `if(consumed('myact'))doMyThing();` (lines 4353–4363).
7. `menuInput()` — add `consumed('myact');` to the drain list (line 4382) or the press queues
   behind panels and fires on close.
8. Any on-screen prompt for it goes through `pr('myact')` (rule 11). If it has a touch button,
   also wire `refreshPrompts()` (line 4397) so the label follows `INMODE`.

### 1.3 GLYPH — verbatim (lines 4390–4396)

```js
const GLYPH={
 kb:   {jump:'SPACE',mel:'LMB',rng:'RMB',dodge:'SHIFT',abil:'F',bag:'E',camp:'C',map:'M',pause:'ESC',confirm:'ENTER',cancel:'ESC',move:'WASD',aim:'MOUSE'},
 xbox: {jump:'A',mel:'X',rng:'RT',dodge:'B',abil:'LT',bag:'BACK',camp:'R3',map:'L3',pause:'START',confirm:'A',cancel:'B',move:'L-STICK',aim:'R-STICK'},
 ps:   {jump:'✕',mel:'□',rng:'R2',dodge:'○',abil:'L2',bag:'SHARE',camp:'R3',map:'L3',pause:'OPTIONS',confirm:'✕',cancel:'○',move:'L-STICK',aim:'R-STICK'},
 touch:{jump:'JUMP',mel:'MEL',rng:'RNG',dodge:'DODGE',abil:'ABIL',bag:'BAG',camp:'CAMP',map:'MAP',pause:'❚❚',confirm:'TAP',cancel:'BACK',move:'STICK',aim:'AUTO'},
};
function pr(a){const set=INMODE==='pad'?GLYPH[PADTYPE]:GLYPH[INMODE]||GLYPH.kb;return set[a]||a.toUpperCase()}
```

- Keys are **action names** (note `jump`, not `jmp` — the GLYPH key and the HELD key differ for jump).
  `move` and `aim` are pseudo-actions that stand for the whole direction cluster.
- `PADTYPE` is `'ps'` if the gamepad id matches `/dualshock|dualsense|playstation|sony|054c/`, else
  `'xbox'` (line 4235). `INMODE` ∈ `'kb' | 'pad' | 'touch'` tracks the last device actually used.
- Usage in content: **every** user-facing prompt string interpolates `pr('action')`, e.g.
  `` hint('socket',`Open the bag (${pr('bag')}) and socket that gem — colors must match`) `` (line 3331).
  Hard-coding "press E" is a bug on a controller (rule 11).

Settings that live beside input (`SET_DEF`, line 4148, persisted in `META.set`):
`{vol:22,shake:100,hitstop:100,flashes:100,dmgnum:1,aimassist:55,autoaim:1,deadzone:22,rumble:1,hints:1}`.
`prefers-reduced-motion` sets `shake=0, flashes=25, hitstop=40` once, only on a save that never chose
(lines 4154–4155).

---

## 2. The HAZ system (rule 19; lines 2101–2105, 3288–3306)

**Law:** area denial is a `HAZ` entry, not a projectile. Boss shockwaves, fire trails, spore clouds,
biome vents and the player's Crucible are all the same object.

### 2.1 Signatures and object shape

```js
// kind: 'cloud' (soft, drifts) | 'fire' (bright, burns) | 'shock' (hard edge, brief) | 'gas'   (line 3288)
function addHaz(x,y,r,t,dmg,st,col,friendly,kind){
 if(HAZ.length>=HAZ_MAX)HAZ.shift();
 HAZ.push({x,y,r,t,life:t,dmg:dmg||0,st:st||null,col:col||'#c98fe0',friendly:friendly?1:0,
  tickT:0,kind:kind||'cloud'})}
```

| param | meaning | units / legal values |
|---|---|---|
| `x,y` | center, world px | — |
| `r` | radius, px | player-vs-enemy checks add `e.w/2`; player check is bare `< h.r` |
| `t` | lifetime, seconds | `life` keeps the original for render fade |
| `dmg` | damage **per tick** (one tick every 0.35 s) | `dmg<=0` ⇒ pure marker: paints, never touches (line 3297). `'mark'` uses this |
| `st` | status object applied each tick, e.g. `{burn:6}` — potencies are absolute, see §3 | `null` for none |
| `col` | CSS color for render + particles | default `'#c98fe0'` |
| `friendly` | truthy ⇒ player-owned, ticks **enemies**; falsy ⇒ hostile, ticks the **player** | stored as 1/0 |
| `kind` | render + particle style; also a fifth value `'mark'` (artillery telegraph) | `'cloud'|'fire'|'shock'|'gas'|'mark'` |

- `HAZ_MAX = 64` (line 2105). Overflow **shifts** (oldest dies), never refuses.
- `upHaz(dt)` (line 3293): decrements `t`, ticks every `0.35` s. Friendly: `hurtEnemy(e,h.dmg,0,h.col,h.st,true)`
  for every enemy with center within `h.r+e.w/2` — note `chained=true`, so hazard ticks never trigger
  shock-chain or Tether splash. Hostile: `hurtPlayer(h.dmg,false,h.x)` + `applyStatus(P,h.st,true)` if
  the player is within `h.r`. **hurtPlayer's own i-frames (0.7 s) rate-limit hostile hazards** — standing
  in fire costs ~one hit per 0.7 s, not one per tick (comment lines 3301–3302). Friendly hazards have
  no such limit; enemies eat every 0.35 s tick.
- Particles: `'fire'` spawns at `chance(dt*26)` rising; others `chance(dt*14)` drifting, gated on
  `PART.length<300`.
- Friendly-fire rules: friendly hazards never touch the player; hostile never touch enemies. The only
  self-harm sources are the Volatile elite corpse boom (line 2809–2813) and enemy shells bursting near
  the player — both check the player explicitly.

### 2.2 Verbatim entries — the variety of emitters

Player fire field (Crucible ability, line 2352 — the ONLY player-friendly hazard in the game;
`friendly=1`):
```js
  addHaz(P.x+P.face*30,P.y+8,64,7,a.dmg*0.30,{burn:a.dmg*0.35},'#ff8a3f',1,'fire');
```

Biome vent emission (`upVents`, lines 3313–3316 — vents refire every 2.6 s flame / 3.4 s spore, scale
by `depthDmg(v.y)`):
```js
   if(v.kind==='flame')addHaz(v.x,v.y-10,34,1.9,7*dm,{burn:6*dm},'#ff8a3f',0,'fire');
   else addHaz(v.x,v.y-6,46,4.5,4*dm,{chill:0.7},'#c98fe0',0,'cloud');
```

A creature trail as **table data** — species field (bloomback, lines 919–921) and elite modifier
(Roiling, lines 988–989) use the identical `trail` shape; `upEnemies` consumes both through one path
(lines 3065–3069):
```js
 bloomback:{hp:120,dmg:16,spd:24,w:19,h:18,ai:'walk',c:'#7f9455',shards:8,arm:3,
   trail:{every:.5,r:26,t:4.5,dmg:.22,st:{bleed:.5},col:'#7f9455',kind:'gas'},
   atk:{cd:2.4,range:34,wind:.50,act:.20,rec:.44,kb:280,lunge:140}},
```
```js
 {id:'roiling', n:'Roiling',  c:'#8fdc6a', hp:1.8, dmg:1.1, spd:0.95,
   trail:{every:.7,r:24,t:3.5,dmg:.18,st:{bleed:.4},col:'#8fdc6a',kind:'gas'}},
```
Trail field contract: `every` = seconds between drops; `dmg` and every value in `st` are **ratios of
`e.dmg`** (multiplied at drop time via `e.dmg*TR.dmg` and `stFrom(TR.st,e.dmg)`, line 3041), so trails
scale with depth for free and never need a second table. Trails pause while the enemy is spent
(`(e.rec||0)<=0` gate).

Boss shockwave (`bossSlam`, line 2985 — jumpable because it is a floor hazard, not a hitscan):
```js
 addHaz(e.x,e.y+e.h/2,110,0.55,e.dmg*0.8,null,'#b0a070',0,'shock');
```

Artillery telegraph — the `'mark'` kind, dmg 0, painted where the lobbed shell will land, lifetime =
windup + solved flight time (lines 3112–3114):
```js
    if(S.lob){e.lockX=tgt.x;e.lockY=tgt.y;
     e.lockFt=Math.max(0.35,Math.min(0.9,Math.abs(tgt.x-e.x)/Math.max(150,S.speed)));
     addHaz(tgt.x,tgt.y,(S.explode||30)*0.9,wind+e.lockFt,0,null,S.col,0,'mark')}
```

Echo 8 "Hollow" wound-on-death (line 2775): `if(ECHO.wound)addHaz(e.x,e.y,26,4.5,e.dmg*0.22,{bleed:e.dmg*0.3},'#c04a70',0,'gas');`

**There is no upHaz-mutation API** — no `upHaz(id,...)` updater; `upHaz(dt)` is the per-frame ticker
called from `sim()` (line 4864). To make a moving/refreshing hazard, re-emit (like trails do).

VENTS (fixed world hazard sources, lines 2897, 3309–3317): spawned from `poi`-strand POIs as
`{x, y, kind:'flame'|spore, t:rr(0,3)}`, capped at 40, asleep beyond 900×700 px of the player. New
vent flavors are new branches in `upVents` + POI table entries — the rock cavity itself must come
from the `terrain` strand (rule 18).

---

## 3. Status engine (lines 963–971, 2453–2513)

### 3.1 The table — verbatim (lines 966–971)

```js
const STATUS={
 burn: {n:'Burn', c:'#e07a3f', dur:3.0, stack:1}, // dps = potency
 bleed:{n:'Bleed',c:'#e05555', dur:4.0, stack:1}, // dps, doubles while the target is moving
 chill:{n:'Chill',c:'#9fd0ff', dur:2.5, stack:0}, // potency = speed multiplier (lower = slower)
 shock:{n:'Shock',c:'#e6d34a', dur:4.0, stack:0}, // potency = incoming damage multiplier
};
```

Field contract: `n` display name, `c` particle/number color, `dur` base duration in seconds
(scaled by `(1-resist)` for the player), `stack` — `1` ⇒ up to `STACK_MAX=3` (line 268) independent
`{p,t}` instances (attack speed scales the DoT); `0` ⇒ single instance, best-potency-wins.

Potency semantics differ per status — this is the trap:
- `burn`/`bleed`: `p` is **damage per second**; bleed ticks ×2 while `|o.vx|>20` (line 2502).
- `chill`: `p` is a **speed multiplier**, LOWER is stronger (0.55 = 45% slow). `applyStatus` keeps
  the *lowest* p for chill, the *highest* for shock (line 2467–2470).
- `shock`: `p` is an **incoming-damage multiplier** (1.35 = +35% taken), applied in `hurtEnemy` via
  `shockMul(e)` (line 2749). A shocked target also passes a bolt on every hit: `shockChain(from,dmg,col)`
  (line 2490) hits the nearest other enemy within 110 px for `dmg*0.45`, suppressed when the incoming
  hit was itself `chained`.

### 3.2 Signatures

```js
applyStatus(o, st, isPlayer)   // line 2456. st = {burn:12, chill:0.6, ...} potencies. isPlayer gates
                               // resist (P.sres) and the hpDrain damage path. Unknown keys are ignored
                               // (!STATUS[k] continue). Durations <=0.05s after resist are dropped.
tickStatus(o, dt, isPlayer)    // line 2497. Decrements timers, applies DoT. Enemy death mid-tick calls
                               // killEnemy and RETURNS (the array may be stale). Player DoT accumulates
                               // into o.hpDrain — drained once per frame in upPlayer (line 3410), it
                               // ignores P.inv and can kill (secondWind is checked there).
stSum(o,k)    // line 2510: total potency across instances, 0 if none. Used by Rupture/Contagion.
hasSt(o,k)    // line 2511: boolean.
chillMul(o)   // line 2512: current chill speed multiplier or 1.
shockMul(o)   // line 2513: current shock damage multiplier or 1.
```

**Rule 8:** `o.st[k]` is ALWAYS an array of `{p,t}` instances, even for the non-stacking effects. One
shape, one code path. When a stacking status is full, the weakest instance is *replaced* if the new
potency is ≥ it — the hit is never refused (lines 2463–2466). Crits apply status at `CRIT_ST=1.5`×
potency, except chill which stays ×1 (lines 2688, 3246).

How ailments get their numbers (context from `resolveDmg`, line 2186): a gem writes `a.stR={burn:0.35}`
(ratio of final damage) or `a.st={chill:0.55}` (absolute); `resolveDmg` turns `stR` into absolute
potency `a.dmg*ratio*ailmentMul()*(a.ailMore||1)`. By the time potency reaches `applyStatus` it
already carries `ailmentMul()` — **applying ailmentMul again squares it** (bug comments at 2479 and 2322).

### 3.3 Elemental interactions — `statusCombo(o,k,isPlayer)` (line 2473)

Called by `applyStatus` after every applied key. Current interactions:
- **SHATTER** (burn+chill, either order): consumes both arrays, instant burst `= totalBurnPotency*1.6`,
  `burst(...,'#bfe8ff',14)`, `toastQ('SHATTER')` (which also plays `sfx('shatter')`, line 2446).
  On the player it lands via `hpDrain`; on an enemy it is direct hp with its own `dmgNum` + kill check.
- **CONGEAL** (bleed+chill): each bleed instance once (`b.cong` flag): `p*=0.5; t*=3` — half dps,
  triple duration.

**Adding a new status:** (1) a `STATUS` entry `{n,c,dur,stack}`; (2) its tick behavior — DoT belongs
in the `k==='burn'||k==='bleed'` branch of `tickStatus`, a stat effect gets a read-site helper in the
style of `chillMul`/`shockMul` and a consumer; (3) any interaction as a new branch in `statusCombo`;
(4) a way for content to apply it — a support gem writing `a.st`/`a.stR`, an enemy `hex`/trail field,
or a boon writing `RUNM.hitX` consumed by `applyRunMods` (line 2208). HUD display of player statuses is
automatic (`P.st` keys, line 4918). The `deepcut` `ailMore` path skips `chill`/`shock` explicitly
(line 2187) — decide which side a new status falls on.

---

## 4. BUFFS — the timed-buff contract (lines 2255, 2295, 2371–2372)

`BUFFS` is an array of `{k, v, until}`; `k` MUST be a key of `RUNB` (the numeric in-run additive pool,
line 2112: `dmg,cdr,ms,hp,greed,pierce,crit,critMult,arm,sres,focus,ailment,leech,iframes,kb,fuel`).

Apply — verbatim, the only current producer (War Cry, line 2295):
```js
  RUNB.dmg+=0.25;BUFFS.push({k:'dmg',v:0.25,until:perf+8});refreshAttacks();
```
Revert — `tickBuffs()` (lines 2371–2372), called every sim frame (line 4872):
```js
function tickBuffs(){for(let i=BUFFS.length-1;i>=0;i--){const b=BUFFS[i];
 if(perf>=b.until){RUNB[b.k]-=b.v;BUFFS.splice(i,1);refreshAttacks()}}}
```
Contract: apply = add to `RUNB[k]` + push + `refreshAttacks()`; expiry subtracts the same `v` and
calls `refreshAttacks()` again. Both calls are mandatory — `RUNB` feeds `inc()` which is baked into
the cached `ATK` (see §9). `until` is on `perf` (sim-time seconds). `BUFFS.length=0` and `RUNB=RUNB0()`
on `newRun()` (line 3512). Do NOT invent a non-numeric buff here — mechanics go in `RUNM` (line 3500).

---

## 5. hitStop / HS / TSCALE and addShake (rule 20; lines 2114–2131, 4938–4945)

### 5.1 Signatures

```js
const SHAKE_MAX=8;                                    // px, hard ceiling (line 2119)
function addShake(n,x,y)                              // line 2121
function hitStop(dur,frac,pre)                        // line 2128
let HS={t:0,dur:0,frac:1,pre:0},TSCALE=1;             // line 2127
```

- `addShake(n)` — trauma in px; MAX-not-additive (`if(n>shake)`), clamped to `SHAKE_MAX=8`.
  With `x,y` given, linear distance falloff to zero at 420 px from the player
  (`n*=Math.max(0,1-d/420)`). Decay: `shake-=dt*26` (line 4893). Render applies a **squared**
  response: `sk=Math.pow(shake/SHAKE_MAX,2)*SHAKE_MAX*(SET.shake/100)`, offset `(RRNG()-0.5)*sk`
  (lines 4617–4618) — small events barely register; the offset consumes `RRNG`, never `RNG`.
- `hitStop(dur,frac,pre)` — a time **scale**, never a stop. `dur` = distortion length (s), `frac` =
  crawl floor for `TSCALE` (default 0.12 if undefined; never pass 0 — suite-15 asserts `HS.frac>0`),
  `pre` = seconds the impact frame plays at FULL speed first. `SET.hitstop`/100 scales `dur` and
  `pre`; at 0 the call returns without effect. A lighter stop never shortens a heavier one already
  running (`if(d<=HS.t)return`). The frame loop (lines 4938–4945) runs: full speed while `HS.pre>0`,
  then `TSCALE=frac+(1-frac)*(1-k)^2` — crawl, then ease back.
- **Unscaled-time forgiveness:** `TSCALE` multiplies the frame delta feeding the fixed-step
  accumulator, so hitstop slows the whole sim. Input-forgiveness timers must therefore decay on REAL
  time: `upPlayer` does `const rdt=dt/Math.max(0.05,TSCALE); P.coyote-=rdt; P.jbuf-=rdt` (lines
  3400–3401). Any new buffer/forgiveness window you add must use the same `rdt` pattern or hitstop
  silently trebles it.

### 5.2 Who may call them — the calibrated table

**Ordinary hits never shake** (suite-15 asserts `shake===0` after a plain melee hit). Existing calls,
for calibration — new content should sit inside this range, and almost always should call *neither*:

| event | hitStop(dur,frac,pre) | addShake |
|---|---|---|
| landing a melee hit (doMelee, 2571) | 0.045, 0.30, 0.012 | — |
| TAKING an unblocked hit (hurtPlayer, 2859) | 0.15, 0.02, 0.022 | 5 |
| blocking (2854) | — | 2 |
| ordinary kill (killEnemy, 2768) | — | 3 |
| boss kill (2791) | 0.22, 0.05, 0.03 | 12 |
| boss slam (2983) | 0.06, 0.2, 0.015 | 16 (clamped 8) |
| Quake ability (2367) | 0.09, 0.10, 0.02 | 14 (clamped 8) |
| explosion (explode, 3258) | — | 5 |
| fall damage (3451) | — | 6 |
| Second Wind (2871) | — | 16 (clamped 8) |

Taking a hit must always stop harder than dealing one — asserted by suite-15.

---

## 6. Focus economy (lines 276, 2874–2879)

```js
const FOCUS_MAX=100, FOCUS_HIT=8, FOCUS_KILL=25, FOCUS_REGEN=2;   // line 276
function gainFocus(n){if(P.dead)return;P.focus=Math.min(FOCUS_MAX,P.focus+n*focusGainMul())}
function spendFocus(n,quiet){if(P.focus<n){if(!quiet)toast('Not enough focus');return false}
 P.focus-=n;return true}
```

Grant sites (all multiply by `focusGainMul() = 1+inc('focus')`):
- melee `strike()`: `FOCUS_HIT` (8) per hit; +8 again on crit for the `foc:'crit'` class (2699–2700).
- `projStrike()`: `FOCUS_HIT*0.6` (4.8) per projectile hit; +8 on crit for `foc:'crit'` (3255–3256).
- `killEnemy()`: `FOCUS_KILL` (25) (line 2769).
- `upPlayer()`: `FOCUS_REGEN*dt` (2/s idle trickle, line 3405).
- Class identities (`CLASSES[META.cls].foc`): `'block'` → `FOCUS_HIT*2` per blocked hit/projectile
  (2856, 3220); `'ailment'` → `gainFocus(dt*6)` per burning/bleeding instance tick on enemies (2508);
  `'dig'` → `gainFocus(cut*1.5)` per melee-dig tile (2568); `'crit'` → as above.

Costs: ability gems declare `fc` (Focus) and `cd` (seconds) in their GEMS entry — both gates are real
(`useAbility`, lines 2283–2285: cooldown check, then `spendFocus(a.fc)`, both `sfx('deny')` on fail).
Current fc range 20 (grapple) – 60 (sentry). Channelled skills declare `a.chan` = Focus **per second**
and pay `a.chan*DT` per tick inside `doMelee`/`doRanged` (whirlwind 26, siphon 22; lines 2549, 2611).
Tests: several abilities in a row fail on the resource — use the harness `TOPUP()`.

---

## 7. Projectiles (lines 2608–2626, 3178–3256)

### 7.1 The projectile object — full shape (player fire, doRanged, lines 2614–2625, verbatim)

```js
 for(let i=0;i<n;i++){if(PROJ.length>200)break;const off=(i-(n-1)/2)*spread;
  const c=Math.cos(off),s=Math.sin(off);
  PROJ.push({x:P.x,y:P.y-4,vx:(v.x*c-v.y*s)*a.speed,vy:(v.x*s+v.y*c)*a.speed,
   dmg:a.dmg,crit:a.crit,critMult:a.critMult,pierce:a.pierce,explode:a.explode,leech:a.leech||0,st:a.st||null,
   digR:a.digR||0,dig:a.dig,digCost:a.digCost||0,grav:a.grav||0,homing:a.homing||0,fork:a.fork||0,ret:a.ret||0,
   bounce:a.bounce||0,
   // Conditional gems ride along on the projectile — they resolve at impact, not at fire time.
   // Without this, Momentum/Culling/Chain/Reap/Sunder are pure `more` penalties when ranged.
   momentum:a.momentum||0,cull:a.cull||0,chain:a.chain||0,reap:a.reap||0,sunder:a.sunder||0,
   vsBurn:a.vsBurn||0,vsChill:a.vsChill||0,vsSpent:a.vsSpent||0,vsLow:a.vsLow||0,
   interrupt:a.interrupt||0,stagger:a.stagger||0,splinter:a.splinter||0,contagion:a.contagion||0,
   ox:P.x,oy:P.y,col:a.col,t:a.life||2,friendly:1})}
```

Field meanings (units): `dmg` final resolved damage; `crit`/`critMult` rolled per hit in `projStrike`;
`pierce` remaining pierces (`hitList` array prevents double-hits, line 3225); `explode` blast radius px
(0 = none); `leech` fraction of damage healed; `st` status potencies applied on hit; `grav` truthy ⇒
`vy+=GRAV*0.55*dt` (grenade arc); `homing` steer rate (lerp factor per second toward nearest enemy
within 260 px, friendly only); `fork` split into two ±0.5 rad copies on first hit then die; `ret`
distance px before boomeranging home (clears `hitList` so it hits again on the way back, despawns
within 14 px of P); `bounce` remaining geometry bounces (velocity ×−0.6/−0.55); `digR`/`dig`/`digCost`
tunneling: carve radius px / max hardness / lifetime seconds burned per tile cut — tunneling
projectiles are NOT stopped by terrain but still hit enemies (bug comment 3200–3202); `ox,oy` origin
(for `ret`); `t` lifetime seconds; `friendly` 1 = player-owned.

Enemy projectiles are a smaller shape (lines 3098–3102): `{x,y,vx,vy,grav,dmg,pierce,explode,st,col,t:3,friendly:0}`
— dmg is pre-scaled by `depthDmg(e.y)` at fire time. Hostile `explode` on the player or on rock
carves and checks the player only, never enemies (lines 3211–3213, 3221–3222).

### 7.2 projStrike / explode — the contracts (rule 16)

```js
function projStrike(e,p)              // line 3242. Mirrors strike(): rolls crit, condMul(p,e),
                                      // CRIT_ST status deepening, onHit(p,e,dmg), hurtEnemy, leech,
                                      // cull-execute, onKill(p,e), chainFrom, gainFocus(FOCUS_HIT*0.6).
function explode(x,y,r,dmg,col,st,src,skip)  // line 3257. burst + addShake(5); damages every ENEMY
                                      // within r+e.w/2 (never the player), rolling src's crit per
                                      // target; skip = the enemy already struck (Aftershock double-hit
                                      // guard); always carve(x,y,r*0.55,src.dig ?? 0) — an explosive
                                      // build IS a digging build.
```
Order matters at impact: **hit first, then blast** — `projStrike(e,p)` then `explode(...)` (comment
3227–3230: checking explode first skipped leech/Focus/every rider). There is no `explodeAt` — the
function is `explode()`.

### 7.3 Caps — exact numbers

- Player-side pushes guard at **200**: `doRanged` breaks the volley when `PROJ.length>200`;
  fork copies, Splinter shards and sentry shots require `PROJ.length<200`.
- Enemy-side pushes guard at **220**: boss patterns/rings/beams and telegraphed shooters all check
  `PROJ.length<220` — enemies keep 20 slots the player cannot squat on.
- Suite-15 integrity allows `PROJ.length<=230` after 30 s at Echo 25/Threat V.

### 7.4 Declaring a NEW projectile behavior

Behaviors are attack-object fields written by a skill/support gem `mod` and consumed in exactly one of
two places: **flight-time** behaviors (like `homing`, `bounce`, `ret`, `grav`) get a branch in
`upProj` (line 3178); **impact riders** go through `condMul`/`onHit`/`onKill` (lines 2639–2682) so
melee and ranged pay identically (rule 16; suite-13 asserts it). Checklist for a new field `foo`:
1. Gem entry sets it: `mod:a=>{a.foo=...;a.more*=...}` (support gems touch `a.more`, NEVER `a.dmg` — rule 5).
2. Copy it into the projectile literal in `doRanged` (`foo:a.foo||0`) — forgetting this makes the gem
   melee-only, the exact bug rule 16 exists for.
3. If the Shard Sentry should inherit it, add it to the sentry's PROJ.push copy-list too (lines
   3277–3281). **The sentry copies only:** `dmg*0.6, crit, critMult, pierce, explode, st, vsBurn,
   vsChill, vsSpent, vsLow, chain, cull` — it deliberately drops `leech` (set 0) and currently does
   not carry `momentum/reap/sunder/fork/ret/splinter/contagion/interrupt/stagger/digR`.
4. Implement the effect in `upProj` (flight) or `condMul`/`onHit`/`onKill` (impact) — one
   implementation, both damage paths.
5. Fork copies the whole projectile with `Object.assign({},p,...)` (line 3235), so new fields survive
   forking automatically; bounce/ret interact with `hitList` — check your behavior against both.

Existing behavior→gem examples, verbatim (lines 675–693):
```js
 grenade:  {t:'skill',for:'ranged',n:'Grenade', col:'r', d:'lobbed, bounces, explodes',
   mod:a=>{a.dmg*=1.7;a.speed*=0.62;a.grav=1;a.bounce=2;a.explode=58;a.cd*=1.25;a.life=1.6;a.col='#e0a03f'}},
 wisp:     {t:'skill',for:'ranged',n:'Homing Wisp', col:'b', d:'slow seeker, fire and forget',
   mod:a=>{a.dmg*=0.8;a.speed*=0.5;a.homing=3.2;a.life=4;a.cd*=0.8;a.col='#c98fe0'}},
 fork:     {t:'sup',for:'ranged',n:'Fork', col:'g', d:'projectiles split on first hit',
   mod:a=>{a.fork=1;a.more*=0.85}},
 ret:      {t:'sup',for:'ranged',n:'Return', col:'g', d:'projectiles boomerang back',
   mod:a=>{a.ret=150;a.pierce+=1;a.more*=0.9}},
```

---

## 8. Summons, turrets, decoy — and the support-output rule

Neither is an entity in `EN`; both are special-cased sim arrays updated from `sim()`
(`upSentry(dt);upDecoy(dt)`, line 4864) and drawn by `render` (4661–4665).

- **SENTRY** (array, multiple allowed): created by the `sentry` ability fx as `{x:P.x,y:P.y,t:perf+8,cd:0}`
  (line 2311 — 8 s lifetime). `upSentry` (3268): targets nearest enemy within 300 px, fires the
  player's **current** `ATK.ranged` at `dmg*0.6` and `cd*1.4`, projectile lifetime fixed 2 s. "Sentries
  fire the player's CURRENT ranged attack, so every ranged upgrade upgrades them too" (line 3267) —
  the ability IS the build. It fires nothing if the ranged slot is empty or holds a shield.
- **DECOY** (singleton, `let DECOY=null`): created as `{x:P.x+P.face*30,y:P.y,t:perf+6,hp:40+a.dmg}`
  (line 2314 — 6 s or hp, whichever first). Aggro: `upEnemies` retargets any enemy within 260 px of
  the decoy (line 3048); range AND damage follow the target — a landed enemy swing does `DECOY.hp-=e.dmg`
  and ends the attack (3125); overlapping enemies also grind it at `e.dmg*dt*2` (3287). Boss "ongoing"
  patterns that must aim at the *player* (spores, devour) measure the player explicitly even while
  aggro is on the decoy (comment 3002–3004).
- **The support-output rule** (commit "a healer's output should come from the healer"): a support
  unit's output scales with the SUPPORT, not the beneficiary — the chanter's heal is
  `amt=Math.min(e.maxhp*ED.heal.amt, t.maxhp*(ED.heal.cap||0.25))` (line 3081): a share of the
  *chanter's* max hp (so it depth-scales like everything else), capped as a share of the target so it
  still reads on something small. Table shape: `heal:{cd:2.6,amt:.55,cap:.25,range:180}` (line 924).
  The sentry follows the same philosophy from the player side (its output is the player's attack).
  A new summon/support unit must derive its output from its owner's stats, not from a flat number.

Both are cleared on `newRun()` (`SENTRY.length=0; DECOY=null`, lines 3509–3510).

---

## 9. Entity caps, RNG discipline, sim/render split, refreshAttacks

Caps (respect them; every producer must guard):
- `EN` **120** — enforced by `queueEnemy` (`EN.length+SPAWNQ.length<120`, line 2110). Never push to
  `EN` from inside an EN iteration (killEnemy runs inside `for(const e of EN)` loops) — queue via
  `queueEnemy`/`flushSpawns`. `evictFar()` (2884) reclaims the furthest sleeper rather than refusing
  the nearest spawn. Suite-15 allows ≤125 live.
- `PROJ` **200 player / 220 enemy** (§7.3); suite asserts ≤230.
- `PART` **350** — `burst()` refuses above 350 (line 2539); hazard particles gate at 300.
- `HAZ` **64** (shift-oldest), `DMGN` **24** (shift-oldest), `ARCS` **24** (refuse), `VENTS` **40** (refuse).
- `SPAWNQ` flushed once per frame between `upVents` and `upSentry` (line 4864).

RNG: `RNG` (world/sim, seeded per run) vs `RRNG=mulberry(0x5eed)` (render-only, line 4487; helper
`rrR(a,b)` line 4852). `render()` must not mutate game state and must not consume `RNG` — screenshake
once drew from `RNG()` and made chunk contents depend on how many frames had been drawn (CLAUDE.md
Conventions). Content code that runs during rendering (draw hooks, marker painting) uses `RRNG` only.

Sim runs at fixed `DT=1/60` inside `while(acc>=DT&&!paused)` (line 4949); `paused` is rechecked
INSIDE the loop and `acc=0` while paused, or leftover steps fire as a burst when a panel closes.

No-alloc-in-hot-loops: `upProj`/`upEnemies`/`upHaz` iterate backwards and splice; `WARDS` is collected
once per frame instead of searched per hit (comment 3035–3037: dozens of hurtEnemy calls × 120 enemies
would be a 14,000-comparison inner loop); `RUNB0()` exists so reset is one allocation. Match this.

**`refreshAttacks()` (line 2270) — the most-forgotten call.** Recomputes cached `ATK.melee/ranged/abil`
AND `P.armor`, `P.sres`, `P.maxfuel`, `P.fallImmune`. Must be called after ANY change to equipment,
sockets, tree, class, boons, RUNB, or RUNM. Current call sites you must imitate: level-up attunement
(3374), newRun (3531), equip/unequip (3606/3608/3666/4117), unsocket (3654), socket (3690), shrine
boon (3985), class pick (4049), tree node buy (4125), buff apply/expire (2295/2372). Cached values a
new mechanic must NOT read stale: anything in `ATK.*`. Live per-frame state (Tempo stacks, Undertow,
chill) is deliberately read at use time via `liveSpeedMul()`/`condMul()` instead of being cached.

---

## 10. Audio hooks for new content (lines 2387–2450)

All sound is synthesized — no asset files. API: **`sfx(name, x)`** (line 2427): `name` is a key of the
`SFX` table; optional `x` is a world x-coordinate for stereo panning (±0.7 pan across the viewport).
Guards you get for free: 16-voice budget (recovers at 55/s), per-sound 35 ms retrigger lockout (a
multishot volley is one sound, not five), silent no-op before the first user gesture arms `AC`.

Existing names — reuse before inventing: `swing, nova, shoot, hit, crit, kill, bosskill, hurt, block,
pick, gem, dig, abil, shatter, level, deny, die`. Convention by event: ability cast → `abil`; refusal
(cooldown/focus/invalid) → `deny`; loot/pickup → `pick`/`gem`; milestone/unlock → `level`. A NEW sound
is one `SFX` table entry: `{w:<oscillator type>, f:<start Hz>, f2:<end Hz>, d:<duration s>, g:<gain>}`
— frequency ramps exponentially f→f2 over d.

Other feedback channels content may use: `toastQ(msg)` — big floating callout, 0.9 s (`'SHATTER'`
auto-plays its sfx); `toast(msg)` — HUD text line; `flash(a)` — screen flash 0..1, scaled by
`SET.flashes` (accessibility: at 0 it must be exactly 0 — suite-tested); `arc(x1,y1,x2,y2,col)` —
lightning arc, cap 24; `burst(x,y,col,n)` — particles; `rumble(strong,weak,ms)` — gamepad only,
gated on `SET.rumble` and `INMODE==='pad'`; `hint(id,msg)` — one-time tutorial hint, gated on
`SET.hints`, message must interpolate `pr()`. Damage TAKEN never floats a number — the directional
`HURT` edge flare says where it came from (lines 2449–2450); do not add dmgNum calls on the player.

---

## 11. What suite-15 asserts (test/suite-15.js) — the feel contract, exact numbers

Run with `./test/run.sh 15`. Any content touching these systems must keep every one green:

**Hitstop** — `HS.frac > 0` always (never a hard zero); `HS.pre > 0` (impact frame at full speed
first); a lighter `hitStop` never shortens a heavier one running; `SET.hitstop=0` ⇒ `HS.t===0` after
a request; taking an unblocked hit ⇒ `HS.t > 0.08` s AND `HS.frac < 0.1`; landing a melee hit
produces `HS.t > 0` but strictly LESS than taking one.

**HURT flare** — `hurtPlayer(12,false,P.x+200)` sets `HURT.x > 0`; from the left, `< 0`.

**Screenshake** — `addShake(999)` ⇒ `shake === SHAKE_MAX` (8); `SHAKE_MAX/272 < 0.035` (under 3.5% of
a 272 px view); `addShake(8, P.x+2000, P.y)` ⇒ `shake === 0` (falloff hits zero at 420 px);
falloff is smooth (8 at 210 px < 8 at 0 px, both > 0); **an ordinary melee hit produces `shake === 0`**.

**Damage numbers (coalescing)** — 10× `dmgNum` same spot/color within 0.25 s ⇒ exactly 1 entry with
`v === 70` (running total); ≥16 px apart ⇒ separate; a crit NEVER merges with a normal number;
`DMGN.length <= DMGN_MAX` (24) under 200 spread calls; `SET.dmgnum=0` ⇒ zero entries;
`hurtPlayer` floats NO number ever.

**Forgiveness on real time** — at `TSCALE=0.1`, `P.jbuf=0.12` decays to `<= 0.001` within 6 sim steps
(6×DT), i.e. faster in slow motion so it lasts the same real time.

**Accessibility** — `SET_DEF` contains `shake`, `hitstop`, `flashes`; the `SETTINGS` menu array
contains keys `shake, hitstop, flashes, dmgnum, aimassist, autoaim, rumble`; `SET.flashes=0` ⇒
`flash(1)` leaves `FLASH === 0`; at 100, `flash(0.5)` ⇒ `FLASH ≈ 0.5`.

**Integrity at the top of the ladder** — Echo 25, Threat V, five support-heavy enemies, 30 simulated
seconds of `upEnemies/upProj/upHaz/upVents/flushSpawns`: zero NaN in any `P.hp/maxhp` or `e.hp/dmg/x`;
`EN.length <= 125`, `HAZ.length <= HAZ_MAX` (64), `PROJ.length <= 230`; `maxHP()` finite, `> 0`, and
never below 20 even under Echo "Brittle".

**Echo hooks that reach these systems** — `ECHO.wound` (Echo ≥8 "Hollow") must leave a HAZ entry on
every kill (asserted via `killEnemy` → `HAZ.length > 0`); `ECHO.nomark===1` (Echo ≥9 "Silent")
removes ground markers — marker-drawing code must respect it.

Suite gotchas when testing this layer (from CLAUDE.md): damage numbers coalesce, so assert HP deltas,
not `DMGN` counts; `Date.now` is pinned; reset `META.echoLv/maxEcho/threat` at the end of a block;
harness has no DOM/pointer/gamepad — menu focus and mouse coords belong in `test/browser.js`.

---

## 12. Registration checklists — every place a new id must appear

**New ability (the most plumbing-heavy content in this doc's scope):**
1. `GEMS` entry — `{t:'abil',for:'armor',n,col,cd,fc,fx,d}` (verbatim exemplar, line 716):
   ```js
   sentry:   {t:'abil',for:'armor',n:'Shard Sentry', col:'g', cd:16, fc:60, fx:'sentry', d:'turret fires your ranged attack'},
   ```
2. An `else if(a.fx==='...')` branch in `useAbility()` (line 2281) — abilities are the sanctioned
   exception to "no id branches" because they need live state. Inside it: `sfx`/`burst`/`toast`
   feedback; damage via `explode`/`PROJ.push`/`addHaz`/`hurtEnemy` only; digging via `carve` only
   (rule 3); `addShake`/`hitStop` only at the §5.2 calibration.
3. An `UNLOCKS` entry `{id,n,cost}` (line 1565) — the id namespace is SHARED between GEMS and GEAR
   (that is why `chainbolt` is not `chain`, line 686–688); a collision unlocks both for one price.
   Without an UNLOCKS entry (or membership in `DEFAULT_GEM_POOL=['cleave','multishot','addedfire']`)
   the gem never drops: `gemPool()` = defaults + unlocked ids only (line 1995).
4. No UI work: the bag/socket screens, the ABIL HUD button (name/cooldown/focus states, line 4926)
   and the codex read the table. `CURRENT-STATE.md` regenerates via `design/audit.sh`.

**New edge input action:** the 8 places in §1.2. **New status:** the 4 steps in §3.3. **New hazard
emitter:** call `addHaz` from the appropriate hook (`useAbility` branch, `trail` table field, boss
pattern, `upVents` kind) — never build area denial as a projectile (rule 19). **New projectile
behavior:** the 5-step checklist in §7.4. **New timed buff:** the §4 contract (RUNB key + BUFFS push +
`refreshAttacks()` both ends).

After ANY of the above: run `./test/run.sh` (all suites) — suite-13 will catch a conditional wired
into one damage path, suite-15 will catch a feel-cap violation, and add assertions for a genuinely
new system as `test/suite-N.js` + the `SUITES` list in `test/run.sh`.
