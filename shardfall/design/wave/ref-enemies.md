# SHARDFALL — ENEMY / COMBAT LAYER REFERENCE (ground truth, extracted 2026-08-10)

Source of truth: `/workspaces/Sweet-Spot/shardfall/index.html` (single `<script>` block).
All tables live in the DATA TABLES section near the top (banner at line ~280); the `ENEMIES`
table starts at the `// ENEMIES.` comment (~line 858). Combat code lives under
`// ============ COMBAT ============` (~2452) and `// ============ ENEMIES / PROJECTILES /
PICKUPS ============` (~2880). Line numbers below are as of commit `3c446e9`.

Hard rules that bind everything in this doc (from `shardfall/CLAUDE.md`):

- **Rule 4** — a new enemy is a table entry and nothing else. An `if (type === 'x')` branch in
  combat code means the table is missing a field.
- **Rule 15** — a fight has THREE beats: `wind -> act -> rec`. `mkAtk()` is the only place a
  table attack row becomes a live attack. `mkEnemy()` is the only place a table row becomes a
  live enemy. Ground markers draw `atkReach()` (range + lunge×act), never `range`.
- **Rule 19** — area denial (trails, spore clouds, boss shockwaves, firewalls) is a `HAZ`
  entry via `addHaz()`, capped at `HAZ_MAX=64`. Never a projectile.
- `design/CURRENT-STATE.md` is **generated** — after any table change run
  `./design/audit.sh`; never hand-edit it.

Relevant constants (CONSTANTS section, lines 237–278):

```
const WINDUP_FLOOR=0.26;   // every melee windup clamps UP to this after all multipliers
const RECOVER_DMG=1.25;    // damage multiplier while an enemy is recovering (the punish payout)
const ARMOR_FLOOR=1;       // armor can never reduce a hit below this
const ARMOR_MIN_FRAC=0.22; // ...and a hit always lands for at least 22% of its raw value
const HAZ_MAX=64;          // hazard cap (line 2105)
```

Entity caps: `EN` 120 (bosses may push to 124 and evict a far sleeper first — `evictFar()`),
`PROJ` 200 for friendly spawn sites / 220 for enemy+boss sites, `PART` 350.

---

## 1. THE `ENEMIES` TABLE

`const ENEMIES = { id: {…}, … }` — line 869. The **key** is the enemy id used everywhere:
biome rosters, `BIOME_BOSS`, `SPR` sprites, `LORE.enemy`, `mkEnemy(type,…)`, `spawnedBy`,
bounty/codex discovery.

### 1.1 Field list (every field, with what the code actually does with it)

**Core stats (required on every row):**

| field | type/units | consumed by | meaning |
|---|---|---|---|
| `hp` | number, hit points at 0m | `mkEnemy` | Base HP. Live HP = `hp × depthHP(y) × eliteMul × (ECHO.hp||1)`. |
| `dmg` | number, HP per hit at 0m | `mkEnemy`, melee/contact | Base damage. Live `e.dmg = dmg × depthDmg(y) × eliteMul × (ECHO.dmg||1)`, frozen at spawn depth. Used for melee hits, body-checks, and as the *base ratio* for trail/burst/split derived damage. **NOT used by `shoot`** (see `shoot.dmg`). |
| `spd` | px/s | `upEnemies` | Target move speed. Live `e.spd = spd × eliteMul × (T.spd||1) × (ECHO.spd||1)`. Walkers ease toward `dir*spd`; flyers seek at `spd` within 380px. |
| `w`, `h` | px | everywhere | Hitbox width/height (also sprite draw size). Elites spawn at 1.15×. |
| `ai` | `'walk'` \| `'fly'` | `upEnemies` | `'walk'`: gravity, ledge-hop (vy −260), turns at walls, won't walk off cliffs while idle (d>340). `'fly'`: no gravity, seeks within 380px, sinusoidal idle drift, velocity damped ×0.98/frame. |
| `c` | `'#rrggbb'` | render, particles | Body colour: fallback rect colour when no sprite, death/hit particle colour. Elites override it with the modifier's colour. |
| `shards` | integer | `killEnemy` | Base currency drop AND XP basis. XP = `max(1, round(shards × (boss?6 : elite?2.5 : 1)))`. Shards dropped = `ceil(shards × (elite ? (el.loot||3) : 1) × rr(0.7,1.3))`, then multiplied downstream by greed × `depthMul(y)` × `threat().shard` × `(ECHO.shard||1)` × scavenger. |

**Optional combat fields:**

