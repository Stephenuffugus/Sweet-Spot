# SPEC — CLASSES / SKILLS / SUPPORTS / AURAS / ABILITIES (wave 4: storm & blood)

Designed against: creative-brief.md, CURRENT-STATE.md @3c446e9, ref-items.md, ref-systems.md,
ref-story.md, ref-research.md. All entries are paste-ready in the file's terse style.
Namespace check done against GEMS ∪ GEAR ∪ UNLOCKS ∪ CLASSES ∪ BOONS ∪ ATTUNE — zero collisions.

New ids (33): `conductor bloodletter` (classes) · `impale dragline whipsaw cairn mine stormlash
bloodlet deadweight longshot flurry arcblade` (skills) · `sterile firstblow bloodtithe overdraw
seeker stormcall longhaft ricochet vantage rasp` (supports) · `galvanic surfeit foreman
slipstream plumbline` (auras) · `bastion effigy lodestone tempest transfuse` (abilities).

New attack-object fields (9): `raise mine hpCost slam farshot vsFull aloft noSt stormcall`
(§0 wires every one). New classFx keys (2): `shockBonus bloodRise`. New `foc` value (1): `shock`.
New P fields (2, run-scoped, no SAVE_VER bump): `P.stormN`, `P.lode`.

---

## 0. NEW ATTACK-FIELD WIRING — one table, every consumer (rule 16; ref-items §3.3)

Every field below follows the four-place contract. "ride-along" = add `<f>:a.<f>||0,` to the
conditional block of the `PROJ.push` literal in `doRanged` (index.html:2620-2624). "FIELDS" =
add the name to `test/suite-13.js:127-130`. "CONDS" = add a row at suite-13:168-175.

| field | set by | resolved at (exact site + line to add) | ride-along | sentry copy | FIELDS | CONDS |
|---|---|---|---|---|---|---|
| `slam` | deadweight | `condMul`: `if(a.slam)m*=1+Math.min(1.5,Math.max(0,P.vy)/FALL_SAFE)*a.slam;` | yes | no | yes | `{f:'slam',set:()=>{P.vy=520}}` |
| `aloft` | vantage | `condMul`: `if(a.aloft&&!P.onG)m*=1+a.aloft;` | yes | no | yes | `{f:'aloft',set:()=>{P.onG=false}}` |
| `vsFull` | firstblow | `condMul`: `if(a.vsFull&&e.maxhp&&e.hp>=e.maxhp*0.99)m*=1+a.vsFull;` | yes | yes (add to upSentry list) | yes | `{f:'vsFull',set:null}` (fresh enemy is full) |
| `farshot` | longshot | `condMul`: `if(a.farshot&&a.ox!==undefined)m*=1+Math.min(1,Math.hypot(a.x-a.ox,a.y-a.oy)/420)*a.farshot;` — the `ox` guard makes it a lawful ranged-only field (riposte/lunge precedent); do NOT add to CONDS | yes | no | yes | no |
| `raise` | cairn | `onKill`: `if(a.raise&&SENTRY.length<3)SENTRY.push({x:e.x,y:e.y-6,t:perf+a.raise*(auraHas('foreman')?1.5:1),cd:0});` — cap 3; upSentry's copy-list must NOT carry it (no self-replicating turrets) | yes | **never** | yes | no |
| `stormcall` | stormcall | `onKill`: `if(a.stormcall)P.stormN=Math.min(3,(P.stormN||0)+1);` · `onHit`: `if(a.stormcall&&(P.stormN||0)>=3){P.stormN=0;arc(P.x,P.y-40,e.x,e.y,'#e6d34a');hurtEnemy(e,dmg*1.5,0,'#e6d34a',{shock:1.35},true);sfx('crit')}` — chained=true so the bolt never re-chains; 3-kills-per-proc is the rate limit (ref-research §1). Reset `P.stormN=0` in `newRun` (index.html:3540 block) | yes | no | yes | no |
| `noSt` | sterile | `strike`: change `let st=a.st;` → `let st=a.noSt?null:a.st;` (2687) · `projStrike`: `let st=p.st;` → `let st=p.noSt?null:p.st;` (3245). Everything else (leech, crit, explode) untouched | yes | no | yes | no |
| `hpCost` | bloodlet, bloodtithe | pay ONCE per attack, not per projectile/tick. `doMelee` (after the cd check, beside the `chan` gate at 2549) and `doRanged` (beside 2611): `if(a.hpCost){if(P.hp<=a.hpCost)return;P.hp-=a.hpCost}` — refuses at lethal, mirrors the chan refusal | no (paid at fire) | no | yes | no |
| `mine` | mine | flight-time, in `upProj` (§2 mine entry has the full branch). Add `mine:a.mine||0,armed:0,` to the FLIGHT literal (beside `grav`/`bounce`), not the conditional block | yes (flight literal) | no | yes | no |

