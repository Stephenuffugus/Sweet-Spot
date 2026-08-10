# SHARDFALL content reference — ITEMS / GEMS / BUILDCRAFT

Ground truth extracted from `/workspaces/Sweet-Spot/shardfall/index.html` (single-file game,
all content in the DATA TABLES section starting line ~280) and the test suites in
`/workspaces/Sweet-Spot/shardfall/test/`. Line numbers cited are as of commit `3c446e9`.
This doc is a contract: everything here was read from the consuming code, not from field names.

The laws that bind every entry in this doc (CLAUDE.md, `/workspaces/Sweet-Spot/shardfall/CLAUDE.md`):

- **Rule 4** — content is a table entry, never an `if (gemId==='x')` branch. The two sanctioned
  exceptions in this layer: live-state conditionals (they set a field on the attack object `a`
  and resolve inside `condMul()/onHit()/onKill()`), and ability effects (a dispatch branch on
  `a.fx` inside `useAbility()`).
- **Rule 5** — two damage pools, never mixed. `inc(key)` is additive (gear affixes, meta tree,
  class passives, boons, attunements): `1+Σx`. `a.more` is multiplicative (support gems,
  uniques, modifier affixes): `Π(1+x)`. They combine in exactly one place, `resolveDmg()`,
  as `base × (1+inc) × more`. A support gem that touches `a.dmg` is a bug. A SKILL gem may
  rewrite `a.dmg` — it *is* the attack.
- **Rule 6** — sockets hold `{id, tier}` (or a bare string from v1 saves). Read through
  `gemId(g)` / `gemTier(g)` / `gemOf(g)` (index.html:1988-1990). Raw `GEMS[socketValue]` is a bug.
- **Rule 16** — conditional damage lives in `condMul()`, on-hit riders in `onHit()`, on-kill in
  `onKill()`; `strike()` AND `projStrike()` call all three. Suite 13 asserts melee/ranged parity.
- **Rule 17** — `mkItem(base, rarity, ilvl)`; ilvl is depth in metres and gates affix tiers,
  modifier affixes, the base pool and rarity odds. A drop site that forgets to pass ilvl
  silently falls back to `ilvlAt(P.y||0)`.
- **One id namespace** — no id may exist in both `GEMS` and `GEAR` (unlock ids are shared across
  both tables). suite-7 §13d asserts: `Object.keys(GEMS).filter(g => GEAR[g])` must be empty.
  This is why the Chain support is `chainbolt` — `chain` was already Chainmail.

Style: table entries are terse, dense, single-space-indented. Match what's there.

---

## 1. GEMS — the table (index.html:600-754)

`const GEMS = { id: {entry}, ... }`. One flat object holds all four gem types. Common fields:

| field | required | meaning |
|---|---|---|
| `t` | yes | type: `'skill'` \| `'sup'` \| `'aura'` \| `'abil'` |
| `for` | yes | slot restriction: `'melee'` \| `'ranged'` \| `'any'` (skill/sup) \| `'armor'` (aura/abil — always `'armor'`) |
| `n` | yes | display name (shop, socket screen, item socket line) |
| `col` | yes | socket color: `'r'` (Might) \| `'g'` (Finesse) \| `'b'` (Focus). **suite-7 fails any gem without `col`** — it could never be socketed |
| `d` | yes in practice | one-line description; read by the shop and the socket screen (`socketGem`) |
| `mod` | skill/sup only | `a => { ... }` — mutates the attack object. Auras have NO `mod`; abils have no `mod` either |
| `cd` | abil only | ability cooldown, **seconds** (before CDR). suite-7 asserts `cd > 0` for every abil |
| `fc` | abil only | Focus cost per use, points of a 100-point bar. suite-7 asserts `fc >= 0` |
| `fx` | abil only | dispatch key: names the `else if (a.fx==='...')` branch inside `useAbility()`. suite-7 asserts present |

### 1.1 How `for` gates application

In `computeAttack` (index.html:2229-2230) a skill or support only applies when
`G.for === kind || G.for === 'any'` where `kind` is `'melee'` or `'ranged'` (a shield is always
`kind === 'melee'`, even in the ranged slot). A gem socketed into the wrong kind of weapon
**silently no-ops** — it is not an error, it is a wasted socket. The socket UI does not prevent
this; only color is enforced at placement time.

### 1.2 Verbatim samples — copied character-for-character

**Skill, melee** (index.html:752-753) — shows dmg/cd rewriting, interrupt+stagger riders,
arc floor-raising via `Math.max`, and a status-ratio rider:

```js
 rend:     {t:'skill',for:'melee',n:'Rend', col:'r', d:'slow, huge, always interrupts',
   mod:a=>{a.dmg*=2.3;a.cd*=1.9;a.interrupt=1;a.stagger=(a.stagger||0)+0.35;a.arc=Math.max(a.arc,120);a.kb*=1.5;a.stR=a.stR||{};a.stR.bleed=Math.max(a.stR.bleed||0,0.35)}},
```

**Skill, ranged** (index.html:675-676) — shows the projectile contract fields (grav, bounce,
explode, life, col):

```js
 grenade:  {t:'skill',for:'ranged',n:'Grenade', col:'r', d:'lobbed, bounces, explodes',
   mod:a=>{a.dmg*=1.7;a.speed*=0.62;a.grav=1;a.bounce=2;a.explode=58;a.cd*=1.25;a.life=1.6;a.col='#e0a03f'}},
```

**Support, flat `more`** (index.html:626-627) — the "number" kind; note damage goes through
`a.more`, never `a.dmg`:

```js
 heavyimpact:{t:'sup',for:'melee',n:'Heavy Impact', col:'r', d:'+45% more damage, slower',
   mod:a=>{a.more*=1.45;a.kb*=1.6;a.cd*=1.35}},
```

**Support, contract-changer** (index.html:616-617) — changes what the attack IS, pays in `more`:

```js
 multishot:{t:'sup',for:'ranged', n:'Multishot', col:'g', d:'3 projectiles, 30% less damage',
   mod:a=>{a.count=3;a.more*=0.7}},
```

**Support, live conditional** (index.html:698-699) — sets a field that `condMul()` reads at
strike time; note the additive-accumulate pattern `(a.x||0)+v` so two copies stack:

```js
 momentum: {t:'sup',for:'any', n:'Momentum', col:'g', d:'damage scales with move speed',
   mod:a=>{a.momentum=(a.momentum||0)+0.75;a.more*=0.85}},
```

**Aura** (index.html:709) — NO `mod`. The entry is only a registration; the effect lives at the
consuming site(s) as `auraHas('bloodscent')` checks (here: inside `condMul()`, ×1.3 vs bleeding
or burning):

```js
 bloodscent:{t:'aura',for:'armor',n:'Bloodscent', col:'r', d:'+30% vs bleeding or burning'},
```

**Ability** (index.html:746) — table declares cost/cooldown/dispatch key only; effect is a
branch (see §5):

```js
 crucible: {t:'abil',for:'armor',n:'Crucible', col:'b', cd:13, fc:50, fx:'crucible', d:'lay a burning field'},
```

### 1.3 The FULL effect-field vocabulary of the attack object `a`

This is the composition alphabet. `mod(a)` receives the attack object mid-pipeline. Fields it
may read/write, with the code that consumes each:

**Base numbers** (seeded by `baseAttack()` from the gear base, index.html:2200-2203):

| field | kind | unit / meaning | consumer |
|---|---|---|---|
| `kind` | both | `'melee'`\|`'ranged'`\|`'abil'` — set by the pipeline; never change it in a mod | everywhere |
| `dmg` | both | base hit damage. **Skills multiply it; supports/uniques must not** | `resolveDmg`, `strike`, `projStrike` |
| `cd` | both | seconds between attacks. Any gem may multiply. Later divided by `(1+inc('cdr'))` | `doMelee`/`doRanged` set `P.mcd`/`P.rcd` |
| `more` | both | THE multiplicative pool, starts 1. Write `a.more*=x` | `resolveDmg` |
| `inc` | both | additive pool seed, starts 0; leave alone (resolveDmg fills from `inc()`) | `resolveDmg` |
| `range` | melee | reach, px | `doMelee` hit test, chest-open reach, dig position |
| `arc` | melee | total swing arc, **degrees** (360 = all around). Raise with `Math.max(a.arc,x)` so a wider base isn't shrunk | `doMelee` cone test |
| `kb` | both | knockback impulse, px/s | `strike(e,a,±a.kb)` |
| `speed` | ranged | projectile speed, px/s | `doRanged` velocity |
| `pierce` | ranged | enemies a projectile passes through (int). `+= n` pattern | `upProj` |
| `count` | ranged | projectiles per shot, fanned 0.18 rad apart | `doRanged` |
| `explode` | both | blast radius px; 0/undefined = none. On melee, each struck enemy detonates at 60% dmg (skips the struck enemy). Raise with `Math.max(a.explode||0,x)` | `doMelee`, `upProj`, `explode()` |
| `col` | both | hex color string for projectile/fx | render, dmg numbers |

**Projectile behavior contract** (set by skills/supports; copied onto each projectile at fire
time in `doRanged`, index.html:2616-2625):

| field | meaning | consumer |
|---|---|---|
| `life` | projectile lifetime seconds (fire time uses `t: a.life||2`) | `upProj` |
| `grav` | `1` ⇒ arcs under `GRAV*0.55` (grenade/hail/mortar class) | `upProj` |
| `bounce` | int, bounces off terrain that many times | `upProj` |
| `homing` | steering strength (Wisp uses 3.2); seeks nearest enemy ≤260px | `upProj` |
| `fork` | `1` ⇒ splits into two at ±0.5 rad on first hit, then dies | `upProj` |
| `ret` | px travelled before boomeranging back to the player (clears `hitList` so it re-hits) | `upProj` |
| `dig` | max tile hardness broken (see GEAR `dig`); melee: swing carves in front; ranged: needs `digR` to tunnel; also passed to `explode()`'s carve | `doMelee` carve, `upProj`, `explode` |
| `digR` | carve radius px. On melee defaults to `TILE*1.5`; on a projectile its presence makes it a tunneler (not stopped by terrain) | `doMelee`:2567, `upProj`:3196 |
| `digCost` | projectile lifetime seconds paid **per tile carved** (`p.t -= digCost*cut`) | `upProj`:3198 |

**Skill-only mechanics:**

| field | meaning | consumer |
|---|---|---|
| `chan` | Focus per second drained while channelling; attack refuses to fire when the tick can't be paid (`spendFocus(a.chan*DT, true)`) | `doMelee`:2549, `doRanged`:2611 |
| `lunge` | px/s dash applied on every swing (`P.vx = P.face*a.lunge`, brief 0.12s i-frames) | `doMelee`:2551 |
| `riposte` | `1` ⇒ swing only allowed within 1.2s after a block (`P.blockedT`) | `doMelee`:2548 |

**Conditional / rider fields** — resolved live per-hit; see §4 for the contract:

| field | meaning | resolved in |
|---|---|---|
| `momentum` | coefficient: `×(1 + min(1, |P.vx|/MOVE) × momentum)` | `condMul` |
| `reap` | coefficient: `×(1 + missingHpFrac × reap)` | `condMul` |
| `vsBurn` / `vsChill` | fraction: `×(1+v)` if target has that status | `condMul` |
| `vsSpent` | fraction: `×(1+v)` if target is in its recovery window (`e.rec>0`) | `condMul` |
| `vsLow` | fraction: `×(1+v)` if target below 50% HP | `condMul` |
| `interrupt` | `1` ⇒ cancels an enemy windup (melee OR ranged tell). Per-enemy 1.4s cooldown (`e.intT`); bosses immune; forces the enemy into its full `rec` | `onHit` |
| `stagger` | seconds added to an EXISTING recovery window, capped at 1.2s total — lengthens a punish window, never creates one | `onHit` |
| `sunder` | flat armor stripped from the target per hit | `onHit` |
| `cull` | fraction: target left below `cull×maxhp` after the hit dies outright | `strike`/`projStrike` directly |
| `chain` | int: bolt hops to `chain` nearby enemies (≤120px) at 60% dmg, ×0.75 per hop | `strike`/`projStrike` → `chainFrom` |
| `twin` | `1` ⇒ `strike()` recurses once at 60% dmg / 40% kb (`isSecond` guard). Melee only in practice | `strike`:2702 |
| `splinter` | `1` ⇒ 3 shards at 35% dmg scatter on kill | `onKill` |
| `contagion` | `1` ⇒ burn/bleed potency ×0.7 jumps to nearest enemy ≤140px on kill | `onKill` |
| `leech` | fraction of dealt damage healed (`P.hp += dmg*leech`). Accumulate: `(a.leech||0)+x`. `inc('leech')` is added on top in computeAttack | `strike`/`projStrike` |

**Status riders:**

| field | meaning |
|---|---|
| `stR` | object of status **ratios of final damage**: `{burn:0.35, bleed:0.30}`. `resolveDmg` turns each into an absolute potency: `st[k] = max(st[k]||0, a.dmg × stR[k] × ailmentMul() × (a.ailMore||1))`. Use the `a.stR=a.stR||{}; a.stR.burn=Math.max(a.stR.burn||0, x)` pattern — max-combine, don't add |
| `st` | object of **absolute** status potencies applied on hit. `chill`: speed multiplier (LOWER = slower; e.g. 0.55), single-instance, min wins. `shock`: incoming-damage multiplier (e.g. 1.35), single-instance, max wins. `burn`/`bleed`: dps, stack up to `STACK_MAX=3` instances. Crits deepen every ailment ×`CRIT_ST=1.5` except chill |
| `ailMore` | multiplier applied ONLY to ailment potency (Deep Cut: `(a.ailMore||1)*1.6`) — lands in `resolveDmg` and nowhere else |

**Crit adds** (resolved in computeAttack AFTER all mods, so caps hold):

| field | meaning |
|---|---|
| `critAdd` | added to crit chance; final `a.crit = clamp(critChance()+critAdd, 0, 0.95)` |
| `critMultAdd` | added to crit multiplier BEFORE the soft cap: `a.critMult = softCrit(critMultVal()+critMultAdd)` |

**Known dead field (do not copy the pattern):** `blockBonus` (written by the Last Word shield
unique, index.html:800) is written once and read nowhere. The no-dead-gems suite only covers
skill/sup gems, so a dead field on a unique or aura is NOT caught by tests — wire the consumer
first.