| field | type/units | consumed by | meaning |
|---|---|---|---|
| `arm` | flat armor | `hurtEnemy` via `applyArmor` | Subtracted from each incoming hit (min `ARMOR_MIN_FRAC`=22% of hit still lands; absolute floor 1). Live `e.arm = arm + eliteArm + (T.arm||0) + (ECHO.arm||0)`. |
| `atk` | `{cd,range,wind,act,rec,kb,lunge}` | `mkAtk`, three-beats state machine | Telegraphed melee. See §3 for units. Omit it and the enemy has NO swing but still **body-checks for `e.dmg`** on overlap (nothing is harmless by omission — line 3172). |
| `shoot` | `{cd,dmg,speed,count,spread,col,range,wind,lob,grav,explode,st,stR}` | shoot branch of `upEnemies` (3085–3114) | Telegraphed ranged. See §1.3. |
| `front` | `1` | `hurtEnemy` (2733) | Shieldman flag: incoming damage ×0.25 when the attacker (player) is on the side the enemy faces (`Math.sign(P.x-e.x)===e.dir`) and it is not winding up. Get behind it. |
| `pack` | integer ≥2 | `genChunk`, `enemyCost` | Spawns as a group of `pack` bodies (+1 extra when `threat().dens>1`). Written into the chunk spawn list as a group; members after the leader carry `pk:1` and can never roll elite. Adds `pack*0.25` to `enemyCost`. |
| `burstOnDeath` | radius px | `killEnemy` (2781) | Corpse explodes: `explode(x,y,r, e.dmg*0.7, …)` damaging **other enemies too**, plus a manual player check (player takes `e.dmg*0.7` + status if inside r). Status applied: `{chill:0.7}` by default. |
| `burnDeath` | `1` | `killEnemy` | Changes `burstOnDeath` corpse status to `{burn: e.dmg*0.5}` (player gets `burn: e.dmg*0.4`) and the blast colour to ember orange. (Ember uses this; sporeling omits it → chill cloud.) |
| `split` | integer | `killEnemy` (2787) | On death spawns `split` × `'voidling'` via `queueEnemy(Object.assign(mkEnemy('voidling',…),{…,isSplit:1}))`. `isSplit` guard prevents recursion. NOTE: the child type `'voidling'` is hard-coded at line 2789 — a new splitting species today still splits into voidlings unless that line grows a field (it should become a table field if you need different children). |
| `phase` | `1` | fly branch (3163) | Wraith flag: ignores terrain collision entirely (moves by raw integration, particle shimmer). |
| `burrows` | `1` | fly branch (3167) | Moves by raw integration AND `carve(e.x, e.y, e.w*0.62, 1)` every frame — eats a permanent tunnel (hardness gate 1, so it cannot chew bedrock; carve enforces that). |
| `trail` | `{every,r,t,dmg,st,col,kind}` | trail branch (3065) | Sheds a `HAZ` patch every `every` seconds while **not spent** (`rec<=0`): radius `r` px, lifetime `t` s, tick damage `e.dmg × dmg` (a RATIO of the creature's live damage, so it depth-scales for free), status `stFrom(st, e.dmg)` (each status potency = ratio × e.dmg), colour `col`, hazard kind `kind` (`'gas'|'cloud'|'fire'|'shock'`). Same field shape as the Roiling elite's trail. |
| `heal` | `{cd,amt,cap,range}` | heal branch (3072) | Support/healer. Every `cd` seconds heals the most-wounded OTHER enemy within `range` px. **Output derives from the HEALER**: `amt = min(e.maxhp × heal.amt, target.maxhp × (heal.cap||0.25))` — see §10 for the suite that asserts this. A healer never heals itself (target loop skips `o===e`). Suppressed while spent. First cooldown is randomized `rr(0, cd)`. |
| `ward` | `{range,arm,dr}` | `hurtEnemy` (2738), `WARDS` collection | Support/protector. Every non-warder enemy within `range` px of a live warder takes `dmg × (1-dr)` and gains `+arm` effective armor per hit. Warders never ward each other (creatures whose species has `ward` are excluded), so the warder is always the correct first target. |
| `cost` | number | `enemyCost` | OPTIONAL override of the derived encounter cost. Only set it when a creature is worth more than its stats say (support units already get a derived surcharge — see §7). No current row sets it. |

**Boss fields:**

| field | type | consumed by | meaning |
|---|---|---|---|
| `boss` | `1` | many | Health bar, never elite, never evicted from the EN cap (and may exceed it to 124), guaranteed loot (2 gems + 1 gear at rarity `max(2, rollRarity(il,3.2))` + 1 sigil), XP ×6, phase system active, big death FX, `toast(TYPE + ' SLAIN')`. First distinct boss kill sets `META.bosses[type]=1` and raises `META.maxThreat` by one tier (fighting, not buying, is the threat ladder). |
| `ph` | `[{at,pat}, …]` | `bossPhase` | Phase transitions. `at` = HP **fraction** threshold (crossing below it while ALIVE triggers the phase), `pat` = pattern name, which must be one of the seven implemented patterns (§5) — suite-10 asserts this. Entries must be in descending `at` order (current bosses use `.66` then `.33`). Each entry **ADDS** its pattern permanently to `e.pats`. |

### 1.2 Verbatim sample rows (copied character-for-character from index.html)

A plain grunt (walker, melee only):

```js
 crawler:{hp:24,dmg:13,spd:42, w:14,h:12,ai:'walk',c:'#7d5340',shards:2,
   atk:{cd:1.5,range:24,wind:.34,act:.16,rec:.26,kb:140,lunge:190}},
```

A plain flyer:

```js
 bat:    {hp:14,dmg:10,spd:78, w:12,h:10,ai:'fly', c:'#6a5a8f',shards:2,
   atk:{cd:1.7,range:26,wind:.28,act:.14,rec:.22,kb:90,lunge:260}},
```

A shooter (melee fallback + telegraphed ranged):

```js
 archer:  {hp:34,dmg:12,spd:28,w:13,h:16,ai:'walk',c:'#b0a070',shards:5,
   atk:{cd:2.2,range:22,wind:.36,act:.14,rec:.28,kb:100,lunge:100},
   shoot:{cd:2.3,dmg:20,speed:390,count:1,spread:0,col:'#ffe9a0',range:520,wind:.55}},
```

Artillery variant (lobbed, ballistic, ground-marked — shows `lob`, `grav`, `explode`):

```js
 mortar:{hp:50,dmg:12,spd:16,w:14,h:15,ai:'walk',c:'#c9743a',shards:7,
   atk:{cd:2.6,range:22,wind:.40,act:.14,rec:.32,kb:120,lunge:100},
   shoot:{cd:3.2,dmg:22,speed:250,count:1,spread:0,col:'#ff8a3f',range:560,wind:.70,lob:1,grav:1,explode:44}},
```

The two support units (healer and warder):

```js
 chanter:{hp:42,dmg:10,spd:34,w:13,h:18,ai:'walk',c:'#bfb595',shards:8,
   heal:{cd:2.6,amt:.55,cap:.25,range:180},
   atk:{cd:2.4,range:24,wind:.38,act:.14,rec:.30,kb:120,lunge:110}},
 warder:{hp:60,dmg:12,spd:22,w:14,h:16,ai:'walk',c:'#6f7889',shards:8,arm:4,
   ward:{range:150,arm:6,dr:.25},
   atk:{cd:2.6,range:26,wind:.44,act:.18,rec:.38,kb:180,lunge:120}},
```

A splitter:

```js
 voidspawn:{hp:60,dmg:17,spd:54,w:16,h:16,ai:'walk',c:'#6a4fd0',shards:7,split:2,
   atk:{cd:1.8,range:26,wind:.32,act:.16,rec:.28,kb:170,lunge:220}},  // splits on death
```

A boss with its phase list (the table field is `ph`; the runtime accumulator is `e.pats`):

```js
 warden:  {hp:420, dmg:22,spd:46,w:28,h:30,ai:'walk',c:'#a05a3a',shards:40,boss:1,arm:4,
   atk:{cd:2.2,range:44,wind:.50,act:.22,rec:.34,kb:320,lunge:260},
   shoot:{cd:2.4,dmg:12,speed:230,count:3,spread:.30,col:'#e0a03f',range:380,wind:.45},
   ph:[{at:.66,pat:'slam'},{at:.33,pat:'summon'}]},
```

### 1.3 The `shoot:{}` block, field by field

Consumed at lines 3085–3114. All shots are telegraphed: the enemy strobes for `wind` seconds
(`e.swind` counts down), THEN fires. A spent enemy (`rec>0`) can neither start a shot nor
finish one already winding (`swind` is zeroed — the punish window is real for shooters too).
A shot also cannot start while winding/acting in melee, or while `invT>0`.

| field | units | meaning |
|---|---|---|
| `cd` | s | Shot cooldown. First shot after spawn is randomized `scd = rr(0.5, 1.5)`. Boss phase transitions multiply the LIVE copy's `cd` by 0.75 (compounding per phase). |
| `dmg` | HP at 0m | Projectile damage. Scaled at FIRE time: `dmg × depthDmg(e.y)`. **Elite dmg multipliers and `ECHO.dmg` do NOT apply to projectiles** — they only touch `e.dmg`. A shooter elite hits harder in melee only. |
| `speed` | px/s | Projectile speed (straight-line aim at target unless `lob`). |
| `count` | int | Projectiles per volley (default 1). Fanned around the aim line by `spread`. |
| `spread` | radians | Angular offset per projectile: shot k gets `(k-(n-1)/2)*spread`. |
| `col` | colour | Projectile + tell-strobe + muzzle-burst colour. |
| `range` | px | Max distance at which the enemy will start a shot. |
| `wind` | s | The ranged tell. Default 0 if omitted. **NOT clamped by `WINDUP_FLOOR`** — `mkAtk` only touches `atk`. Keep it ≥ 0.26 yourself (current min in the table: 0.34 on voidmaw). |
| `lob` | `1` | Artillery mode: the shell is solved ballistically to land on the ground position the target occupied at LOCK time (`e.lockX/lockY`), flight time `lockFt = clamp(|dx|/max(150,speed), 0.35, 0.9)`, gravity `GRAV*0.55`. At lock it paints a harmless `'mark'` hazard (`dmg:0`, radius `(explode||30)*0.9`, lifetime `wind + lockFt`) so the marker countdown and the shell agree. Suite-11 asserts the shell lands within 40px of the marker even if the player moves. |
| `grav` | `1` | Projectile is affected by `GRAV*0.55` in flight (use with `lob`). |
| `explode` | radius px | Shell bursts on impact. Hostile blasts on terrain check the player manually (never friendly-fire the enemy side). |
| `st` | `{status:potency}` | Flat status applied on hit (e.g. voidmaw `st:{chill:0.6}` — chill potency is a speed multiplier so it must NOT depth-scale). |
| `stR` | `{burn:ratio}` | RATIO status: potency = `dmg × depthDmg(e.y) × ratio`, computed at fire time (e.g. smith/forgelord `stR:{burn:.5}`). Use `stR` for damaging statuses so they depth-scale; use `st` for multiplier statuses (chill/shock). Only `burn` is currently wired through `stR` (line 3100). |

`mkEnemy` copies the block (`Object.assign({},E.shoot)`) so live mutation (boss phase cd cut)
never writes back into the table.

---

## 2. THE ONLY LEGAL CONSTRUCTORS — `mkEnemy()` and `mkAtk()`

Rule 15. Every spawn path routes through these: world spawns (`spawnFromChunks`), packs,
voidspawn splits, boss summons, dissonance bleed-ins, and hand-built test enemies. A
hand-rolled object misses `invT` (NaN leak — a real bug the harness caught), the elite/Threat/
Echo multipliers, the windup floor, and the derived recovery.

Verbatim (lines 2917–2943):

```js
// One place where a table row becomes a live enemy. Splits, summons, packs and world spawns all
// come through here, so a new field can never be live in one spawn path and undefined in another.
function mkEnemy(type,x,y,el,T,by){
 const E=ENEMIES[type];T=T||threat();
 const mh=depthHP(y),md=depthDmg(y),boss=!!E.boss;
 return {x,y,vx:0,vy:0,w:E.w*(el?1.15:1),h:E.h*(el?1.15:1),type,ai:E.ai,
  c:el?el.c:E.c,
  hp:E.hp*mh*(el?el.hp:1)*(ECHO.hp||1),maxhp:E.hp*mh*(el?el.hp:1)*(ECHO.hp||1),
  dmg:E.dmg*md*(el?el.dmg:1)*(ECHO.dmg||1),
  arm:(E.arm||0)+(el&&el.arm||0)+(T.arm||0)+(ECHO.arm||0),front:E.front||0,
  spd:E.spd*(el?el.spd:1)*(T.spd||1)*(ECHO.spd||1),onG:false,flash:0,dir:chance(.5)?1:-1,
  boss,elite:el,shoot:E.shoot?Object.assign({},E.shoot):null,scd:E.shoot?rr(.5,1.5):0,
  atk:mkAtk(E.atk,T),
  acd:E.atk?rr(.3,1.0):0,wind:0,act:0,rec:0,invT:0,phase:0,ph:E.ph||null,pats:null,
  spawnedBy:by||null}}
// One place where a table's attack row becomes a live attack, so the windup floor and the Threat
// recovery multiplier can never be forgotten by a caller. Every hand-built enemy (splits, summons,
// tests) goes through it too.
function mkAtk(atk,T){
 if(!atk)return null;
 T=T||threat();
 const wind=Math.max(WINDUP_FLOOR,atk.wind*(T.wind||1));
 const rec=Math.max(0.10,(atk.rec!==undefined?atk.rec:Math.max(0.22,atk.wind*0.75))*(T.rec||1));
 return Object.assign({},atk,{wind,rec})}
// Real reach of a telegraphed melee: the enemy lunges for the whole active window, so the ground
// marker has to show range + lunge*act or it is teaching the player a lie (PLAN §2.3).
function atkReach(atk){if(!atk)return 0;return (atk.range||0)+(atk.lunge||0)*(atk.act||0)}
```

Contracts:

- `mkEnemy(type, x, y, el, T, by)` — `type`: ENEMIES key; `x,y`: world px; `el`: an ELITES
  row or `null`; `T`: a THREATS row (defaults to `threat()`); `by`: string tag written to
  `spawnedBy` (bosses pass their own type so their adds can be counted/capped). Returns the
  live enemy object; caller pushes it to `EN` or hands it to `queueEnemy`.
- `mkAtk(atk, T)` — clamps `wind` UP to `WINDUP_FLOOR=0.26` after the (now always 1) Threat
  windup multiplier; derives `rec` when a row omits it as `max(0.22, wind_raw*0.75)` (note:
  from the RAW table wind, before clamping), applies the Threat recovery multiplier
  (`T.rec` = 0.65 at Threat III/V), floors the result at 0.10, and copies the row so live
  state never mutates the table. Returns `null` for `null` input.
- `atkReach(atk)` — the honest reach: `range + lunge*act` px. Returns 0 for null. The render
  marker draws this (`ECHO.nomark` suppresses it at Echo 9+), and the AI *initiates* a windup
  at `d < atkReach(e.atk)*0.85 + e.w/2` (line 3143).
- Deferred spawns (anything created during `upEnemies` iteration) go through
  `queueEnemy(e)` / `flushSpawns()` (lines 2109–2111). `queueEnemy` respects the 120 cap
  (`EN.length + SPAWNQ.length < 120`).

Fields hand-rolled objects forget (all set by `mkEnemy`): `invT` (NaN without it), `acd`
randomized `rr(.3,1.0)` so groups don't swing in sync, `scd` randomized `rr(.5,1.5)`,
`wind/act/rec` zeroed, `phase:0, ph, pats:null`, `onG`, `flash`, random `dir`, `spawnedBy`,
the copied (not referenced) `shoot` block, and every Threat/Echo/elite/depth multiplier.

---

## 3. THE THREE BEATS: `wind -> act -> rec`

State machine at lines 3115–3148, per enemy per frame. Fields on the live enemy: `e.wind`,
`e.act`, `e.rec` (seconds remaining in each), `e.acd` (attack cooldown), `e.swind` (ranged
tell), `e.scd` (shot cooldown), `e.intT` (interrupt-immunity timestamp), `e.invT` (invuln).

`atk` row units: `cd` s between swings; `range` px base reach; `wind` s tell; `act` s live
window; `rec` s spent window (optional — derived if absent); `kb` px/s knockback applied to
the player on hit; `lunge` px/s velocity for the whole active window.

1. **wind** (the tell): starts when `acd<=0 && d < atkReach*0.85 + e.w/2 && invT<=0`. Sets
   `wind=atk.wind` (already floor-clamped by mkAtk), `acd=atk.cd`, and **locks `e.dir` to the
   player's side at that moment** — the lunge commits to the direction the tell pointed;
   re-reading direction later is a tested regression (suite-11 §"lunge commits"). While
   winding: velocity damped ×0.82 (braces), sprite swells up to +28% and strobes
   white/orange, and the ground marker draws `atkReach` filling left-to-right as a countdown.
   No damage.
2. **act** (live): entered when wind expires — `act=atk.act`, `vx = dir*(lunge||160)`. On
   box overlap (`|dx| < (e.w+P.w)/2+6` etc.) the player takes `e.dmg` through `hurtPlayer`
   (armor applies) and `P.vx` gets the `kb` shove; Vampiric heals `e.dmg*0.5`, Hexing applies
   its statuses, Thorns retaliates. Landing a hit — or the window expiring — funnels through
   the single closure `endAct()`: `act=0; rec=(atk.rec)||0.24; vx*=0.35`. Recovery can never
   be skipped by any code path.
3. **rec** (spent): cannot act, cannot turn, decelerates (×0.86/frame), renders sagged +
   desaturated with a pale tick overhead. Takes `RECOVER_DMG = 1.25×` damage (`hurtEnemy`
   line 2748, which also ticks the 'punish' bounty). A spent enemy also cannot shoot, cancels
   a shot already winding (`swind=0`), lays no trail, heals nobody, and a spent BOSS runs no
   ongoing patterns (`bossOngoing` gated on `rec<=0 && wind<=0 && invT<=0`).

Sleep rule (line 3061): beyond 1400px the enemy is skipped — but a frozen `act` would be a
live hitbox with no tell, so falling asleep mid-swing converts to `act=0; rec=atk.rec||0.24`
and wakes up spent. Tested.

**Interrupts** (`onHit()`, lines 2663–2668, verbatim):

```js
 if(a.interrupt&&(e.wind>0||(e.swind||0)>0)&&!e.boss&&perf>=(e.intT||0)){
  e.intT=perf+1.4;
  e.wind=0;e.swind=0;e.act=0;e.rec=Math.max(e.rec||0,(e.atk&&e.atk.rec)||0.3);
  burst(e.x,e.y-e.h/2,'#ffe9a0',8);dmgNum(e.x,e.y-e.h-6,0,'#ffe9a0');toastQ('INTERRUPT')}
 // Stagger lengthens an existing punish window but never creates one, so it cannot chain-lock.
 if(a.stagger&&(e.rec||0)>0)e.rec=Math.min((e.rec||0)+a.stagger,1.2);
```

- Interrupt cancels a melee OR ranged tell, never works on bosses, and has a per-enemy
  cooldown of **1.4 s** (`e.intT`) so a fast weapon cannot lock a creature out of ever
  swinging (suite-11 asserts the second interrupt fails).
- Stagger only extends an already-open `rec`, capped at **1.2 s** total.

**Ground marker** (render, lines 4698–4707): during wind, draws a bar of length
`ECHO.nomark ? 0 : atkReach(e.atk)` on the enemy's facing side, with a filled portion
`reach × t` (t = windup progress) — a countdown AND a distance. Shooter tells strobe the
sprite; the mortar's landing point is a painted `'mark'` hazard. Echo 9 ("Silent") sets
`nomark:1` and removes markers globally.

---

## 4. DEPTH SCALING — the two curves plus the economy curve

Lines 2719–2726, verbatim:

```js
function depthOf(y){return Math.max(0,(y/TILE-SURFACE))}
function depthHP(y){return 1+Math.pow(depthOf(y)/900,1.15)*1.235}  // 1.00 / 2.24 / 6.20 at 0 / 900 / 3140
function depthDmg(y){return 1+Math.pow(depthOf(y)/900,0.85)*0.62}  // 1.00 / 1.62 / 2.79
function depthMul(y){return 1+depthOf(y)/900}
```

- `y` is world **pixels**; `depthOf` converts to metres (= tiles below the surface,
  `TILE=16`, `SURFACE=60`).
- `depthHP` multiplies enemy HP; `depthDmg` multiplies enemy melee/contact damage (at spawn)
  and projectile/vent/thorns damage (at fire time). Deliberately split: deep enemies get
  TOUGHER (6.2× at the 3140m floor) much faster than DEADLIER (2.8×), which is what rewards
  build power. Suite-10 asserts the curve values, monotonicity, `HP > dmg` at every depth
  ≥400m, and clamping above the surface.
- `depthMul` (linear, 4.49× at the floor) is the ECONOMY curve only — shard drops.

**Threat tiers** (lines 1487–1496) modify enemies through `mkEnemy`/`mkAtk` — keys relevant
here: `arm:+6` (II, V), `spd:1.25` and `rec:0.65` (III, V), `elite:2.2` and `dens:1.6`
(IV, V). **No tier defines `wind`** — Threat III shortens RECOVERY, never the tell; suite-10
asserts `THREATS[3].wind === undefined` and `rec < 1`.

**Echo ladder** (lines 1504–1515) stacks the first N rules (wrapping, self-stacking):
enemy-relevant keys `hp:1.30` (Thick), `dens:1.30` (Crowded), `dmg:1.15` (Keen), `arm:+6`
(Warded), `spd:1.14` (Swift), `wound:1` (Hollow — every kill leaves a bleed hazard,
`killEnemy` line 2775), `nomark:1` (Silent — no ground markers). Aggregated once into the
global `ECHO` by `refreshEcho()`; `mkEnemy` reads `ECHO.hp/dmg/arm/spd`, `genChunk` reads
`ECHO.dens`, drops read `ECHO.shard`.

Application map (who multiplies what):

| live stat | table | depth | elite | Threat | Echo |
|---|---|---|---|---|---|
| `e.hp` | `hp` | `depthHP(y)` | `el.hp` | — | `ECHO.hp` |
| `e.dmg` (melee/contact/trail/burst/split base) | `dmg` | `depthDmg(y)` | `el.dmg` | — | `ECHO.dmg` |
| projectile dmg | `shoot.dmg` | `depthDmg(e.y)` at fire | **not applied** | — | **not applied** |
| `e.arm` | `arm` | — | `+el.arm` | `+T.arm` | `+ECHO.arm` |
| `e.spd` | `spd` | — | `el.spd` | `×T.spd` | `×ECHO.spd` |
| `atk.wind` | `wind` | — | — | `×T.wind` (none defined) then floor 0.26 | — |
| `atk.rec` | `rec` (or derived) | — | — | `×T.rec` then floor 0.10 | — |

---

## 5. BOSS PHASES — `ph`, `bossPhase()`, `bossOngoing()`, the seven patterns

Bosses (`boss:1`) fight in up to three phases. `bossPhase(e)` is called from `hurtEnemy` —
**only while `e.hp > 0`** (a corpse must not change phase; tested regression). Crossing an
`ph[phase].at` HP fraction: `phase++`, `invT=0.9` (roar invuln), the pattern is **pushed**
onto `e.pats` (accumulating — phase 3 = base + both patterns), `patT[pat]=0.8` so the first
ongoing tick comes quickly, the live `shoot.cd` drops ×0.75, `scd` clamps to ≤0.5, big FX,
and `toast(TYPE + ' — ' + PAT_NAME[pat])`. Then `bossPattern(e,pat)` fires one transition
burst.

`bossPat(e,pat)` tests membership of `e.pats`. `bossOngoing(e,dt,dx,dy,d)` runs every frame
the boss is *not* winding/spent/invulnerable, ticking each unlocked pattern on its own timer.
`dx,dy,d` describe the AGGRO target (may be the Decoy); patterns that must hit the PLAYER
recompute `pdx/pdy/pd` from `P` directly.

The seven patterns (transition burst → ongoing behaviour):

| pat | transition burst (`bossPattern`) | ongoing (`bossOngoing`) |
|---|---|---|
| `slam` | `bossSlam(e)`: shake 16, hitstop, `addHaz(e.x, e.y+h/2, r110, 0.55s, e.dmg*0.8, null, …, 'shock')` (a jumpable floor shockwave, enemy-side), `carve(e.x, e.y+TILE, TILE*4, 1)` | Not timer-based: every completed melee swing ends in a slam (`e.slammed` guard in the act branch, line 3135). |
| `volley` | `bossRing(e,14,220,0.5)` — 14-bolt ring, 220 px/s, `e.dmg*0.5` each | Every 4.6 s if `d<620`: ring of 12 (18 once `phase>=2`) at 240 px/s, `e.dmg*0.42`. |
| `spores` | 10 lobbed gravity projectiles, `e.dmg*0.4`, explode r26 | Every 3.2 s if player within 520: drops a chill cloud hazard ON the player (`r42, 5.0s, e.dmg*0.22, {chill:0.7}`) — area denial punishing standing still. |
| `firewall` | 7 rising projectiles across 26px spacing, `e.dmg*0.45`, explode 34, burn `e.dmg*0.3` | Every 0.34 s while moving (or 30% chance): fire hazard under itself (`r26, 3.4s, e.dmg*0.30, burn e.dmg*0.35`) — a burning trail. |
| `summon` | `bossSummon(e,3)` | Every 5.5 s: counts own live adds (`spawnedBy===e.type`); if `< 4`, summons 1. Cap tested. |
| `beam` | cosmetic (shake + burst) | Every 5.2 s if `d<620`: locks aim line for 0.9 s (`beamT/beamA`, telegraphed by a rendered line), then fires 3 piercing bolts at 760 px/s, `e.dmg*1.15`, `pierce:9`, `{shock:1.3}`. You had 0.9 s to leave the line. |
| `devour` | cosmetic (shake + burst) | Every 6.4 s if player within 340: inhales for 1.1 s, dragging the player (pull 520 px/s² inside 300px), then bites — `addHaz(e.x,e.y, r120, 0.4s, e.dmg*1.4, {chill:0.55}, …, 'shock')`. Flight is the counterplay. |

`PAT_NAME` (line 2962) supplies the player-facing callout for every pattern; suite-10
asserts each implemented pattern has one and every `ph[].pat` string names an implemented
pattern.

`bossSummon(e,n)` (verbatim core, line 2987):

```js
function bossSummon(e,n){
 const t=BIOMES.find(b=>b[1]===biomeName(Math.floor(e.y/TILE)));
 const types=(t&&t[4])||['crawler'];
 const mh=depthHP(e.y),md=depthDmg(e.y);
 for(let k=0;k<n;k++){const ty=types[ri(0,types.length-1)],E2=ENEMIES[ty];
  // Through mkEnemy, or the boss's own reinforcements are the weakest things in the room at
  // Threat V and Echo 20 — the exact inverse of what those ladders are for.
  queueEnemy(mkEnemy(ty,e.x+rr(-60,60),e.y-20,null,threat(),e.type))}
 burst(e.x,e.y,'#fff',18);sfx('gem')}
```

Summons draw from the CURRENT biome's roster, spawn through `mkEnemy` (so they inherit
depth, Threat and Echo — suite-11 asserts an Echo-8 summon has more HP than an Echo-0 one),
and are tagged `spawnedBy = boss type` for the ≤4 cap.