effDps conditional credit (suite-13:70-75 and the suite-10 `sustain` block if desired):
`if(at.vsFull)m*=1+at.vsFull*0.15; if(at.slam)m*=1+at.slam*0.25; if(at.aloft)m*=1+at.aloft*0.35;
if(at.farshot)m*=1+at.farshot*0.5;` — without these, builds carried by the new conditionals
score at a fraction of real output (ref-items §11.2).

New classFx wiring (2 lines total):
- `shockBonus` — `resolveDmg`, directly after the burnBonus line (2189):
  `if(a.st&&a.st.shock&&classFx('shockBonus'))a.st.shock=1+(a.st.shock-1)*(1+classFx('shockBonus'));`
  (shock potency is a ≥1 multiplier; scale the excess, never the base).
- `bloodRise` — `condMul` (both paths pay, rule 16):
  `if(classFx('bloodRise')&&P.hp<P.maxhp*0.5)m*=1+classFx('bloodRise');`
  Persistent below-half states are settled house style (cornered, hunger, undertow).

New `foc:'shock'` hook (mirrors the `foc:'crit'` sites exactly):
- `strike()` after 2700: `if(CLASSES[META.cls].foc==='shock'&&hasSt(e,'shock'))gainFocus(FOCUS_HIT);`
- `projStrike()` after 3256: same line. Full FOCUS_HIT on both paths, same as the crit class.

---

## 1. CLASSES — two entries, paste into `CLASSES` (index.html:1059)

Update the header comment's fx-key list to add `shockBonus, bloodRise` and the foc list to add
`'shock'`. Classes are NOT in UNLOCKS (suite-13 shop honesty — ref-story §2).

```js
 conductor:{n:'Conductor',cost:110,d:'Wand and wire. Everything arcs. Earns focus from shocked prey.',
   kit:{melee:'sword',ranged:'wand',armor:'robe'}, gem:{slot:'ranged',id:'conduit'},
   foc:'shock', fx:{rangedDmg:.10,cdr:.12,ms:.05,hpMul:-.10,shockBonus:.4}},
 bloodletter:{n:'Bloodletter',cost:125,d:'Edge and vein. Bleeds everything, itself included. Earns focus while they bleed.',
   kit:{melee:'sword',ranged:'bow',armor:'vest'}, gem:{slot:'melee',id:'serration'},
   foc:'ailment', fx:{meleeDmg:.12,leech:.03,ms:.05,bloodRise:.25}},
```

Notes: conduit and serration exist and are color-legal when forced into socket 0 (suite-7 auto-
covers). Bloodletter reuses the existing `'ailment'` hook — its bleeds tick, zero new code;
identity separation from pyromancer is elemental, not mechanical. Conductor's `'shock'` hook is
the one new gainFocus site (§0).

`LORE.class` entries (suite-8 fails without them; voice per ref-story):

```js
  conductor:{n:'Conductor',d:`The guild kept losing wire-runners to the shard-charge, so it
started hiring the ones who liked it. A conductor is what you call a delver who has stopped
insulating.

They do not carry a lamp. They are one.`},
  bloodletter:{n:'Bloodletter',d:`An old rank, from before the guild had physicians. The kit has
not changed: something sharp, something to catch the red, and the professional opinion that
everything down here has too much of it.

They count what they lose and charge it to the deep.`},
```

### Harness seats (suite-10 — the list at line 247 is HARD-CODED)

1. `for (const cls of ['vanguard','marksman','pyromancer','delver','conductor','bloodletter'])`.
2. `build()` edits (suite-10:204-207): branch map — `conductor`→`'s'`, `bloodletter`→`'m'`:
   `const br = (cls==='marksman'||cls==='pyromancer'||cls==='conductor')?'s':(cls==='delver')?'c':'m';`
   and wslot: `const wslot=(cls==='marksman'||cls==='pyromancer'||cls==='conductor')?'ranged':'melee';`
3. Expected band fit (bands: trash 1-6, tough 3-16, TTD 4-20):
   - **conductor** = pyromancer's seat ±: inc rangedDmg .10 (vs pyro .15) but cdr .12 cuts the
     attack period ≈ net +5-8% dps on the same conc/fasteratk/addedfire wand — pyro passes all
     five bands with margin, conductor lands inside the same bands. TTD: hpMul −.10 > pyro's
     −.15, strictly more HP than a passing class.
   - **bloodletter** = vanguard's melee seat ±: meleeDmg .12 vs .10 ≈ +2% dps, same sword kit.
     TTD: hpMul 0 — same pool as delver, which passes. bloodRise/leech never trigger in the
     harness (player at full HP) so the seat is measured conservatively.