---

## 2. How gems resolve — the pipeline

### 2.1 `computeAttack(slot)` order (index.html:2221-2252)

Resolution order, exactly:

1. `baseAttack(b, kind)` — seed from the gear base. `kind = b.shield ? 'melee' : b.slot`
   (a Shield bashes as melee even in the ranged slot).
2. Warding aura penalty: `if(auraHas('warding')) a.more *= 0.9` (early, so ailment potency
   derived from damage also pays it).
3. **Skill gems on the item**, in socket order, via `applyGem(G, a, tier)` — `for`-gated.
4. **Support gems on the same item**, in socket order — `for`-gated.
5. **Modifier affixes on the item**: `MODA[k].mod(a)`, gated by `!M.slot || M.slot===kind`.
6. **The unique's `mod(a)`** — runs AFTER all the item's gems (this is why uniques may break
   rules: they see the finished gem state).
7. **Armor support gems link GLOBALLY**: if `slot !== 'armor'`, every `sup` gem socketed in
   `EQ.armor` applies to this weapon too (the one global-vs-local decision in the system).
8. **Armor modifier affixes** apply globally the same way (kind-gated).
9. `applyRunMods(a)` — boon/attunement contract writes from the `RUNM` bag (hitBurn, hitChill,
   hitShock, hitBleed, vsBurn, vsChill, vsSpent, vsLow, extraProj, chain, sunder).
10. `resolveDmg(a, kind==='melee' ? 'meleeDmg' : 'rangedDmg')` — the two pools combine (§2.2).
11. Post-resolve additive-pool folds: `a.dig += classFx('digBonus')`;
    `a.cd *= 1/(1+inc('cdr'))`; `a.kb *= 1+inc('kb')`; `a.pierce += inc('pierce')`.
12. Crit caps: `a.crit = clamp(critChance()+critAdd, 0, 0.95)`;
    `a.critMult = softCrit(critMultVal()+critMultAdd)`; `a.leech = (a.leech||0)+inc('leech')`.

The result is cached in `ATK.melee` / `ATK.ranged` / `ATK.abil` by `refreshAttacks()`
(index.html:2270-2273), which also recomputes `P.maxfuel`, `P.armor`, `P.sres`, `P.fallImmune`.
**Any change to equipment, sockets, tree, class or boons must be followed by
`refreshAttacks()`** — forgetting it is the most likely bug you will introduce (suite-7 §13b
asserts cache coherence on class switch, tree buy, boon take, socket, unsocket).

### 2.2 The two pools — `resolveDmg` verbatim (index.html:2178-2189)

```js
function resolveDmg(a,dkey){
 // `dmg` is the universal increased-damage stat; dkey adds the type-specific one on top.
 // Passing dkey==='dmg' (abilities do) must NOT count the universal pool twice.
 a.inc=softInc((a.inc||0)+inc('dmg')+(dkey&&dkey!=='dmg'?inc(dkey):0));
 a.dmg=a.dmg*(1+a.inc)*a.more;
 // ailment potencies are ratios of FINAL damage, so a support gem's `more` feeds the DoT too.
 if(a.stR){a.st=a.st||{};for(const k in a.stR)a.st[k]=Math.max(a.st[k]||0,a.dmg*a.stR[k]*ailmentMul()*(a.ailMore||1))}
 else if(a.ailMore&&a.st){for(const k in a.st)if(k!=='chill'&&k!=='shock')a.st[k]*=a.ailMore}
 if(a.st&&a.st.burn)a.st.burn*=1+classFx('burnBonus');
 return a}
```

`inc(key)` (index.html:2146) = `treeFx(key) + classFx(key) + gearSum(key) + (RUNB[key]||0)`.
Support gems and uniques can never reach it; gear affixes, the meta tree, class passives and
boons can reach nothing else.

Soft caps (index.html:260-262, 2537-2538): `INC_SOFT=3.0, INC_SOFT_RATE=0.35` — past +300%
increased, each further point is worth 35%. `CRIT_SOFT=4.0, CRIT_SOFT_RATE=0.25` — past 4.0x
crit damage, each further point is worth a quarter.

### 2.3 Gem tiers — what a tier actually multiplies

`applyGem` (index.html:2192-2199) runs `G.mod(a)` first, THEN the tier bonus, one uniform rule:

| gem type | tier T effect (T≥2, `t = T−1`) |
|---|---|
| `sup` | `a.more *= 1 + 0.12*t` (a T3 support is +24% more on top of its mod) |
| `skill` | `a.dmg *= 1 + 0.20*t` (allowed: a skill owns its base damage) |
| `abil` | `a.dmg *= 1 + 0.30*t` **and** `a.cd *= 1 + 0.10*t` — tiering an ability is not free (suite-7 asserts both directions) |
| `aura` | **nothing** — tiers do not touch auras at all |

Tiers come only from **fusion** (`fuseGem`, index.html:3692-3701): three identical gems
(same `id` AND same `tier`) in the BAG fuse into one of tier+1. Cost: **150 shards T1→T2,
500 shards T2→T3**; the UI only offers fusion while `tier < 3`, so **T3 is the ceiling**.
suite-7 §8 asserts: consumes exactly 3, yields exactly 1, charges the cost, refuses when
unaffordable.

### 2.4 Socket colors

`const SOCK={r:{n:'Might',c:'#e05555'},g:{n:'Finesse',c:'#6ad07a'},b:{n:'Focus',c:'#6f8fe0'}}`
(index.html:755). An item's `sc` is an array of `'r'/'g'/'b'` per socket; `chroma` is the index
of one wildcard socket (or −1). `gemFits(it,i,gid)` (index.html:2090-2091):
`c==='*' || c===(G.col||'r')`. Placement (`placeGem`) enforces color; nothing enforces `for`,
so a mismatched-`for` gem can sit uselessly in a legal-color socket.

Socket count at drop = `base.sockets + (rarity>=2 ? 1 : 0) + (uniqueDef.sockets || 0)`.
The base's fixed `sc` string colors the first sockets; extras roll one char at a time from the
base's `tend` string. Chroma odds: unique 50%, rare 28%, magic 15%, normal never.

---

## 3. The conditional layer — registering a gem both paths pay

### 3.1 The registry/dispatch shape

There is no registry object. The "registry" is three plain functions, each a list of
field-guarded blocks, and BOTH damage paths call all three:

- `strike(e, a, kb)` (index.html:2683-2702) — the single player→enemy melee path.
- `projStrike(e, p)` (index.html:3242-3256) — the single projectile→enemy path; `p` is the
  projectile, which carries copies of the conditional fields.

Call order inside both: `condMul` multiplies the damage before it lands → `onHit` fires riders
before HP is touched → `hurtEnemy` → cull check → `onKill` if this attack was the killing blow
→ chain → focus gain → (melee only) twin recursion.

`condMul` verbatim (index.html:2639-2654) — copy this shape for a new conditional:

```js
function condMul(a,e){
 let m=1;
 // Momentum: damage scales with how fast you're actually moving — makes `ms` an offensive stat
 if(a.momentum)m*=1+Math.min(1,Math.abs(P.vx)/Math.max(1,MOVE))*a.momentum;
 // Reap: scales with the target's MISSING health — an execution build
 if(a.reap&&e.maxhp)m*=1+(1-e.hp/e.maxhp)*a.reap;
 if(a.vsBurn&&hasSt(e,'burn'))m*=1+a.vsBurn;
 if(a.vsChill&&hasSt(e,'chill'))m*=1+a.vsChill;
 if(a.vsSpent&&(e.rec||0)>0)m*=1+a.vsSpent;
 if(a.vsLow&&e.maxhp&&e.hp<e.maxhp*0.5)m*=1+a.vsLow;
 if(auraHas('bloodscent')&&(hasSt(e,'bleed')||hasSt(e,'burn')))m*=1.3;
 if(auraHas('vigil')&&perf-(P.lastHurt||-9)>3)m*=1.25;
 if(auraHas('reaper')&&e.maxhp&&e.hp<e.maxhp*0.5)m*=1.2;
 return m}
```

`onHit(a, e, dmg)` holds interrupt / stagger / sunder; `onKill(a, e)` holds splinter /
contagion (index.html:2656-2682). `onKill` is deliberately NOT in `killEnemy`, so a gem cannot
claim a death caused by an ailment tick, a hazard or a fall.

### 3.2 The projectile ride-along list — the step everyone forgets

Conditionals resolve **at impact**, so `doRanged` must copy every conditional field from the
cached attack onto each projectile it fires (index.html:2620-2624, verbatim):

```js
   // Conditional gems ride along on the projectile — they resolve at impact, not at fire time.
   // Without this, Momentum/Culling/Chain/Reap/Sunder are pure `more` penalties when ranged.
   momentum:a.momentum||0,cull:a.cull||0,chain:a.chain||0,reap:a.reap||0,sunder:a.sunder||0,
   vsBurn:a.vsBurn||0,vsChill:a.vsChill||0,vsSpent:a.vsSpent||0,vsLow:a.vsLow||0,
   interrupt:a.interrupt||0,stagger:a.stagger||0,splinter:a.splinter||0,contagion:a.contagion||0,
```

`upSentry` (index.html:3277-3281) carries a SUBSET (`vsBurn/vsChill/vsSpent/vsLow/chain/cull`)
onto turret shots — extend it too if the new conditional should work through Shard Sentry.

### 3.3 Checklist: a NEW conditional gem, end to end

1. `GEMS` entry whose `mod` sets `a.<newField>` using the accumulate pattern
   (`a.x=(a.x||0)+v`) and pays a `more` discount (`a.more*=0.85..0.95`).
2. Read `a.<newField>` in `condMul` (damage-if) or `onHit` (rider) or `onKill` (on-death).
   Because both `strike` and `projStrike` already call all three, ONE block covers melee.
3. Add `<newField>: a.<newField>||0,` to the `PROJ.push` ride-along list in `doRanged` —
   without this the gem is a pure downside for every ranged build (rule 16; this has shipped
   broken before). Optionally add it to `upSentry`'s push.
4. `UNLOCKS` entry (§8) or the gem is unreachable (suite-7 §13 and suite-13 fail).
5. **Tests**: add the field to `FIELDS` in `test/suite-13.js:127-130` (else the no-dead-gems
   snapshot cannot see your change and reports the gem dead), and add a
   `{ f:'<newField>', set:e=>{...} }` row to `CONDS` (suite-13:168-175) so the melee/ranged
   parity assertion covers it. If a boon/attunement also writes it via `RUNM`, add the key to
   `KNOWN` (suite-13:331-333) and handle it in `applyRunMods` (index.html:2208-2220).

---

## 4. Abilities — `computeAbility` / `useAbility`

### 4.1 What the table declares vs what the branch does

The `GEMS` entry declares **cooldown (`cd`, s), Focus cost (`fc`), and the dispatch key
(`fx`)**. The effect itself is NOT a table field — it is an `else if (a.fx==='...')` branch in
`useAbility()` (index.html:2281-2370). This is the sanctioned rule-4 exception.

`computeAbility()` (index.html:2256-2269), the contract:

- Reads the FIRST `abil` gem found in `EQ.armor.sockets` (only one ability is active).
- Builds `a = {kind:'abil', id, fx:G.fx, n:G.n, cd:G.cd, fc:G.fc||0, tier, dmg:40,
  col:'#ffe9a0', st:null, more:1, inc:0}` — **every ability's base damage number is 40**;
  branches scale it (`meteor` fires a projectile at `a.dmg*depthMul(P.y)`, `quake` explodes at
  `a.dmg*1.4*dm`, `bulwark` shields for `30+armor*3.2+a.dmg*0.4`, etc.). Note: some branches
  multiply by `depthMul(P.y)` (meteor, quake) and some deliberately don't (crucible, rupture,
  bulwark) — decide and be consistent with neighbours.
- Tier: `dmg *= 1+0.30*(tier-1)`, `cd *= 1+0.10*(tier-1)`.
- **Armor support gems empower the ability too**: every `sup` in the other armor sockets is
  applied via `applyGem`.
- `a.inc = (treeFx('meleeDmg')+treeFx('rangedDmg'))*0.5`, then `applyRunMods`,
  `resolveDmg(a,'dmg')` (dkey `'dmg'` so the universal pool is not double-counted).
- `a.cd *= 1/(1+inc('cdr')+classFx('abilCdr'))`.

`useAbility()` gates: refuses if `P.dead`, if `P.acd > 0` (cooldown), or if
`!spendFocus(a.fc||0)` (Focus). Both gates are real; a refused ability does not burn its
cooldown (suite-7 asserts). On fire: `P.acd = a.cd`.

### 4.2 What a new ability wires through

| effect shape | mechanism | example branch |
|---|---|---|
| timed stat buff | `RUNB.<key> += v; BUFFS.push({k:'<key>', v, until:perf+secs}); refreshAttacks()` — `tickBuffs()` reverses it and refreshes again | `warcry` (index.html:2294-2298) |
| area denial / field | `addHaz(x, y, r, t, dmgPerTick, st, col, friendly=1, kind)` — HAZ ticks every 0.35s, capped at `HAZ_MAX=64` (rule 19: never a projectile) | `crucible`: `addHaz(P.x+P.face*30,P.y+8,64,7,a.dmg*0.30,{burn:a.dmg*0.35},'#ff8a3f',1,'fire')` |
| digging | `carve(x, y, radius, maxHard)` with `Math.max(1, digPower())` — NEVER `setTile` (rule 3). `carve` returns tiles removed; hardness ≥9 (bedrock) never breaks | `shaft`, `quake`, `burrow` (via `P.burrowT`) |
| projectile | `PROJ.push({...})` with `friendly:1` (cap 200) | `meteor` |
| summons | `SENTRY.push({x,y,t:perf+8,cd:0})` / `DECOY={x,y,t,hp}` | `sentry`, `decoy` |
| player state | timers on `P` (`P.inv`, `P.levT`, `P.burrowT`, `P.shield`+`P.shieldT`, `P.noFall`) | `blink`, `levitate`, `bulwark` |
| enemy state sweep | loop `EN`, apply `applyStatus(e, {...})`, `e.rec`, `e.arm`, `e.teth` | `wardbreak`, `tether`, `rupture` |

suite-7 §13 asserts every abil gem has `cd > 0 && fc >= 0 && fx` — a table entry without a
branch will pass that check but do nothing when pressed; there is no automated dead-abil test.
Test the branch by hand in a new suite block.