**Adding a NEW pattern** (the only place enemy content legitimately touches code): (1) pick a
name; (2) add its transition burst branch in `bossPattern`; (3) add its ongoing branch in
`bossOngoing` with its own `tick(name, period)` timer; (4) add a callout line to `PAT_NAME`;
(5) reference it from some boss's `ph`; (6) extend suite-10's `impl` list
(`['slam','volley','spores','firewall','summon','beam','devour']`) or the "every named
pattern is implemented" assertion fails. Area denial inside a pattern MUST be `addHaz`
(rule 19); projectile bursts must respect `PROJ.length<220`; anything player-targeted must
measure `P`, not the aggro args (Decoy bug, comment at line 3002).

---

## 6. ELITES

Table verbatim (lines 978–995):

```js
const ELITES=[
 {id:'swift',   n:'Swift',    c:'#6ad0e0', hp:1.2, dmg:1.1, spd:1.7, bad:'fast'},
 {id:'armored', n:'Armored',  c:'#9aa0b0', hp:3.0, dmg:1.2, spd:0.8, arm:9},
 {id:'volatile',n:'Volatile', c:'#e07a3f', hp:1.5, dmg:1.3, spd:1.1, boom:56},
 {id:'vampiric',n:'Vampiric', c:'#c04a70', hp:2.0, dmg:1.4, spd:1.0, drain:1, bad:'ranged'},
 // ---- second wave: modifiers you have to play around rather than out-stat ----
 // Frenzied inverts the usual ending: the fight gets HARDER as you win it, so committing to the
 // kill is a real decision instead of the obvious one.
 {id:'frenzied',n:'Frenzied', c:'#e0a03f', hp:1.6, dmg:1.15,spd:1.0, frenzy:1},
 // Roiling turns the arena against you over time — you cannot kite it in a circle forever.
 {id:'roiling', n:'Roiling',  c:'#8fdc6a', hp:1.8, dmg:1.1, spd:0.95,
   trail:{every:.7,r:24,t:3.5,dmg:.18,st:{bleed:.4},col:'#8fdc6a',kind:'gas'}},
 // Hexing makes it a status problem: chill slows you into the next hit, shock deepens it.
 {id:'hexing',  n:'Hexing',   c:'#c98fe0', hp:1.7, dmg:1.0, spd:1.05, hex:{chill:.6,shock:1.3}},
 // Gilded is the one the PLAYER chooses to take on: much more loot, much more enemy. A risk you
 // can walk away from is worth more than a reward you cannot refuse.
 {id:'gilded',  n:'Gilded',   c:'#d8a53f', hp:2.6, dmg:1.2, spd:1.0, arm:4, loot:3.2},
];
```