---

## 2. SKILL GEMS — 11 entries, paste into `GEMS` (skill block, ~line 600)

Gap coverage: reach melee (impale), pull melee (dragline), thrown hybrid (whipsaw), minion
(cairn), trap/mine (mine), storm ranged (stormlash), storm melee (arcblade — the FIRST b-color
melee skill; that color slot was empty), blood (bloodlet), vertical slam (deadweight), sniper
(longshot), fast-DoT-applicator (flurry). Skills own `a.dmg` (rule 5).

```js
 impale:   {t:'skill',for:'melee',n:'Impale', col:'r', d:'long thrust, narrow, staggers',
   mod:a=>{a.dmg*=1.4;a.cd*=1.3;a.range*=2.1;a.arc=Math.min(a.arc,32);a.kb*=1.4;a.stagger=(a.stagger||0)+0.2}},
 dragline: {t:'skill',for:'melee',n:'Dragline', col:'g', d:'long reach, hauls them to you',
   mod:a=>{a.dmg*=0.9;a.cd*=1.2;a.range*=2.4;a.arc=Math.min(a.arc,28);a.kb*=-1.6;a.stagger=(a.stagger||0)+0.15}},
 whipsaw:  {t:'skill',for:'ranged',n:'Whipsaw', col:'r', d:'heavy blade, comes back',
   mod:a=>{a.dmg*=1.9;a.speed*=0.55;a.cd*=1.4;a.pierce+=2;a.ret=190;a.kb*=1.5;a.col='#c9c9c9'}},
 cairn:    {t:'skill',for:'ranged',n:'Cairn', col:'g', d:'kills raise a turret from the corpse',
   mod:a=>{a.dmg*=0.85;a.cd*=1.1;a.raise=6;a.col='#9adcc8'}},
 mine:     {t:'skill',for:'ranged',n:'Shard Mine', col:'r', d:'plant it, walk away',
   mod:a=>{a.dmg*=2.2;a.speed*=0.5;a.grav=1;a.mine=1;a.explode=Math.max(a.explode||0,64);a.life=12;a.cd*=1.6;a.col='#e0c04a'}},
 stormlash:{t:'skill',for:'ranged',n:'Stormlash', col:'b', d:'fast bolt, shocks and chains',
   mod:a=>{a.dmg*=0.9;a.cd*=0.85;a.speed*=1.3;a.chain=(a.chain||0)+2;a.st=a.st||{};a.st.shock=Math.max(a.st.shock||0,1.3);a.col='#e6d34a'}},
 bloodlet: {t:'skill',for:'melee',n:'Bloodlet', col:'r', d:'costs blood, bleeds hard, feeds you',
   mod:a=>{a.dmg*=1.6;a.hpCost=(a.hpCost||0)+3;a.leech=(a.leech||0)+0.10;a.kb*=1.2;a.stR=a.stR||{};a.stR.bleed=Math.max(a.stR.bleed||0,0.5)}},
 deadweight:{t:'skill',for:'melee',n:'Deadweight', col:'r', d:'hits harder the faster you fall',
   mod:a=>{a.dmg*=1.5;a.cd*=1.35;a.slam=(a.slam||0)+1.1;a.explode=Math.max(a.explode||0,40);a.kb*=1.6;a.dig=Math.max(a.dig||0,1)}},
 longshot: {t:'skill',for:'ranged',n:'Longshot', col:'g', d:'flies far, hurts far',
   mod:a=>{a.dmg*=1.3;a.cd*=1.2;a.speed*=1.4;a.farshot=(a.farshot||0)+0.9;a.critAdd=(a.critAdd||0)+0.10;a.life=Math.max(a.life||2,2.5)}},
 flurry:   {t:'skill',for:'melee',n:'Flurry', col:'g', d:'many small cuts, very fast',
   mod:a=>{a.dmg*=0.55;a.cd*=0.45;a.range*=0.85;a.kb*=0.5;a.stagger=(a.stagger||0)+0.08}},
 arcblade: {t:'skill',for:'melee',n:'Arcblade', col:'b', d:'hits shock, and jump once',
   mod:a=>{a.dmg*=1.05;a.cd*=0.95;a.chain=(a.chain||0)+1;a.st=a.st||{};a.st.shock=Math.max(a.st.shock||0,1.25);a.col='#e6d34a'}},
```

Why each is the best answer for SOMETHING (no redundancy audit):
- **impale** — hit before they reach you; only melee skill that trades arc for range with a
  damage premium. Pairs bracing/punish (stagger feeds vsSpent).