---

## 5. Auras — registration without a mod

An aura entry has no `mod` and no tier scaling. Its entire effect is `auraHas('<id>')` checks
at the consuming sites. Complete current map (grep `auraHas(` — index.html):

| aura | consumer site(s) |
|---|---|
| `ironskin` | `armorVal()` +4 flat; `hurtPlayer` ×0.8 damage taken |
| `warding` | `sresVal()` +0.5; `computeAttack` `a.more*=0.9` (the −10% damage half) |
| `updraft` | `maxFuel()` +70 |
| `swiftness` | `moveSpd()` ×1.15 |
| `undertow` | `moveSpd()` ×1.25 below 40% HP; `liveSpeedMul()` ×0.8 attack period below 40% |
| `bloodscent` / `vigil` / `reaper` | `condMul()` ×1.3 / ×1.25 (untouched 3s) / ×1.2 (target <50%) |
| `tempo` | `killEnemy` stacks `P.tempo` (max 5, 4s); `liveSpeedMul()` ×(1−0.06·stacks) |
| `thorns` | contact-damage blocks in `upEnemies` (×2 sites): reflect `12*depthDmg(P.y)` |
| `regrowth` | player tick: +2 HP/s |
| `staticfield` | player tick: shock pulse every 1.6s |
| `featherfall` | fall-damage calc ×0 |
| `prospector` | map render + HUD line |

A new aura = table entry + `auraHas` check(s) at the right site + `UNLOCKS` entry. **The
no-dead-gems suite does not cover auras** — nothing catches an unwired aura automatically.
If the aura's effect belongs in per-hit damage, put the check in `condMul` so both paths pay it.
If it affects cached stats (`armor`, `sres`, `fuel`, `more`), it must be inside a function that
`refreshAttacks()` reaches, and any live-state part (Tempo stacks, Undertow HP check) must be
read live (`liveSpeedMul`, `condMul`) — never cached into `ATK`.

---

## 6. GEAR bases (index.html:761-774)

`const GEAR = { id: {entry}, ... }`. Field list:

| field | applies to | meaning / units |
|---|---|---|
| `slot` | all | `'melee'` \| `'ranged'` \| `'armor'` \| `'any'` (Shield only — equippable in either weapon slot) |
| `n` | all | display name |
| `dmg` | weapons | base damage per hit |
| `cd` | weapons | seconds per attack (fractional literals written `.38` style) |
| `range` | melee | reach px |
| `arc` | melee | swing arc degrees |
| `kb` | weapons | knockback px/s |
| `dig` | melee | max tile hardness broken on swing (0 = none; Axe 1, Greataxe 2). Ranged bases have no `dig` |
| `speed` | ranged | projectile speed px/s |
| `pierce` | ranged | base pierce count |
| `col` | ranged | projectile color |
| `sockets` | all | base socket count |
| `sc` | all | fixed socket colors, one char per socket (`'r'/'g'/'b'`), length ≤ sockets; suite-7 asserts every char is a valid `SOCK` key |
| `tend` | all | color tendency string — bonus sockets (rarity/unique) draw one random char from it |
| `arm` | armor/shield | flat armor (subtracted per incoming hit; floor `max(1, raw*0.22)`) |
| `hp` | armor | flat max HP |
| `fuel` | armor | flat flight fuel |
| `shield` | Shield | `1` ⇒ bashes as melee in either slot, counts as shield for block |
| `ilvl` | optional | minimum item level (= depth in metres) before this base may drop (`baseAllowed`, index.html:2017). Absent ⇒ drops anywhere |

Verbatim samples (variety: starter melee, 2-socket ranged, gated armor, the `any`-slot shield):

```js
 sword:{slot:'melee', n:'Sword', dmg:10, range:26, arc:100, cd:.38, kb:120, dig:0, sockets:1, sc:'r', tend:'rrg'},
 wand: {slot:'ranged',n:'Wand',  dmg:7,  speed:340,cd:.34, kb:40,  pierce:0, sockets:2, col:'#9fd0ff', sc:'bb', tend:'bbb'},
 harness:{slot:'armor',n:'Delver Harness',hp:22,arm:3,sockets:2, fuel:70, sc:'gb', tend:'gbr', ilvl:340},
 shield:{slot:'any',  n:'Shield', dmg:6, range:20, arc:70, cd:.5, kb:260, dig:0, sockets:1, shield:1, arm:4, sc:'r', tend:'rrb'},
```

Current ilvl gates: axe 80, chain 150, robe 260, harness 340, plate 900, greataxe 900,
crossbow 900. Sword/bow/wand/vest/shield ungated.

---

## 7. UNIQUES and UNIQ2 (index.html:777-806)

One primary (`UNIQUES`) and one alternate (`UNIQ2`) per base id, keyed BY the base id.
`uniqueDef(id, alt)` picks. Entry fields:

| field | meaning |
|---|---|
| `n` | unique name (replaces item name entirely) |
| `d` | flavor line (shown as item description) |
| `mod` | `a => {...}` — runs in computeAttack **after all gems and modifier affixes** (step 6). Damage through `a.more` only (one Π pool, same as supports). Because it runs last it may break otherwise-fixed contracts (force `count=1`, set `dig=3`, etc.) |
| flat stat fields | `sockets` (bonus sockets at drop time), `hp`, `arm`, `fuel`, `ms` (move-speed fraction, may be negative), `noFall` (`1` ⇒ fall-damage immunity, read in `refreshAttacks` → `P.fallImmune`). Flat keys are picked up generically by `gearSum` (index.html:2143: `u[key]`), so `hp/arm/fuel/ms` feed `inc()` |

Verbatim samples — two interesting `mod()`s and one stat-only:

```js
 crossbow:{n:'Judgment',       d:'devastating, slow, pierces',mod:a=>{a.more*=2.4;a.cd*=1.9;a.pierce+=5;a.speed*=1.2}},
```

```js
 sword:   {n:'Splitfang',      d:'every hit chains to a second enemy', mod:a=>{a.chain=(a.chain||0)+1;a.more*=0.9;a.cd*=0.9}},
```

```js
 vest:    {n:'Second Skin',    d:'+2 sockets',   sockets:2},
```

Mechanics in `mkItem`:
- If `rarity===3 && !UNIQUES[baseId]` the item is downgraded to rare — **a base with only a
  UNIQ2 entry can never drop its unique**. Add the primary first.
- `alt = (rarity===3 && UNIQ2[baseId] && chance(0.5)) ? 1 : 0` — the alternate rolls half the
  time when both exist.
- A unique carries exactly ONE random affix (`nAff` for rarity 3 is 1) plus a 55% chance of a
  modifier affix.

---

## 8. AFFIXES, tiers, and MODIFIER AFFIXES

### 8.1 AFFIXES (index.html:818-825)

Array of tuples `[key, label, min, max, scale, grow]`:

| pos | meaning |
|---|---|
| `key` | stat key — MUST be read by some `inc(key)` consumer or the affix is dead. Current keys and consumers: `dmg` (resolveDmg), `hp` (maxHP), `cdr` (attack cd), `ms` (moveSpd), `crit` (critChance), `critMult` (critMultVal), `arm` (armorVal), `sres` (sresVal), `greed` (greedVal/shards), `fuel` (maxFuel), `focus` (focusGainMul), `leech` (computeAttack) |
| `label` | display text after the number |
| `min`,`max` | tier-1 roll range, integers |
| `scale` | `'pct'` ⇒ stored as integer percent, folded into `inc()` as `/100`; `'flat'` ⇒ added raw (`statPct`, index.html:2137) |
| `grow` | per-tier multiplier for the range (see below) |

Verbatim first row pair:

```js
 ['dmg','% increased damage',8,25,'pct',1.30], ['hp','max HP',8,30,'flat',1.34],
```

`AFF` is the by-key index: `const AFF=Object.fromEntries(AFFIXES.map(a=>[a[0],a]))`.

### 8.2 Tier gates

```js
const AFF_TIER_ILVL=[1,300,800,1500,2400];   // minimum item level for tiers 1..5
const AFF_TIER_NAME=['','','Greater ','Grand ','Perfect '];
```

- `affTierRange(a, t)` (index.html:830-832): steps the T1 range up per tier:
  `lo = max(lo+1, round(lo*grow))`, `hi = max(hi+2, round(hi*grow))` — the `+1/+2` floors
  guarantee every tier is strictly better even for tiny ranges (armor 2–9, leech 2–5); suite-12
  asserts strict ascent for EVERY affix, so any `grow` you pick passes automatically.
- `affTierFor(ilvl)` (index.html:835-838): highest tier the ilvl allows, then a weighted walk
  down (`while(t>1 && chance(0.42)) t--`) — deep items are USUALLY good, not always perfect.

### 8.3 MODIFIER AFFIXES — MODAFF (index.html:843-856)

`{k, n, slot?, ilvl, mod}` — contract-changing affixes that run through the same `mod(a)` seam
as uniques (computeAttack step 5/8; rule 5 holds: damage via `a.more`).

| field | meaning |
|---|---|
| `k` | id; convention: `'a'`-prefixed (`aproj`, `atwin`, ...). Keys live in `it.mods={k:1}` and index `MODA` |
| `n` | display name (bolded in the affix line) |
| `slot` | `'ranged'` \| `'melee'` \| absent (= any). Enforced at ROLL time for weapons and again at APPLY time (`!M.slot||M.slot===kind`) |
| `ilvl` | minimum item level to roll — "gated deep so finding one is an event" |
| `mod` | `a => {...}`, same vocabulary as §1.3 |

Verbatim samples:

```js
 {k:'aproj', n:'+1 projectile',              slot:'ranged',ilvl:600, mod:a=>{a.count=(a.count||1)+1;a.more*=0.82}},
 {k:'aexec', n:'executes below 6% health',   ilvl:1200,mod:a=>{a.cull=Math.max(a.cull||0,0.06)}},
```

Roll rules inside `mkItem` (index.html:2046-2051): rare-and-above only; exactly ONE per item
(suite-12 asserts never more); chance `0.55` on uniques, `min(0.55, 0.18 + ilvl/6000)` on rares;
candidates filtered by `ilvl >= m.ilvl && (!m.slot || m.slot===slot || slot==='armor')` — an
**armor item may roll any modifier**, and at compute time it links globally to both weapons but
only applies to the matching `kind` (exactly like a support gem in armor; suite-12 asserts an
armor `achain` reaches both the bow and the sword).

---

## 9. `mkItem`, `rollRarity`, and the drop sites

### 9.1 Signatures

```js
function ilvlAt(y)                        // depth in metres: max(1, round(y/TILE - SURFACE))
function rollRarity(ilvl, bonus)          // -> 0 normal | 1 magic | 2 rare | 3 unique
function baseAllowed(id, ilvl)            // -> bool: !b.ilvl || ilvl >= b.ilvl
function mkItem(baseId, rarity, ilvl)     // -> item object; ilvl defaults to ilvlAt(P.y||0)
```

`rollRarity` exact math (index.html:2005-2014): with
`t = (threat().rare||1)*(ECHO.rare||1)`, `g = 1+min(0.6, inc('greed')*0.35)`,
`d = min(1, ilvl/2600)`:
`pU = (0.006 + d*0.055)*t*g*bonus`, `pR = (0.05 + d*0.26)*t*g*bonus`,
`pM = (0.24 + d*0.34)*t*g*bonus`, tried in that order.

`mkItem` behavior in order: threat bump (`rarity<3 && rare>1` ⇒ chance `min(0.5,(rr2-1)*0.55)`
of +1 rarity) → unique downgrade if no `UNIQUES[baseId]` → `alt` coin flip → item skeleton →
sockets+colors+chroma → affixes → one modifier affix. Affix count: normal 0; magic 1
(2 at ilvl≥1200 with 45% chance); rare 3 (4 at ilvl≥1600 with 40% chance); unique 1.

Item object shape (what every consumer expects):

```js
{uid, base, rarity, ilvl, affixes:{key:int}, tiers:{key:1..5}, mods:{k:1},
 sockets:[null|{id,tier}...], sc:['r'|'g'|'b'...], chroma:-1|idx, unique:baseId|null, alt:0|1}
```

`itemScore` weights (ranking only): `rarity*40 + ilvl*0.02 +
Σ affix*(pct?1.1:1.6)*(0.7+0.3*tier) + nMods*55 + nSockets*18`.

### 9.2 Drop sites — every one passes ilvl (rule 17)

| site | code | what drops |
|---|---|---|
| any kill | index.html:2815-2817 | 6% a gem from `gemPool()`; ELSE 3.5% (elite: 10%) gear: `mkItem(pool[...], rollRarity(il, elite?2:1), il)` with `il=ilvlAt(e.y)` |
| elite kill (extra) | index.html:2814 | gem: 80% if Gilded (`loot`), else 35% |
| boss kill | index.html:2792-2797 | 2 gems + 1 gear `mkItem(..., max(2, rollRarity(il,3.2)), il)` + 1 sigil |
| chest | index.html:2833-2843 | `ri(8,14)` shards + 1 gem always + 72% gear `mkItem(..., max(1, rollRarity(il,2.4)), il)` with `il=ilvlAt(ch.y)` |

A new drop site must compute `ilvlAt(<site y>)` and pass it through both `rollRarity` and
`mkItem`, and must draw bases from `gearPool(il)` (never `Object.keys(GEAR)`) and gems from
`gemPool()`.

---

## 10. The unlock pool (index.html:1563-1652)

```js
const DEFAULT_GEAR_POOL=['sword','bow','vest'];
const DEFAULT_GEM_POOL=['cleave','multishot','addedfire'];
const UNLOCKS=[
 {id:'axe',   n:'Axe (gear)',        cost:30},
 ...
 {id:'tether',    n:'Tether gem (ability)',    cost:135},
];
```

Entry format: `{id, n, cost}` — `id` is the GEMS **or** GEAR key (one shared namespace, which
is why no id may exist in both tables), `n` is the shop label (convention: append
"(gear)" / "gem" / "aura" / "support" / "(ability)"), `cost` in shards. Pricing bands in the
live table: first-tier gear/gems 30–85; content-wave build-definers 85–125; conditional-layer
wave 100–135.

Flow: camp shop iterates `UNLOCKS` (index.html:4028-4029) → `buyUnlock(id)` sets
`META.unlocks[id]=1` and saves → the pools pick it up automatically:

```js
function gearPool(ilvl){const all=DEFAULT_GEAR_POOL.concat(Object.keys(GEAR).filter(g=>META.unlocks[g]&&!DEFAULT_GEAR_POOL.includes(g)));
 if(ilvl===undefined)return all;
 const ok=all.filter(g=>baseAllowed(g,ilvl));return ok.length?ok:DEFAULT_GEAR_POOL}
function gemPool(){return DEFAULT_GEM_POOL.concat(Object.keys(GEMS).filter(g=>META.unlocks[g]&&!DEFAULT_GEM_POOL.includes(g)))}
```

So a bought unlock enters every drop site in §9.2 with no further registration. No UI work is
ever needed for a new gem/base: the shop, the socket screen, the bag, the codex and the drops
all iterate the tables.

**Namespace assertions** (the reasons `chainbolt` is not `chain`):
- suite-7 §13d: `UNLOCKS` ids unique; **no id both a gem and a gear base**
  (`Object.keys(GEMS).filter(g=>GEAR[g])` empty). Historical bug: 45 shards of Chainmail also
  handed over a 100-shard gem.
- suite-7 §13 + suite-13: every unlock id names a real gem/base ("shards buy nothing"
  otherwise); every non-default gem AND gear base appears in `UNLOCKS` ("unreachable"
  otherwise).

---

## 11. Test constraints on this content — exact numbers

Run `./test/run.sh` (suites 2-15, ~960 assertions); `./test/run.sh 13` for one suite. The
harness pins `Date.now`, stubs the DOM, and gives you `NOCRIT()/YESCRIT()/TOPUP()/NOARMOR()/GID()`.

### 11.1 suite-12 — itemisation (`test/suite-12.js`)

| constraint | exact assertion |
|---|---|
| ilvl identity | `ilvlAt((SURFACE+1234)*TILE) === 1234`; `ilvlAt(0) === 1` |
| depth pays | over 3000 rolls each at ilvl 80 / 1200 / 2900 (rarity from `rollRarity(ilvl,1)`): `deep.avgAff > shallow.avgAff*1.8`; `deep.avgScore > shallow.avgScore*3`; monotone (`mid > shallow`, `deep > mid`); rare+unique count at 2900 `> 3×` the count at 80; uniques still occur at 80 (`shallow.r[3] > 0`); base pool wider at depth |
| tier gating | at ilvl 80 tiers 2–5 NEVER occur (count `=== 0`); at 2900 tier 5 occurs and its count `> 3×` tier-1's; at 1200 tier 5 count `=== 0` (gate is 2400); 4000 rolls at ilvl 700 leak zero tiers with `AFF_TIER_ILVL[t-1] > 700` |
| tier ranges | for EVERY `AFFIXES` row, `affTierRange` lo and hi strictly increase each tier 2..5; `affTierRange(AFF.dmg,5)[1] >= 25*2.4` (=60) |
| modifier affixes | zero mods at ilvl 80; normal-rarity items NEVER roll one (2000 rolls at ilvl 2900); a bow never rolls a `slot:'melee'` mod and vice versa (3000 rolls each); no mod above its own `ilvl` gate; **never more than one mod per item** (4000 rolls, greataxe rarity 3 ilvl 3100); `aproj` on a bow gives `count+1` AND `ATK.ranged.more < 1` (rule 5); `achain` on ARMOR reaches both the ranged and melee attack |
| base gating | `gearPool(50)` excludes plate & greataxe; `gearPool(2800)` includes both; sword always present; pool never empty; `baseAllowed` agrees |
| drop volume | simulated run = 160 kills @3.5% + 9 chests @72% at each of 400/1500/2800m must yield **3..20 items** (plan target: 8–12/run, 2–3 worth a look, 1 worth equipping) |
| presentation | no `++`/`undefined` in `affixStr`; `ilvlStr` shows `i<ilvl>`; a tier name (`Greater/Grand/Perfect`) appears within 300 deep-rare rolls; `bagBetter` shows ▲ (`&#9650;`) for score +25, ▼ for −25, `NEW` for empty slot |
| scoring | unique > normal; deep rare > shallow rare; <90/300 inversions at equal rarity; bare item doesn't throw |
| integrity | 6000 rolls across ilvl 1/500/1500/3140: affix values finite & >0, `ilvl>=1`, `sockets.length===sc.length`, rarity 3 ⇒ `unique` set, `chroma < sockets.length`; a full set of ilvl-3140 rares yields finite `ATK` numbers and `ATK.melee.critMult <= CRIT_SOFT+2` (=6) |

### 11.2 suite-13 — buildcraft (`test/suite-13.js`)

**The 14 archetypes** (each must ASSEMBLE — non-null `ATK[slot]` — and produce finite,
positive effective DPS; assembled at 1500m, level 11, tree branch m1–4 or s1–4, tier-1 gems,
colors forced by the `fit()` helper):

| archetype | class | base | weapon gems | armor gem |
|---|---|---|---|---|
| Cleave Vanguard | vanguard | greataxe | cleave, heavyimpact, conc | ironskin |
| Rend Breaker | vanguard | greataxe | rend, punish, hunger | reaper |
| Whirlwind Channel | delver | axe | whirlwind, fasteratk, lifeleech | undertow |
| Twin Bleed | delver | sword | serration, twin, deepcut | bloodscent |
| Momentum Runner | delver | sword | lunge, momentum, fasteratk | swiftness |
| Execution | vanguard | axe | reap, culling, hunger | reaper |
| Multishot Marksman | marksman | bow | multishot, pierce, fasteratk | swiftness |
| Deadeye Crit | marksman | crossbow | precision, conc, overload | vigil |
| Ignite Pyromancer | pyromancer | wand | fireball, ignite, kindling | warding |
| Contagion Rot | pyromancer | wand | ignite, deepcut, contagion | bloodscent |
| Frost Shatter | pyromancer | wand | frostlance, rimebound, addedfire | warding |
| Chain Storm | marksman | wand | lightning, chainbolt, conduit | staticfield |
| Grenadier | delver | crossbow | grenade, aftershock, conc | featherfall |
| Splinter Volley | marksman | bow | hail, splinter, fasteratk | tempo |

Balance assertions on the set:
- **Spread**: strongest/weakest effective DPS `<= 4.5x`. Effective DPS = `dpsOf(at)` times
  conditional credit: `vsBurn`/`vsChill` full if self-applied, `vsLow*0.5`, `vsSpent*0.35`,
  `reap*0.5`, culling `1/(1-min(0.4,cull))`. New conditional fields must be added here too or
  a build carried by them scores at a fraction of its real output.
- **Stability**: ≥3 of the top-6 at 1500m/lvl-11 remain top-6 at 400m/lvl-5.
- **Viability**: every archetype kills a Brute at 1500m depth HP
  (`85 × depthHP((SURFACE+1500)*TILE)`) in `<= 12s` of effective DPS.