Elite row fields: `id`, `n` (toast name), `c` (body colour override — the elite is
COLOUR-coded), `hp/dmg/spd` multipliers, `arm` flat add, and one mechanic field: `boom`
(corpse explodes radius px for `e.dmg*1.2`, hurts the player too), `drain` (heals
`e.dmg*0.5` per landed melee/contact hit), `frenzy` (movement speed and cooldown tick rate
scale ×`1+(1-hp/maxhp)*0.9` as it dies — suite-11 asserts the ramp ≥1.4× near death),
`trail` (same shape as the species field; damage ratio of `e.dmg`), `hex` (statuses applied
to the player on hit), `loot` (shard multiplier, and gilded elites drop a gem 80% instead of
35%), `bad` (fairness tag, see below).

**Fairness — `eliteFor(E)`** (verbatim, lines 1002–1009):

```js
// Elites are rolled from what is FAIR on that creature, not from the whole list.
function eliteFor(E){
 const ok=ELITES.filter(m=>{
  if(m.bad==='ranged'&&E.shoot)return false;      // heals itself out of your reach
  if(m.bad==='fast'&&E.spd>=90)return false;      // already faster than the tell
  if(m.trail&&E.trail)return false;               // two trails is one trail and a frame cost
  return true});
 return ok.length?ok[ri(0,ok.length-1)]:null}
```