- **dragline** — the negative-kb pull. `strike(e,a,Math.sign(dx||P.face)*a.kb)` (2559) means a
  negative `a.kb` hauls the target toward you — the point-blank enabler for sporeburst/mine/
  nova builds. Nothing else moves ENEMIES to YOU.
- **whipsaw** — melee-feel at range: slow, returning (`ret` clears hitList so it double-hits),
  best per-shot damage in the g/r short-range space; the momentum-runner's ranged hand.
- **cairn** — the minion skill. Kills convert to turret uptime (turrets fire your CURRENT
  ranged attack per upSentry — the support-output law holds: output derives from the player).
  Sentry projectiles never carry `raise`, so turrets cannot raise turrets.
- **mine** — the trap. Full upProj branch: unarmed → flies with grav; on the terrain-contact
  branch that would kill a non-tunneler: `p.vx=0;p.vy=0;p.grav=0;p.armed=1` (snap y to tile
  top), do not die. Armed → scan EN for nearest with `dist < p.explode*0.75+e.w/2` →
  `projStrike(e,p)` THEN `explode(p.x,p.y,p.explode,p.dmg,p.col,p.st,p,e)` — hit first, then
  blast (comment 3227-3230), so leech/focus/riders pay. Direct body hits while in flight use
  the normal impact path (a mine thrown INTO something just detonates). `t` expiry = quiet
  fizzle burst, no explosion. Player-owned: no telegraph mark needed.
- **stormlash** — the storm skill: built-in chain+shock, faster than lightning, no pierce —
  distinct from lightning (pierce spam, no shock) and from conduit (support, no chain).