**No dead gems**: every `skill`/`sup` gem whose `for` matches, socketed alone into a 2-socket
sword (melee) or bow (ranged) at ilvl 1200, must change at least one field in the `FIELDS`
snapshot list (suite-13:127-130: dmg, cd, more, count, pierce, chain, cull, explode, arc,
range, kb, crit, critMult, leech, momentum, reap, sunder, twin, fork, ret, homing, grav,
bounce, dig, speed, life, vsBurn, vsChill, vsSpent, vsLow, interrupt, stagger, splinter,
contagion, ailMore, critAdd, critMultAdd, chan, lunge, riposte) or the `st`/`stR` JSON.
**A gem writing only a field absent from this list is reported DEAD** — extend the list with
the gem.

**Conditional parity** (rule 16): for each of `vsSpent, vsLow, vsBurn, vsChill, momentum,
reap` at value 0.5 with the condition satisfied: melee gain `> 1.05x`, ranged gain `> 1.05x`,
and `|meleeGain − rangedGain| < 0.08`. Riders: `interrupt:1` cancels a windup and forces `rec`
on BOTH paths; `splinter:1` on a killing blow spawns `>= 3` projectiles from BOTH paths.

**No auto-include**: across 5 probe skills (sword/cleave, greataxe/rend, bare bow,
wand/lightning, crossbow/grenade), the best support by effective DPS must have `>= 3` distinct
winners.

**The soup test** (additive pool caps): `softInc(1)===1`; `softInc(INC_SOFT)===INC_SOFT`
(INC_SOFT=3.0); `softInc(INC_SOFT+4) < INC_SOFT+4`; `softInc(20) < 10` (+2000% raw collapses
below +1000%). The everything-at-once build (full tree + ALL boons + ALL attunements + ilvl-3140
rares at Threat 5) must stay finite, with `critMult <= CRIT_SOFT+2` (=6.0),
`critChance() <= 0.95`, `sresVal() <= 0.85`, `applyArmor(100, P.armor) >= 22`
(ARMOR_MIN_FRAC=0.22).

**Support shape**: probing every sup's `mod` on a bare attack object, supports whose mod
touches ONLY `more/cd/dmg/kb` are "pure multipliers"; the suite demands
`contract > 2 × pure` and `pure <= 4`. **The pure-multiplier budget is essentially full**
(fasteratk, heavyimpact are in it) — a new support should change the contract, or be an affix
instead.

**Mechanical rewards**: every key a boon/attunement writes into `RUNM` must be in the `KNOWN`
list (feast, dodgeBlast, cornered, moving, overflow, echo, thorn, scav, secondWind, hitBurn,
hitBleed, hitChill, hitShock, vsBurn, vsChill, vsSpent, vsLow, extraProj, chain, sunder,
lastLight); boon/attunement ids unique.

**Shop honesty**: every `UNLOCKS.id` exists in GEMS∪GEAR; every gem free-or-purchasable; no
duplicate unlock ids.

### 11.3 suite-7 — model & content integrity (relevant subset)

- Every gem declares `col`; every base's `sc` chars valid; every class signature gem is
  socketed and color-legal in its own starting kit.
- Gem tiers: higher-tier sup hits harder; higher-tier abil hits harder AND has longer cd;
  `gemId/gemTier` read both `{id,tier}` and bare-string forms.
- Fusion: consumes 3, yields 1 of tier+1, charges 150, refuses when broke.
- Every abil gem: `cd>0 && fc>=0 && fx`.
- No dangling unlock; every gem/base reachable; gem catalog `>= 45`.
- §13d: no duplicate unlock ids; **no id in both GEMS and GEAR**.
- §13b cache coherence: class switch / tree buy / boon / socket / unsocket all refresh `ATK`,
  `P.maxhp`, `P.armor`.
- Rule-5 spot checks: conc×heavyimpact multiply (`more 1.55×1.45`), Aftershock not a strict
  downgrade, and per-gem behavior blocks for culling/chainbolt/momentum/reap/sunder/twin/
  serration+deepcut/overload/conc/precision.

---

## 12. Registration checklists — every place a new id must appear

**New skill or support gem**
1. `GEMS` entry (id unique across GEMS ∪ GEAR ∪ UNLOCKS; `t`, `for`, `n`, `col`, `d`, `mod`).
2. `UNLOCKS` entry `{id, n, cost}` — or add to `DEFAULT_GEM_POOL` if it should be free.
3. Nothing else for plain gems: shop / drops / socket UI / codex iterate the tables.
4. If it introduces a NEW conditional field: §3.3 checklist (condMul/onHit/onKill +
   `doRanged` ride-along + optionally `upSentry` + suite-13 `FIELDS`/`CONDS`/`effDps`).
5. Verify: `./test/run.sh 7 && ./test/run.sh 13` (dead-gem, parity, shop honesty, color).

**New ability gem**
1. `GEMS` entry with `t:'abil'`, `for:'armor'`, `col`, `cd`, `fc`, `fx`, `d`.
2. `else if(a.fx==='<fx>'){...}` branch in `useAbility()` — wire through `BUFFS` (timed),
   `addHaz` (fields), `carve` (digging), `PROJ`/`SENTRY`/`DECOY`, or `P` timers (§4.2).
3. `UNLOCKS` entry.
4. Decide whether the branch scales by `depthMul(P.y)`; add a suite block — no automated test
   catches a missing branch.

**New aura gem**
1. `GEMS` entry with `t:'aura'`, `for:'armor'`, no `mod`.
2. `auraHas('<id>')` check at each consuming site (§5) — per-hit effects go in `condMul` so
   both paths pay.
3. `UNLOCKS` entry. No automated dead-aura test: write one.

**New gear base**
1. `GEAR` entry (id must not collide with any gem id). `sc` length ≤ `sockets`, chars in rgb;
   set `tend`; optional `ilvl` depth gate.
2. `UNLOCKS` entry or `DEFAULT_GEAR_POOL`.
3. Optional but expected: `UNIQUES[<id>]` (required before `UNIQ2[<id>]` can ever drop).
4. Optional: lore entry for the codex (`LORE`), class kits (`CLASSES[*].kit`) if it's a starter.

**New unique**
1. `UNIQUES[baseId]` or `UNIQ2[baseId]` (primary must exist for the alt to be reachable).
2. `mod` for behavior (damage via `a.more`), flat fields (`hp/arm/fuel/ms/sockets/noFall`) for
   stats. A brand-new flat key needs a consumer (`gearSum` picks it up generically only for
   keys something queries via `inc(key)`; `noFall` is special-cased in `refreshAttacks`).
3. No unlock entry — uniques ride the base's unlock and rarity roll.

**New affix**
1. `AFFIXES` row `[key,label,min,max,scale,grow]`. The `key` must have an `inc(key)` consumer;
   a new key means adding the read site (e.g. in `computeAttack` or a stat function) — an
   unread key rolls, displays, and does nothing.
2. Tiers, tier names, ranges and gating are automatic (`affTierRange`/`affTierFor`).
3. suite-12's per-affix strict-ascent assertion covers it automatically.

**New modifier affix**
1. `MODAFF` entry `{k:'a…', n, slot?, ilvl, mod}` — that's it; `MODA`, rolling, application,
   display and suite-12's slot/gate/one-per-item assertions all key off the table.

**New drop site**
`const il = ilvlAt(<y>)`, gear from `gearPool(il)`, gems from `gemPool()`, rarity from
`rollRarity(il, bonus)`, item via `mkItem(base, rarity, il)`. Push `PICK` entries
(`{kind:'gear',item}` / `{kind:'gem',id}`); pickups expire via `t`.