Legality rules, with the why:
- `bad:'ranged'` (Vampiric) is barred on any creature with a `shoot` block — it would heal
  itself from a distance you cannot punish.
- `bad:'fast'` (Swift) is barred on any creature with `spd >= 90` (currently delvemite 96,
  stalker 118) — 1.7× on those is a coin flip, not a modifier.
- A trail-carrying modifier (Roiling) is barred on trail-carrying species (bloomback) — two
  trails is one trail and a frame cost.
- Bosses never roll elite at all (checked at the spawn site, not in `eliteFor`).
Suite-11 brute-forces 300 rolls per creature and fails on any unfair pairing; it also
asserts a ranged enemy can still BE elite and Vampiric is still reachable on melee.

**Spawn odds** (`spawnFromChunks`, line 2905): `eliteP = min(0.55, (0.02 + depthTiles /
WORLD_H * 0.55) × (threat().elite||1))` — ~2% shallow to ~22% at the floor, ×2.2 at Threat
IV/V, hard-capped 55%. Only non-boss, non-pack-member spawns roll (`!s.pk`) — **only a pack
LEADER may be elite** (tested: at most one non-`pk` member per delvemite pack per chunk).
`mkEnemy` applies the row: size ×1.15, colour override, stat multipliers.

Payouts: XP ×2.5, shards ×`(loot||3)`, gem drop 35% (80% gilded), gear drop chance 10%
(vs 3.5%) at rarity bias 2.