- **bloodlet** — the blood skill: self-draining (hpCost feeds hunger's below-half window),
  self-healing (leech), heaviest bleed ratio in the game (0.5 vs rend's 0.35).
- **deadweight** — the vertical slam: `slam` scales with FALL SPEED (FALL_SAFE=520 as the
  full-credit point, cap ×1.5 extra at 1.1 coefficient), carves rock (dig 1), explodes.
  The jetpack-dive and shaft-drop weapon; synergises with vantage (falling is airborne) and
  plumbline. Ranged pays too (thrown while falling) — parity holds via CONDS.
- **longshot** — distance-scaled crit bolt (`farshot` reads projectile travel from `ox/oy`).
  The crossbow sniper's skill; anti-synergy with point-blank builds is the point.
- **flurry** — 2.2× attack rate at 45% damage: the ailment saturator (STACK_MAX 3 replace-
  weakest means cd ≤ dur/3 saturates — flurry is the cheapest way there) and the tempo/
  momentum engine. Distinct from fasteratk (support, ×1.25) by being extreme and owning the attack.
- **arcblade** — the only b-colored melee skill in the game; conductor's melee hand. Shock +
  one chain on a barely-taxed swing.

---

## 3. SUPPORT GEMS — 10 entries, paste into `GEMS` (sup block)

THE PURE-MULTIPLIER BUDGET IS FULL (suite-13: `pure <= 4`, 4 exist). Every entry below writes
at least one non-`more/cd/dmg/kb` field, so the probe classes all ten as contract-changers.
Damage always through `a.more` (rule 5). Shapes per ref-research §1: trade / lockout /
conversion / conditional / tempo.

```js
 sterile:  {t:'sup',for:'any', n:'Sterile', col:'b', d:'+35% more damage, hits carry nothing',
   mod:a=>{a.more*=1.35;a.noSt=1}},
 firstblow:{t:'sup',for:'any', n:'First Blow', col:'g', d:'+70% more to an unhurt enemy',
   mod:a=>{a.vsFull=(a.vsFull||0)+0.7;a.more*=0.9}},
 bloodtithe:{t:'sup',for:'any',n:'Blood Tithe', col:'r', d:'+45% more damage, each attack costs blood',
   mod:a=>{a.more*=1.45;a.hpCost=(a.hpCost||0)+2}},
 overdraw: {t:'sup',for:'any', n:'Overdraw', col:'b', d:'+50% more damage, attacks drain focus',
   mod:a=>{a.more*=1.5;a.chan=(a.chan||0)+8}},
 seeker:   {t:'sup',for:'ranged',n:'Seeker', col:'g', d:'projectiles steer toward prey',
   mod:a=>{a.homing=(a.homing||0)+1.6;a.speed*=0.75;a.more*=0.85}},
 stormcall:{t:'sup',for:'any', n:'Stormcall', col:'b', d:'three kills charge a thunderbolt',
   mod:a=>{a.stormcall=1;a.more*=0.9}},
 longhaft: {t:'sup',for:'melee',n:'Long Haft', col:'r', d:'half again the reach, narrower swing',
   mod:a=>{a.range*=1.5;a.arc=Math.min(a.arc,50);a.more*=0.95}},
 ricochet: {t:'sup',for:'ranged',n:'Ricochet', col:'g', d:'projectiles bounce off the rock',
   mod:a=>{a.bounce=(a.bounce||0)+2;a.life=(a.life||2)*1.3;a.more*=0.88}},
 vantage:  {t:'sup',for:'any', n:'Vantage', col:'g', d:'+40% more while airborne',
   mod:a=>{a.aloft=(a.aloft||0)+0.4;a.more*=0.92}},
 rasp:     {t:'sup',for:'any', n:'Rasp', col:'r', d:'hits file away armor',
   mod:a=>{a.sunder=(a.sunder||0)+2;a.more*=0.92}},
```

Shape + four-place registration (per conditional; sites are in §0's table):
- **sterile** — LOCKOUT (Elemental Focus). Registration: noSt guards in strike+projStrike,
  ride-along, FIELDS. Deliberate anti-synergy: kills ignite/serration/kindling/deepcut lines —
  the crit-hit archetype's multiplier that the ailment archetype cannot borrow.
- **firstblow** — CONDITIONAL on visible state (Ambush). condMul + ride-along + upSentry copy
  + FIELDS + CONDS. Best on high-alpha single shots (mine, crossbow, longshot); worthless on
  channels — the drawback is structural.
- **bloodtithe** — RESOURCE TRADE. Shares the `hpCost` machinery with bloodlet (one gate, two
  payers). Bloodletter's core support; drains you into hunger/undertow/cornered range on purpose.
- **overdraw** — RESOURCE TRADE on the other axis: rides the existing `chan` gate (doMelee 2549
  / doRanged 2611 — both hands already pay), so attacking now competes with abilities for
  Focus. No new wiring beyond FIELDS (chan is already listed).
- **seeker** — TARGETING rule change: `homing` was skill-only (wisp); this makes hail/grenade/
  whipsaw track. Flight-time field, already in the PROJ literal.
- **stormcall** — TEMPO (Fist of War): rate-limited by kills, not time. onKill/onHit riders
  (§0), ride-along, FIELDS. Conductor's clear-speed capstone.
- **longhaft** — TRADE on the shape axis (range↑ arc↓) with a real more-discount; the reach
  enabler for cleave/rend builds that don't want impale's speed tax.
- **ricochet** — flight contract: bounce for everyone (hail's trick, portable). Walls become
  a weapon in tight caves; useless in open caverns — geometry-conditional by nature.
- **vantage** — CONDITIONAL on player positioning: the flight-game offensive stat. condMul +
  ride-along + FIELDS + CONDS. Synergy: deadweight (falling IS airborne), levitate, updraft.
- **rasp** — onHit rider through the existing `sunder` field (already in FIELDS/ride-along —
  zero new wiring). The deterministic answer to Threat II+ armor for ranged builds (sunder the
  skill is melee-only). Deliberately weaker per-hit than the skill; stacks with attack speed.

---

## 4. AURAS — 5 entries + exact consumer sites (NO dead-aura test exists — test block specced in §7)

```js
 galvanic: {t:'aura',for:'armor',n:'Galvanic', col:'b', d:'shocks last longer and arc further'},
 surfeit:  {t:'aura',for:'armor',n:'Surfeit', col:'r', d:'leech past full becomes an overshield'},
 foreman:  {t:'aura',for:'armor',n:'Foreman', col:'g', d:'your constructs work harder and last longer'},
 slipstream:{t:'aura',for:'armor',n:'Slipstream', col:'g', d:'dodging reloads both weapons'},
 plumbline:{t:'aura',for:'armor',n:'Plumbline', col:'r', d:'a hard landing is a weapon'},
```

Consumer sites (every `auraHas('id')` read, exhaustive):
- **galvanic** (storm anchor): (1) `applyStatus` (2456): where a non-player target's duration is
  set — `if(!isPlayer&&k==='shock'&&auraHas('galvanic'))dur*=1.5;` (2) `shockChain` (2490):
  range `110→170` and ratio `0.45→0.60` when `auraHas('galvanic')`. Live reads, never cached.
- **surfeit** (blood anchor): replace the two leech-heal lines — strike 2694
  (`if(a.leech)P.hp=Math.min(...)`) and projStrike 3250 — with `leechHeal(dmg*a.leech)`:
  `function leechHeal(n){if(n<=0)return;const ov=P.hp+n-P.maxhp;P.hp=Math.min(P.maxhp,P.hp+n);
  if(ov>0&&auraHas('surfeit')){P.shield=Math.min(P.maxhp*0.3,(P.shield||0)+ov);
  P.shieldT=Math.max(P.shieldT||0,perf+4)}}` — reuses Bulwark's `P.shield/P.shieldT`
  (shieldT is absolute perf time, cleared at 3404). Converts wasted leech into defense; the
  bloodletter's sustain capstone.
- **foreman** (minion anchor): (1) `upSentry` (3268): fire-period factor `cd*1.4` →
  `cd*(auraHas('foreman')?1.1:1.4)`; (2) `useAbility` sentry branch: lifetime `perf+8` →
  `perf+(auraHas('foreman')?11:8)`; (3) decoy/effigy branches: `+3s` lifetime the same way;
  (4) cairn's raise line already carries the ×1.5 (§0).
- **slipstream** (finesse/timing — playtest finding 4): `dodge()` (3465), inside the fired
  branch: `if(auraHas('slipstream')){P.mcd=0;P.rcd=0}`. Rewards dodge-weaving into attacks;
  no damage number anywhere.
- **plumbline** (vertical anchor): the fall-damage block in `upPlayer` (3448), alongside the
  damage: `if(auraHas('plumbline'))explode(P.x,P.y+P.h/2,60,14*depthDmg(P.y),'#b0a070',null,
  {crit:0,critMult:1.5,dig:0});` — player-side damage rides `depthDmg` (the thorns precedent,
  ref-research §8) or it silently dies at depth. Fall damage still applies — featherfall
  PREVENTS the trigger; the two auras are exclusive by design. `addShake` NOT called (fall
  already shakes 6; §5.2 calibration).

---

## 5. ABILITIES — 5 entries + fx branches (`useAbility`, index.html:2281)

All effects through BUFFS / HAZ / carve / PROJ / DECOY / P-timers only. Base `a.dmg`=40
resolved through player pools; depthMul decisions stated per branch and consistent with
neighbours (meteor/quake scale; crucible/rupture/bulwark don't).

```js
 bastion:  {t:'abil',for:'armor',n:'Bastion', col:'r', cd:12, fc:40, fx:'bastion', d:'stand and be stone — 3s of heavy armor'},
 effigy:   {t:'abil',for:'armor',n:'Effigy', col:'g', cd:14, fc:45, fx:'effigy', d:'a decoy with thorns — it bites back'},
 lodestone:{t:'abil',for:'armor',n:'Lodestone', col:'b', cd:9, fc:15, fx:'lode', d:'plant it; strike again to snap back'},
 tempest:  {t:'abil',for:'armor',n:'Tempest', col:'b', cd:15, fc:55, fx:'tempest', d:'a standing storm — everything under it arcs'},
 transfuse:{t:'abil',for:'armor',n:'Transfuse', col:'r', cd:14, fc:45, fx:'transfuse', d:'rip the bleeds out of the room and drink them'},
```

Branches:

```js
 else if(a.fx==='bastion'){ // defensive (brief). Pure BUFFS contract — apply + push + refresh; tickBuffs reverses.
  RUNB.arm+=25;BUFFS.push({k:'arm',v:25,until:perf+3});
  RUNB.sres+=0.25;BUFFS.push({k:'sres',v:0.25,until:perf+3});
  refreshAttacks();sfx('abil');burst(P.x,P.y,'#b0a070',12)}
 else if(a.fx==='effigy'){ // minion-ish (brief). Output derives from the OWNER: a.dmg is player-resolved.
  const dm=depthMul(P.y);
  DECOY={x:P.x+P.face*30,y:P.y,t:perf+8,hp:60+a.dmg*1.5,spikes:a.dmg*0.4*dm};
  sfx('abil');burst(P.x+P.face*30,P.y,'#7f9455',14)}
 else if(a.fx==='lode'){ // mobility (brief). One button, tap-tap — thumb/stick/cursor all fine.
  if(P.lode&&perf<P.lode.until){P.x=P.lode.x;P.y=P.lode.y;P.vx=0;P.vy=0;P.inv=Math.max(P.inv,0.3);
   P.lode=null;sfx('abil');burst(P.x,P.y,'#9fd0ff',16)}
  else{P.lode={x:P.x,y:P.y,until:perf+8};a.cd=0.8;sfx('abil');burst(P.x,P.y,'#9fd0ff',8)}}
 else if(a.fx==='tempest'){ // storm anchor. Area denial = HAZ, never a projectile (rule 19). No depthMul: crucible precedent.
  addHaz(P.x,P.y-10,130,5,a.dmg*0.30,{shock:1.35},'#e6d34a',1,'shock');
  sfx('abil');flash(0.15);burst(P.x,P.y-10,'#e6d34a',20)}
 else if(a.fx==='transfuse'){ // blood anchor. rule-8 shape: e.st.bleed is always an array.
  let heal=0;
  for(const e of EN){if(Math.hypot(e.x-P.x,e.y-P.y)>160)continue;
   const b=stSum(e,'bleed');if(b>0){heal+=b*1.2;if(e.st&&e.st.bleed)e.st.bleed=[];burst(e.x,e.y,'#e05555',8)}}
  P.hp=Math.min(P.maxhp,P.hp+Math.min(heal,P.maxhp*0.4));sfx('abil')}
```

Extra wiring: effigy reflect — at the landed-enemy-swing site (3125), after `DECOY.hp-=e.dmg;`:
`if(DECOY&&DECOY.spikes)hurtEnemy(e,DECOY.spikes,120,'#7f9455',null,true);` (chained=true; the
grind site 3287 does NOT reflect — no per-frame tick damage). Lodestone: `a.cd=0.8` in the
plant arm works because `useAbility` assigns `P.acd=a.cd` AFTER the branch — VERIFY that order
at implementation; clear `P.lode=null` in `newRun` (3540 block); render draws a small static
glyph at `P.lode` (RRNG only, no sim mutation). Transfuse heal cap 40% maxhp/cast; enemy
potencies already depth-scale, so the heal rides the curve for free.

---

## 6. UNLOCKS — paste at the end of `UNLOCKS` (index.html:1652)

Pricing: existing bands — first tier 30-85, build-definers 85-125, conditional wave 100-135.
This wave sits 90-130. Every gem here; classes never (suite-13).

```js
 // ---- content wave 4: storm and blood, and the shapes between. ----
 {id:'impale',    n:'Impale gem',              cost:95},
 {id:'dragline',  n:'Dragline gem',            cost:110},
 {id:'whipsaw',   n:'Whipsaw gem',             cost:100},
 {id:'cairn',     n:'Cairn gem (minion)',      cost:125},
 {id:'mine',      n:'Shard Mine gem (trap)',   cost:115},
 {id:'stormlash', n:'Stormlash gem',           cost:105},
 {id:'bloodlet',  n:'Bloodlet gem',            cost:110},
 {id:'deadweight',n:'Deadweight gem',          cost:115},
 {id:'longshot',  n:'Longshot gem',            cost:95},
 {id:'flurry',    n:'Flurry gem',              cost:90},
 {id:'arcblade',  n:'Arcblade gem',            cost:100},
 {id:'sterile',   n:'Sterile support',         cost:120},
 {id:'firstblow', n:'First Blow support',      cost:115},
 {id:'bloodtithe',n:'Blood Tithe support',     cost:110},
 {id:'overdraw',  n:'Overdraw support',        cost:105},
 {id:'seeker',    n:'Seeker support',          cost:100},
 {id:'stormcall', n:'Stormcall support',       cost:130},
 {id:'longhaft',  n:'Long Haft support',       cost:90},
 {id:'ricochet',  n:'Ricochet support',        cost:95},
 {id:'vantage',   n:'Vantage support',         cost:110},
 {id:'rasp',      n:'Rasp support',            cost:95},
 {id:'galvanic',  n:'Galvanic aura',           cost:100},
 {id:'surfeit',   n:'Surfeit aura',            cost:105},
 {id:'foreman',   n:'Foreman aura',            cost:95},
 {id:'slipstream',n:'Slipstream aura',         cost:110},
 {id:'plumbline', n:'Plumbline aura',          cost:90},
 {id:'bastion',   n:'Bastion gem (ability)',   cost:100},
 {id:'effigy',    n:'Effigy gem (ability)',    cost:115},
 {id:'lodestone', n:'Lodestone gem (ability)', cost:105},
 {id:'tempest',   n:'Tempest gem (ability)',   cost:125},
 {id:'transfuse', n:'Transfuse gem (ability)', cost:120},
```

31 entries, 3,295 shards. Regenerate CURRENT-STATE.md via `design/audit.sh` after landing.

---

## 7. TEST-SUITE EDITS — exact and exhaustive

1. **suite-10.js:247** — class list += `'conductor','bloodletter'`.
2. **suite-10.js `build()` (~204-207)** — br map: conductor→`'s'`, bloodletter→`'m'`; wslot set
   += conductor (ranged). (Exact lines in §1.)
3. **suite-13.js FIELDS (127-130)** += `'slam','aloft','vsFull','farshot','raise','stormcall',
   'noSt','hpCost','mine'`.
4. **suite-13.js CONDS (168-175)** += `{f:'slam',set:()=>{P.vy=520}}`, `{f:'aloft',
   set:()=>{P.onG=false}}`, `{f:'vsFull',set:null}`. farshot deliberately excluded (ranged-only
   field, riposte precedent).
5. **suite-13.js effDps (~70-75)** += vsFull×0.15 / slam×0.25 / aloft×0.35 / farshot×0.5 credit
   lines (§0). Mirror the vsFull/slam credits into suite-10's `sustain` block if the seat drifts.
6. **suite-13.js ARCH (~36-52)** += four rows:
```js
  { n: 'Storm Conduit',     cls: 'conductor',  slot: 'ranged', base: 'wand',     gems: ['stormlash', 'chainbolt', 'overdraw'],   armor: ['galvanic'] },
  { n: 'Blood Price',       cls: 'bloodletter',slot: 'melee',  base: 'sword',    gems: ['bloodlet', 'bloodtithe', 'hunger'],     armor: ['surfeit'] },
  { n: 'Minelayer',         cls: 'delver',     slot: 'ranged', base: 'crossbow', gems: ['mine', 'firstblow', 'conc'],            armor: ['vigil'] },
  { n: 'Skyfall',           cls: 'vanguard',   slot: 'melee',  base: 'greataxe', gems: ['deadweight', 'vantage', 'heavyimpact'], armor: ['plumbline'] },
```
   (Do NOT pair sterile with stormlash/bloodlet in ARCH — sterile nulls their statuses; that
   anti-synergy is design, not a harness seat.)
7. **suite-13 KNOWN** — no edits (no new boon/attunement keys in this spec).
8. **doRanged ride-along (2620-2624)** += `slam,farshot,vsFull,aloft,stormcall,raise,noSt`
   (conditional block) and `mine:a.mine||0,armed:0` (flight literal). **upSentry (3277-3281)**
   += `vsFull` ONLY.
9. **suite-8** — `LORE.class` coverage is dynamic; the two blurbs in §1 satisfy it. No edit.
10. **NEW test blocks** (suite-7 style, or a `test/suite-16.js` registered in `run.sh` —
    nothing automated catches dead auras or missing abil branches):
    - abil branches: bastion raises `P.armor` for 3s and tickBuffs reverses it; effigy sets
      `DECOY.spikes>0` and a landed enemy swing loses HP; lodestone plants, snaps back
      (position restored, `P.inv>0`), expires at 8s; tempest leaves exactly one friendly HAZ
      (kind 'shock') that damages an enemy inside it; transfuse empties `e.st.bleed` arrays in
      range and heals ≤40% maxhp. Use `TOPUP()` between casts; move off camp first.
    - auras: galvanic — shock duration ×1.5 on an enemy and shockChain reaches 150px; surfeit
      — overleech at full HP yields `P.shield>0`, capped at 0.3×maxhp; foreman — sentry fires
      more often over 5 simulated seconds; slipstream — `P.mcd===0` after dodge with a hot
      weapon; plumbline — a >FALL_SAFE landing damages an adjacent enemy.
    - mine: fired mine survives terrain contact (`armed===1`), detonates when an enemy walks
      inside 0.75×explode, kill grants Focus and leech (projStrike path taken).
    - hpCost: attack refuses at `P.hp<=cost`; a 3-projectile volley pays once.
    - foc 'shock': conductor hitting a shocked enemy gains 2×FOCUS_HIT total on melee AND
      ranged paths; unshocked target gains baseline only.
11. Run order: `./test/run.sh` full; suites 7/10/13 are the load-bearing ones here;
    `node test/browser.js` for codex reveal of the two new class pages.

---

## 8. RISKS / VERIFY-AT-IMPLEMENTATION

- **dragline's negative kb** — `hurtEnemy`'s kb application must tolerate a negative impulse
  (pull) without flipping any facing/pop logic; eyeball the shove code before shipping.
- **lodestone cd override** — depends on `P.acd=a.cd` executing after the fx branch; if it is
  before, set `P.acd=0.8` directly in the plant arm instead.
- **suite-13 spread** — overdraw at ×1.5 more is the largest new multiplier; if best/worst
  exceeds 4.5×, trim to ×1.4 (its focus drain is invisible to effDps).
- **mine terrain-arming** — the upProj terrain branch has three behaviors (die/bounce/tunnel);
  the arm must intercept only the die case (a bounced mine with `bounce` from Ricochet should
  bounce first, then arm on last contact).
- **rasp vs Whetstone boon** — same field (`sunder`), different bag; if the stack (2+2+3=7
  armor/hit) trivializes Threat II, floor enemy armor at 0 (it already is) and accept it —
  armor-shred is the designed counter.
- **Suite-14/9 untouched** — nothing here touches terrain strands, POIs, or world gen; carve
  is only reached through deadweight's existing `dig` field and explode's standard carve.