---

## 7. ENCOUNTER COMPOSITION — `enemyCost` and the threat budget

**Cost is derived from the row itself** so it cannot drift when stats are retuned
(verbatim, lines 996–1001):

```js
// What one of these is WORTH in an encounter, derived from its own stats rather than hand-kept in
// a parallel table that would drift the moment anything is retuned. `cost` overrides it if a
// creature is worth more than it looks (a support unit is, which is why it carries a surcharge).
function enemyCost(ty){const E=ENEMIES[ty];if(E.cost!==undefined)return E.cost;
 const c=E.hp/40+E.dmg/14+(E.arm||0)/7+(E.shoot?0.8:0)+((E.heal||E.ward)?1.6:0)+(E.pack?E.pack*0.25:0);
 return Math.max(0.5,Math.round(c*10)/10)}
```

**The budget loop** (`genChunk`, lines 1796–1833). Per 48×48-tile chunk below the surface:

- Budget: `(3.0 + depthM/900 × 2.8) × (threat().dens||1) × (ECHO.dens||1)` where `depthM`
  is the chunk-centre depth in tiles. So ~3.0 at the surface to ~12.8 at the floor before
  Threat/Echo density.
- Loop while `budget > 0.9 && placed < 8` (guard 40 iterations): candidates are the biome
  roster entries with `cost <= budget + 0.4`; **a group never contains more than ONE support
  unit** (`(E.heal||E.ward) && supports>=1` → excluded); repeats are discouraged by weight
  `1/(1 + timesUsed × 1.8)`; the weighted draw and all placement rolls come from the
  **`spawn` strand only** (`rS('spawn',…)`) — suite-11 fingerprints this (rerolling `poi` or
  `ore` seeds must not move a single monster; rerolling `spawn` must).
- Placement: up to 26 tries for a standing spot (air above solid); a failed search retries
  the whole draw rather than abandoning the encounter (a bail-out here once silently emptied
  the world).
- Packs: `pk = (pack||1) + (threat().dens>1 && pack ? 1 : 0)` bodies, written into the chunk
  spawn list as a group (leader `pk:0`/absent, members `pk:1`); a pack cannot straddle the
  8-body chunk cap (`placed+pk>8` → skip).
- Camp exclusion: nothing within 20 tiles of `CAMP_X` near the surface.

**Boss arenas** (lines 1867–1876): one miniboss per band via
`const BIOME_BOSS={caves:'warden',fungal:'sporemother',ruins:'sentinel',forge:'forgelord',abyss:'voidmaw'};`
— a 26×16 arena is stamped when `hashS('boss', cx*17+11, cy*17+6) < 0.045` (the `boss`
strand), and the boss id is pushed as a spawn.

**Spawn realization** (`spawnFromChunks`, 2889–2916): when a chunk first enters the 3×3
neighbourhood, its spawn list becomes live enemies via `mkEnemy(stype, s.x, s.y, el, T,
s.by||null)`. At the EN cap (120; 124 for a boss) it evicts the farthest non-boss sleeper
beyond 1400px rather than refusing the near spawn. Dissonance ≥45 ("Bleeding",
`dissBleed()` up to 0.45) substitutes a random non-boss species from ANY biome roster before
stats resolve — the intruder brings its own stats.

---

## 8. SPLITS AND SUMMONS MUST ROUTE THROUGH `mkEnemy` (this was a real bug)

Both were once hand-rolled, which made a boss's reinforcements the weakest things in the
room at Threat V / Echo 20 and leaked NaN through missing `invT`. The only correct shapes:

Voidspawn split (verbatim, `killEnemy`, lines 2786–2790):

```js
 // Void spawn: splits into halves, so killing it fast in a corner is a mistake.
 if(D.split&&!e.isSplit){
  for(let i=0;i<D.split;i++)
   queueEnemy(Object.assign(mkEnemy('voidling',e.x+rr(-14,14),e.y-6,null,threat(),null),
    {vx:rr(-90,90),vy:-140,dir:i?1:-1,isSplit:1}))}
```

Pattern to copy: build via `mkEnemy`, THEN `Object.assign` the launch velocity / flags on
top, and enqueue with `queueEnemy` (you are inside an `EN` iteration — pushing directly
mutates the array mid-loop). The `isSplit:1` flag on the children is what stops a
splitter-of-splitters recursion. Boss summons: see `bossSummon` in §5 — same contract, plus
the `spawnedBy` tag that the ≤4 adds cap counts.

Suite-11 regression assertions: a killing blow on a boss unlocks no phase and summons no
wave; summons at Echo 8 have more HP than at Echo 0.

---

## 9. REGISTERING A NEW ENEMY END-TO-END (every place the id must appear)

Enemies are **not** in the shard unlock pool and have no drop-pool entry — loot flows
automatically from the `shards` field and `killEnemy`. The full checklist:

1. **`ENEMIES` row** (~line 869 block) — the id and every field from §1. Keep `atk.wind ≥
   0.26` in spirit (mkAtk clamps anyway) and `shoot.wind ≥ 0.26` in FACT (nothing clamps it).
   Keep `atkReach(atk) = range + lunge*act ≤ 78` for a grunt, `≤ 105` for a boss (suite-10).
2. **Biome roster** — add the id to the fifth element of the right `BIOMES` row(s)
   (line 585: `[maxY, name, groundTile, caveScale, enemyTypes]`). This is the ONLY thing
   that makes it spawn (budget draw, dissonance bleed, and boss summons all read `b[4]`).
   Check the roster still satisfies suite-11's band rules (§10.2) and that your new row does
   not silently become the band's `toughest` (highest hp) or `deadliest` (highest dmg) —
   suite-10's TTK/TTD lookups re-derive those and will re-aim the balance bands at YOUR row.
3. **Sprite** — add an `SPR[id]` entry (character grid + ramp, §SPRITES, line 312). Suite-8
   fails without it: *every* enemy must have a sprite; frames must be rectangular; only
   palette chars `. o 1-5 S B G R E` (space allowed); the ramp must exist and stay well
   below the hero ramp's luminance; ramp step 1 must clear 3:1 contrast against the ground
   tile of every biome the enemy spawns in (2.4:1 against the lit tile edge); and **no two
   enemies in the same biome may share a top-2-row silhouette shape**. Family law: beasts =
   two horns w/ gap + 4 legs, constructs = flat overhang + 2 ground blocks, swarm = domed no
   top feature, wraith = single tapered spike + floats.
4. **Bestiary** — add `LORE.enemy[id] = {n, d}` (line 1130). Suite-8: "every enemy has a
   bestiary entry".
5. **If it's a boss** — `boss:1`, a `ph` list naming only implemented patterns, and a
   `BIOME_BOSS` mapping (line 1010) if it owns a band. Distinct-boss threat unlocks count
   `Object.keys(META.bosses)` against `THREATS.length`.
6. **If it carries a new mechanic field** — consume the field in ONE place in
   `upEnemies`/`hurtEnemy`/`killEnemy` keyed off the field (never off the id), and consider
   `eliteFor` fairness: if the mechanic clashes with an elite modifier, bar it there (the
   trail/trail exclusion is the template).
7. **Tests** — extend suite-11 with a behaviour assertion for any new role (copy the chanter
   /warder blocks), and re-run `./test/run.sh` — suites 8, 10, 11 all iterate the full
   `ENEMIES` table and will judge the new row with zero further wiring.
8. **Regenerate** `design/CURRENT-STATE.md` via `./design/audit.sh`.

The codex/bestiary UI, drops, XP, discovery (`discover('en', id)` on first kill), the
threat-budget cost, and elite rolls all pick the row up automatically.

---

## 10. TEST CONSTRAINTS — exact numbers, per suite

Run: `./test/run.sh 10` etc. from `shardfall/`.

### 10.1 Suite-10 (combat foundations) — `test/suite-10.js`

Telegraph honesty:
- `atkReach === range + lunge×act` exactly; `atkReach(null) === 0`.
- **Max grunt reach ≤ 78 px** ("was 93 on rockling"); **max boss reach ≤ 105 px**.
- For every enemy with `atk`: `atkReach(E.atk) >= E.atk.range`.

Windup floor:
- min `mkAtk(E.atk, THREATS[0]).wind ≥ 0.26` AND min at `THREATS[5]` ≥ 0.26 (i.e. every
  windup clears the floor at Threat 0 and Threat V).
- `THREATS[3].wind === undefined && THREATS[5].wind === undefined` — **no Threat tier may
  ever shorten a windup**; `THREATS[3].rec < 1 && THREATS[5].rec < 1` — they shorten
  recovery instead.
- A table wind of 0.10 clamps UP to exactly `WINDUP_FLOOR`.

Punish window:
- The three beats are observed in sequence on a live crawler; a spent enemy cannot begin a
  new windup; hitting a spent enemy pays exactly `RECOVER_DMG = 1.25×` (tolerance 0.02);
  a spent shooter fires nothing until `rec` expires.

Armour: `applyArmor` floor — never removes more than 78% of a hit (`ARMOR_MIN_FRAC=0.22`,
proportional), absolute floor 1; enemy armour obeys the same floor (Armoured elite is a
wall, not an immunity).

Depth curves: `depthHP/Dmg(0m)=1`; `depthHP(900m)≈2.25 ±0.15`; `depthDmg(900m)≈1.62 ±0.1`;
`depthHP(3140m)≈6.2 ±0.4`; `depthDmg(3140m)≈2.8 ±0.2`; `depthHP > depthDmg` at 400/900/
1600/2400/3140m; HP curve monotone in 40m steps; above-surface clamps to exactly 1.

**TTK/TTD bands** (the balance contract). For each class in
`['vanguard','marksman','pyromancer','delver']`, at each band:

```js
const BANDS = [
  { m: 200,  biome: 'caves',  grunt: 'crawler',   lvl: 4,  tree: 1, gems: 1, tier: 1, boons: 0 },
  { m: 700,  biome: 'fungal', grunt: 'sporeling', lvl: 7,  tree: 2, gems: 2, tier: 1, boons: 1 },
  { m: 1200, biome: 'ruins',  grunt: 'archer',    lvl: 10, tree: 3, gems: 2, tier: 2, boons: 2 },
  { m: 1900, biome: 'forge',  grunt: 'ember',     lvl: 12, tree: 4, gems: 3, tier: 2, boons: 3 },
  { m: 2800, biome: 'abyss',  grunt: 'voidspawn', lvl: 14, tree: 5, gems: 3, tier: 3, boons: 4 },
];
```

with `tough` = the band roster's highest-`hp` species and `deadly` = its highest-`dmg`
species, **looked up live from `BIOMES`/`ENEMIES`** (so a new row can silently become the
target of these assertions). A reference build is assembled per band (class kit; gear magic
by ruins/rare by forge; supports `conc/fasteratk/addedfire` at the band's gem tier; tree
spend; `RUNB.dmg = 0.15×⌊lvl/2⌋ + 0.25×boons`, `hp = 30×⌊lvl/3⌋`, `cdr = 0.12×⌊lvl/4⌋`,
`crit = 0.06×⌊lvl/5⌋`, `critMult = 0.35×⌊lvl/6⌋`). Elite model: HP ×3, armor +9. Bands
enforced for EVERY class at EVERY depth:

- **Trash grunt dies in 1–6 hits.**
- **The band's toughest grunt dies in 3–16 hits.**
- **The player survives 4–20 hits from the band's deadliest enemy** (TTD =
  `ceil(P.maxhp / applyArmor(E.dmg × depthDmg, P.armor))`).

Boss phases: patterns accumulate and are remembered (`slam` then `summon` on the warden,
never replaced); ongoing summon trickles adds and holds `spawnedBy` count ≤ 4 over 12 s;
every `ph[].pat` is in `['slam','volley','spores','firewall','summon','beam','devour']` and
has a `PAT_NAME` entry; `bossSlam` leaves exactly one `'shock'` hazard with `friendly: 0`.

Hazards: placeable, damages only while inside, expires, `HAZ.length` hard-capped at
`HAZ_MAX=64` (90 s of forgelord firewall+slam stays inside it, no NaN).

Integrity: a fully tiered Threat-V build produces finite `dmg/cd/crit/critMult`.

### 10.2 Suite-11 (the roster) — `test/suite-11.js`

Role coverage (per biome except `surface`), where the roles are defined as:

```js
const ROLES = {
  swarm:   t => ENEMIES[t].pack,
  bruiser: t => ENEMIES[t].hp >= 70,
  ranged:  t => ENEMIES[t].shoot,
  support: t => ENEMIES[t].heal || ENEMIES[t].ward,
  denial:  t => ENEMIES[t].trail || ENEMIES[t].burstOnDeath || (ENEMIES[t].shoot && ENEMIES[t].shoot.explode),
  terrain: t => ENEMIES[t].phase || ENEMIES[t].burrows,
};
```

- Every band: **≥ 3 creature types**; max effective bulk (`hp × (1 + arm/8)`) **≥ 3× the
  band's minimum** (something actually tough relative to its own trash); **at least one
  shooter**; **≥ 3 distinct roles**.
- Globally: ≥ 2 bands contain a support unit; every named role exists on some non-boss
  species.

Healer (chanter): heals the most-wounded ally in range; healing stops when the chanter
dies; never overshoots `maxhp`; a lone chanter cannot heal itself. **The output formula the
code uses now** (verbatim, line 3081):

```js
     const amt=Math.min(e.maxhp*ED.heal.amt,t.maxhp*(ED.heal.cap||0.25));
```

`e` is the HEALER, `t` the target — output scales with the chanter's own depth-scaled
`maxhp` (so it grows with depth like everything else), capped as a fraction of the target so
it still reads as a big heal on something small. The regression that motivated it: healing
was once a fraction of the TARGET, so a chanter healed a voidmaw at 249 hp/s. Asserted
bands, at 2600m with a voidmaw: heal rate **> 0** (it must be a real support unit) and
**< 90 hp/s** (it must not outheal a build); on a brute-sized target it must restore
**> 15% of maxhp within 3 s**.

Warder: warded damage `< 0.9×` bare (worth noticing); warders never ward each other (the
unwarded warder is the encounter's correct opening move — asserted: a second warder takes
≥ 99 of a 100 hit).

Mortar: winding paints exactly one `'mark'` hazard, `dmg === 0`, within 2px of the player's
position; the shell arcs (`grav > 0`) and lands within **40 px of the marker** even after
the player moves 300px; an orphaned marker expires without dealing damage.

Burrower: closes distance through solid rock and reduces the solid-tile count on the way
(the tunnel persists); cannot chew bedrock (carve's hardness gate).

Bloomback: sheds `friendly:0`, `dmg>0` hazards while moving; 12 more seconds stays ≤
`HAZ_MAX`; **a spent bloomback (rec>0) lays nothing** and resumes after recovery.

Delvemite: `pack >= 3`; `enemyCost('delvemite') < enemyCost('brute')`; arrives ≥ 3 in one
chunk out of the real generator.

Elites: ≥ 8 modifiers; 300 rolls per creature produce zero unfair pairs (the three
`eliteFor` rules); frenzied cooldown tick at 5% HP is > 1.4× the full-HP tick; gilded has
`loot > 1` and `hp > 2`.

Encounters: every band averages **> 0.8 hostile spawns/chunk**; **never more than 8 bodies
in one chunk**; **never 2 support units in one group**; threat spend per chunk is
non-decreasing with depth (tolerance −0.25); the spawn fingerprint changes ONLY when
`WEAVE.spawn` is rerolled (never for `poi` or `ore`).

Integrity: 45 s with one of every new unit at Threat V — no NaN anywhere, `EN ≤ 120`,
`PROJ ≤ 220`, `HAZ ≤ HAZ_MAX`.

Regressions (each shipped once): corpse never changes phase or summons; an exploding
projectile still pays leech/Focus/riders; summons inherit the Echo ladder; the second
interrupt inside 1.4 s fails; sleeping mid-swing drops the live window and wakes spent; the
lunge goes where the tell pointed even if you cross behind during the windup; only a pack
leader is elite-eligible (≤ 1 non-`pk` member per pack).

### 10.3 Suite-8 (sprites/codex) — enemy-relevant assertions

Every `ENEMIES` key has an `SPR` entry and a `LORE.enemy` entry; ramps are 5 monotone-
darkening steps; no ramp's top step reaches 65% of the hero ramp's luminance; every enemy's
ramp clears 3:1 against the ground colour of every biome it is rostered in (2.4:1 lit); no
two enemies in one biome share a top-2-row silhouette (rows compared with all colour chars
collapsed to `#`); frames rectangular; only legal palette characters; killing a boss raises
`META.maxThreat` once per distinct boss type.

### 10.4 Harness traps that specifically bite enemy tests

From `CLAUDE.md`: hand-built enemies without `invT` produce NaN — use `mkEnemy`/`mkAtk` or
the suite's `mkE` stub; deep test positions are solid rock — carve a floor (`OFF()`
pattern); `EN[0]` is not your enemy (world spawns get there first — `EN.length=0` and keep
your reference); camp regen (12 hp/s) masks damage assertions; teleporting kills the player
via fall damage (`P.vy=0; P.noFall=1; P.dead=false; P.hp=P.maxhp`); Echoes/Threat persist in
`META` — reset `META.echoLv`, `META.maxEcho`, `META.threat` after a block; deferred spawns
need `flushSpawns()` before you count `EN`.
