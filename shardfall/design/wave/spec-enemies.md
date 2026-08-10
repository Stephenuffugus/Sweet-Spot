# SPEC — THE ROSTER EXPANSION (enemies 26 → 38, elites 8 → 11)

Designed against: creative-brief.md, ref-enemies.md (the contract), ref-art.md (laws + inventory),
ref-story.md (voice), ref-research.md (roles/fairness), CURRENT-STATE.md (live numbers).
All line anchors are commit `3c446e9`.

## ID MANIFEST (collision-checked against ENEMIES 26, GEMS 77, GEAR 12, UNLOCKS 83, ELITES 8,
## ATTUNE 29, BOONS 21, TREE 15, BOUNTIES 12, SIGILS 5, CLASSES 4, and spec-gear-forge.md's ids)

- ENEMIES: `blackdamp` `mender` `hypha` `drudge` `lurcher` `pavise` `cinder` `clinker`
  `seep` `voidmote` `cleft` `gazer`
- ELITES: `quaking` `searing` `tithing`
- New mechanic FIELDS (not ids, named to dodge the id namespace anyway): `tremor` `sear`
  `tithe` on ELITES rows; `split` becomes `{into,n}` on ENEMIES rows.
- No new statuses, no new HAZ kinds, no new boss patterns, no new input actions, no new ramps,
  no new accent chars. Nothing enters the unlock pool (enemies never do).

Code touched beyond tables (each is one keyed-off-field site, rule 4 clean):
1. `killEnemy` ~2787 — split field-ification (§6).
2. `eliteFor` ~1003 — two new fairness bars (§5).
3. Elite consumption: `tremor` at the end-of-swing site (the `e.slammed` neighbourhood, ~3135),
   `sear` at enemy-shot spawn + enemy-proj termination, `tithe` beside `drain`/`hex`
   (3130/3175 and the contact path).
4. `hurtEnemy` ~2733 — the front-shield refinement: `!e.wind` → `!(e.wind||e.swind)` (§2, pavise).
   Shieldman has no `shoot`, so its behaviour is bit-identical.

---

## 1. THE TWELVE — role-gap justification first

Suite-11 six-role coverage today (swarm/bruiser/ranged/support/denial/terrain):

| band | has | GAPS |
|---|---|---|
| caves | swarm bruiser ranged terrain | **support, denial** |
| fungal | swarm bruiser ranged denial | **support, terrain** |
| ruins | bruiser ranged support denial terrain | **swarm** |
| forge | bruiser ranged support denial terrain | **swarm** |
| abyss | bruiser ranged support terrain | **swarm, denial** |

Placements. Where a band's six-role coverage was already full (ruins, forge lack only swarm),
the extra entries are researched RECOMBINATIONS (ref-research §2: "add recombinations, not an
11th role") and each names the distinct verb it punishes:

| id | band | six-role it adds | verb / recombination |
|---|---|---|---|
| blackdamp | caves | denial (burstOnDeath) | floating mine — kill it at range or leave before the pop |
| mender | fungal | support (heal) | target priority, taught one band before the chanter makes it lethal |
| hypha | fungal | terrain (burrows) + denial (trail) | the tunnel it digs toward you is poisoned — never retreat down its hole |
| drudge | ruins | swarm (pack:4) | armored chaff — armor floor makes fast weak hits pay; they screen the chanter |
| lurcher | ruins | swarm (pack:2) | spacing — paired pounce; the dodge that beats the first sets up the second. Ruins' first fast enemy (band spd was 16–58) |
| pavise | ruins | — (recombination: blocker+sniper) | the shield drops only while the shot winds — flank, interrupt, or punish the slit |
| cinder | forge | swarm (pack:3, fly) | anti-air — the hover stops being the answer (research ladder: forge introduces anti-air) |
| clinker | forge | bruiser + denial (burstOnDeath+burnDeath) | blocker+exploder — get behind it, then get away from it |
| seep | abyss | denial (trail, chill) | the floor slows you into the next hit; kill it off your fighting ground |
| voidmote | abyss | swarm (pack:3, fly) | flyer swarm for the vast band (air 0.62) — the dark arrives in threes |
| cleft | abyss | bruiser | graduation splitter: → 2 voidspawn → 4 voidlings; corner-kills are a mistake, squared |
| gazer | abyss | — (recombination: sniper+flyer) | the band's only long-range threat; punishes lingering in open dark |

Surface stays one species by design (10m thick, exempt from suite-11 band rules).
Band sizes after: caves 7, fungal 8, ruins 10, forge 8, abyss 9. All single-band rosters
(no cross-roster additions) — each sprite answers exactly one biome's laws.

### 1.1 ENEMIES rows — paste block

Insert after `hollowed`, before the MINIBOSSES comment, under one banner:

```js
 // ---- CONTENT WAVE 3: the bench (spec-enemies) ----
 // Every entry fills a named role gap in its band or recombines two taught roles. Constraints
 // honoured by hand: atkReach = range+lunge*act <= 78; atk.wind >= 0.26 in the table (no Threat
 // tier multiplies wind — suite-10); shoot.wind >= 0.26 BY HAND (mkAtk does not clamp it).
 // CAVES — the old shafts kill without teeth
 blackdamp:{hp:28,dmg:12,spd:36,w:14,h:12,ai:'fly',c:'#8fa060',shards:3,burstOnDeath:40,
   atk:{cd:2.0,range:20,wind:.30,act:.14,rec:.26,kb:90,lunge:140}},   // drifts, pops into chill
 // FUNGAL — the colony repairs itself, and travels
 mender:{hp:44,dmg:9,spd:40,w:13,h:14,ai:'fly',c:'#9a72bd',shards:7,
   heal:{cd:2.8,amt:.5,cap:.22,range:170},
   atk:{cd:2.6,range:20,wind:.34,act:.12,rec:.28,kb:80,lunge:100}},   // floating spore-nurse
 hypha:{hp:60,dmg:16,spd:52,w:15,h:13,ai:'fly',c:'#8a9f5f',shards:7,burrows:1,
   trail:{every:.8,r:22,t:3.5,dmg:.16,st:{bleed:.35},col:'#5c6b3b',kind:'gas'},
   atk:{cd:1.9,range:24,wind:.34,act:.16,rec:.30,kb:180,lunge:230}},  // digs a poisoned tunnel
 // RUINS — the corridors get bodies, speed, and a wall that shoots
 drudge:{hp:16,dmg:9,spd:60,w:10,h:11,ai:'walk',c:'#6f7889',shards:1,arm:3,pack:4,
   atk:{cd:1.3,range:16,wind:.26,act:.10,rec:.18,kb:80,lunge:180}},   // armored chaff, a screen
 lurcher:{hp:30,dmg:16,spd:104,w:15,h:12,ai:'walk',c:'#9c9276',shards:4,pack:2,
   atk:{cd:1.4,range:24,wind:.28,act:.14,rec:.26,kb:160,lunge:320}},  // hunts in braces, pounces past
 pavise:{hp:60,dmg:14,spd:18,w:16,h:18,ai:'walk',c:'#6f7889',shards:8,arm:14,front:1,
   atk:{cd:2.5,range:26,wind:.44,act:.16,rec:.36,kb:220,lunge:110},
   shoot:{cd:2.8,dmg:18,speed:340,count:1,spread:0,col:'#cfc4a8',range:440,wind:.60}}, // shield drops to fire
 // FORGE — the air stops being safe, and the wall detonates
 cinder:{hp:12,dmg:9,spd:80,w:9,h:9,ai:'fly',c:'#e08a48',shards:1,pack:3,
   atk:{cd:1.3,range:16,wind:.26,act:.10,rec:.16,kb:60,lunge:220}},   // rising sparks, in threes
 clinker:{hp:110,dmg:18,spd:24,w:19,h:19,ai:'walk',c:'#c9743a',shards:8,arm:9,front:1,
   burstOnDeath:48,burnDeath:1,
   atk:{cd:2.4,range:30,wind:.48,act:.20,rec:.42,kb:280,lunge:160}},  // crust forward, dies outward
 // ABYSS — graduation: the dark leaks, swarms, splits and watches
 seep:{hp:66,dmg:15,spd:30,w:16,h:14,ai:'walk',c:'#5c5090',shards:8,
   trail:{every:.6,r:24,t:4.0,dmg:.18,st:{chill:.6},col:'#574a97',kind:'gas'},
   atk:{cd:2.2,range:26,wind:.40,act:.16,rec:.34,kb:200,lunge:170}},  // a wet cold that stays
 voidmote:{hp:14,dmg:10,spd:82,w:10,h:9,ai:'fly',c:'#7c6cc9',shards:2,pack:3,
   atk:{cd:1.5,range:18,wind:.26,act:.12,rec:.18,kb:70,lunge:240}},   // specks with an opinion
 cleft:{hp:130,dmg:20,spd:40,w:20,h:20,ai:'walk',c:'#7c6cc9',shards:12,cost:8,
   split:{into:'voidspawn',n:2},
   atk:{cd:2.2,range:30,wind:.44,act:.18,rec:.38,kb:260,lunge:200}},  // 1 -> 2 -> 4; the arithmetic is the ambush
 gazer:{hp:55,dmg:14,spd:44,w:14,h:16,ai:'fly',c:'#9c9276',shards:9,
   atk:{cd:2.4,range:22,wind:.34,act:.14,rec:.30,kb:120,lunge:140},
   shoot:{cd:3.0,dmg:26,speed:520,count:1,spread:0,col:'#cfc9ff',range:560,wind:.65}}, // the long look
```

Constraint audit (every row):

| id | atkReach (≤78) | atk.wind (≥.26) | shoot.wind (≥.26 by hand) | notes |
|---|---|---|---|---|
| blackdamp | 20+140×.14 = 39.6 | .30 | — | burst r40, chill cloud (no burnDeath) |
| mender | 20+100×.12 = 32.0 | .34 | — | heal from SELF: min(own maxhp×.5, target×.22) |
| hypha | 24+230×.16 = 60.8 | .34 | — | burrows ⇒ ai:'fly' (the burrow branch lives there) |
| drudge | 16+180×.10 = 34.0 | .26 | — | |
| lurcher | 24+320×.14 = 68.8 | .28 | — | spd 104 ≥ 90 ⇒ Swift auto-barred (fair) |
| pavise | 26+110×.16 = 43.6 | .44 | .60 | front:1; Vampiric auto-barred (shoot) |
| cinder | 16+220×.10 = 38.0 | .26 | — | spd 80 < 90 keeps Swift legal (bat precedent: 78) |
| clinker | 30+160×.20 = 62.0 | .48 | — | |
| seep | 26+170×.16 = 53.2 | .40 | — | Roiling auto-barred (trail); so is hypha |
| voidmote | 18+240×.12 = 46.8 | .26 | — | |
| cleft | 30+200×.18 = 66.0 | .44 | — | explicit `cost:8` (§7) |
| gazer | 22+140×.14 = 41.6 | .34 | .65 | heaviest grunt shot (26) carries the longest grunt tell — boss-tell law |

### 1.2 BIOMES roster diff (line ~585 — the fifth element only)

```js
 [400,'caves',2,0.055,['crawler','bat','rockling','delvemite','burrower','spitter','blackdamp']],
 [900,'fungal',4,0.06,['spitter','sporeling','stalker','bat','bloomback','delvemite','mender','hypha']],
 [1600,'ruins',5,0.05,['brute','archer','shieldman','chanter','warder','mortar','burrower','drudge','lurcher','pavise']],
 [2400,'forge',6,0.055,['ember','smith','spitter','mortar','warder','burrower','cinder','clinker']],
 [WORLD_H,'abyss',7,0.045,['wraith','voidspawn','stalker','hollowed','chanter','seep','voidmote','cleft','gazer']],
```

---

## 2. DANGER — the envelope, per band (assignment item 2)

Suite-10 re-derives each band's `tough` (max hp) and `deadly` (max dmg) live from the roster.
**Every addition stays strictly inside the current envelope, so the TTK/TTD species do not
change in any band** and the bands hold for all four classes — and for the two future classes
whenever they join suite-10's hard-coded list — by construction, not by re-tuning:

| band | toughest (hp) stays | new max hp | deadliest (dmg) stays | new max dmg |
|---|---|---|---|---|
| caves | rockling 70 | blackdamp 28 | burrower 20 | 12 |
| fungal | bloomback 120 | hypha 60 | stalker 19 | hypha 16 |
| ruins | brute 85 | pavise 60 | brute/burrower 20 | lurcher 16 |
| forge | smith 150 | clinker 110 | smith 24 | clinker 18 |
| abyss | hollowed 140 | cleft 130 | hollowed 24 | cleft 20 |

Adjacent suite-11 band invariants, checked with the new minima:

- Bulk ratio (max `hp×(1+arm/8)` ≥ 3× band min): caves 105/10 ✓, fungal 165/10 ✓,
  ruins 175/22 (drudge is the new min) ✓, forge 356/12 (cinder new min) ✓,
  abyss 262/14 (voidmote new min) ✓.
- ≥1 shooter per band: unchanged everywhere; abyss gains a second (gazer) ✓.
- ≥3 distinct roles per band: strictly increases everywhere ✓.
- ≥2 bands with a support unit: rises to four (fungal, ruins, forge, abyss) ✓.
- Single-hit clamp: worst new spike is gazer's shot, 26 × depthDmg(2800m)≈2.63 ≈ 68 vs a
  band-reference ~230 max HP ≈ 0.30× — under the 0.40–0.45× law. TTD is measured on the
  `dmg` field and gazer's is 14; the shot buys its damage with a 0.65s tell + 560px of air.

---

## 3. SPRITE SPECS (not grids — the contract for whoever draws them)

Shared: 2 frames, same rectangle, top two rows identical across frames, facing RIGHT, light
top-left, `o` outline ring, `.` (never space) in the top rows, accents ≤ 4 cells, `B` avoided
entirely (gazer's "brightening" tell comes from the engine's windup strobe, not baked pixels).
Ramp legality read off ref-art §6's matrix; **dirt is used nowhere** (marginal in caves, banned
in ruins). No ramp approaches hero (all step-0 ≤ 0.475). `c` fields in §1.1 sit near each
ramp's step 1–2 so death-bursts match the art.

Top-2-row strings below are AUTHORITATIVE — they were collision-checked character-for-character
(after `#`-collapse) against every biome inventory in ref-art §6 *and against each other*.
Draw the body under them freely; do not change them without re-checking Law 3.

| id | rig / family | grid (box) | ramp | contacts | top rows (f[0] rows 0–1) |
|---|---|---|---|---|---|
| blackdamp | floater sac (domed, floats) | 14×13 (14×12) | rot | 1 tendril, 1 blank bottom row | `..oo..........` / `.o####o.......` |
| mender | floater, hooded (wilted cap, drooping left) | 13×15 (13×14) | fungal | 1 robe point, 2 blank rows | `....ooo......` / `...o###oo....` |
| hypha | root-worm, blunt wedge head at right | 15×13 (15×13) | rot | 2 body coils, no gap | `.......ooo.....` / `.....oo###oo...` |
| drudge | construct: small flat slab, stops 2 short of right edge | 10×11 (10×11) | stone | 2 blocks | `oooooooo..` / `o######o..` |
| lurcher | beast: pricked ear pair forward-right, low long body, 4 legs | 15×12 (15×12) | bone | 2 leg pairs | `......oo..oo...` / `.....o######o..` |
| pavise | construct: full-height tower shield flush to right edge | 16×18 (16×18) | stone | 3 (two feet + shield base) | `..........oooooo` / `..........o####o` |
| cinder | rising spark, single taper (floats) | 9×10 (9×9) | forge | 1 point, 2 blank rows | `....o....` / `...o#o...` |
| clinker | slag hulk, flat crust slab forward-right, E-accent cracks | 19×19 (19×19) | forge | 2 | `..........oooooooo.` / `.........o########o` |
| seep | low weeping mound, broad low arc left-of-centre | 16×14 (16×14) | void | 2 | `..oooooooooo....` / `.o##########o...` |
| voidmote | small dome floater, S-accent core | 10×10 (10×9) | void | 1 point, 2 blank rows | `...oooo...` / `..o####o..` |
| cleft | double dome with a full-height centre crack | 20×20 (20×20) | void | 2 wide stance | `.ooooooo..ooooooo...` / `o######o..o######o..` |
| gazer | hollow arch (open ring top), hanging optic tendril, floats | 14×15 (14×16) | bone | 1, 2 blank rows | `....oooooo....` / `...oo....oo...` |

Must-differ sets (the inventory each entry was checked against, per its ONE biome):

- **caves** (blackdamp): crawler `..o..oooo..o..`, bat 16w, rockling `..o..o..o..o..`,
  delvemite 9w, burrower 15w, spitter `..........oo..` (right-offset dome — blackdamp's sac
  shoulder is left-offset and 6-wide; strings distinct, and in situ the float-gap + tendril
  separate it from the walking spitter).
- **fungal** (mender, hypha): spitter, sporeling `...o.oooo.o...`, stalker 12w, bat 16w,
  bloomback 19w triple-dome, delvemite 9w — and each other (13w hood vs 15w wedge).
- **ruins** (drudge, lurcher, pavise): brute 21w full slab, archer 13w, shieldman 18w full
  slab, chanter 13w hood+staff, warder 14w twin posts, mortar 14w right dome, burrower 15w
  centred dome — and each other. Lurcher shares burrower's 15-width; row 0 differs
  (`......oo..oo...` vs `.....ooooo.....`) and the ear-gap is a beast mark no ruins sprite has.
- **forge** (cinder, clinker): ember `....oooo.....`, smith 24w full slab, spitter, mortar,
  warder, burrower. Nothing 9w or 19w exists in forge.
- **abyss** (seep, voidmote, cleft, gazer): wraith 14w centre spike, voidspawn 14w spiky dome,
  stalker 12w, hollowed 13w triple spike, chanter 13w — and each other. Gazer shares wraith's
  and voidspawn's 14-width; its hollow row-1 interior (`oo....oo`) matches nothing.

Family-law notes: lurcher is the only beast top in ruins; drudge/pavise/clinker read construct
(flat overhang + ground blocks); cinder borrows the wraith taper legally (no wraith in forge);
blackdamp/voidmote are domed floaters (bat precedent). Bosses and split-children stay
roster-free and skip Laws 2–3 (voidling stays unrostered).

---

## 4. LORE.enemy — paste block (voice: field notes, the mistake that kills you, one dry joke)

```js
  blackdamp:{n:'Blackdamp',d:`The miners' word survives because the thing does. It drifts at
head height, follows spent air, and opens into a cold that takes the strength out of your legs.

Open it from further away than you think you need. This advice is repeated because it has
never once been taken.`},
  mender:{n:'Mender',d:`A drift of cap and thread that settles over the wounded and knits. The
Bloom does not lose soldiers while one of these floats behind them, and it will not fight you
while it has better work.

The lesson of the ruins is taught early here, at a discount.`},
  hypha:{n:'Hypha',d:`A root of the Bloom that has learned to travel. It comes through rock —
slowly, audibly — and the tunnel it leaves is lined with what it is made of.

Do not retreat down its own hole. That is the shape of most hypha deaths: a delver, a dead
end, and a corridor that was never safe in either direction.`},
  drudge:{n:'Drudge',d:`Maintenance units, still maintaining. Small, plated, uninterested in
you specifically — they sweep toward whatever is broken, and down here you are the thing that
is breaking things.

Individually they barely rate a swing. The problem is what they are between you and.`},
  lurcher:{n:'Lurcher',d:`The patrols kept dogs. The dogs kept going.

They hunt in braces and pounce past you, one from each side, so the dodge that saves you from
the first is the setup for the second. Count to two before you commit.`},
  pavise:{n:'Pavise',d:`A shield that grew a soldier, or the reverse; the records are not
clear. It advances behind its own wall and fires through a slit, and the wall only comes down
for the length of the shot.

That length is the fight. Flank it, or be somewhere else when the slit opens.`},
  cinder:{n:'Cinder',d:`Sparks off the forge that did not go out. They rise to meet anything
that flies, and they arrive in threes.

The air down here belongs to them, which is an inconvenience for delvers who have made the
air their answer to everything else.`},
  clinker:{n:'Clinker',d:`What is left when slag cools around something that objects. The
crust faces you; the soft part faces away.

It dies the way a furnace door fails — all at once, outward. Put it down, then put distance.`},
  seep:{n:'Seep',d:`The dark leaks. Where it walks it leaves a wet cold that stays, and the
cold slows you by exactly the margin the next thing needed.

Kill it somewhere you were not planning to stand.`},
  voidmote:{n:'Voidmote',d:`Specks of the dark that move against the air. One is a smudge on
your lamp. Three are a current, and the current has an opinion about where you are going.`},
  cleft:{n:'Cleft',d:`Already coming apart when you meet it, held in one shape by something
like intent. Broken, it is two of the splitting kind, and each of those is two more.

The arithmetic is the ambush. Start it in an open room, or do not start it.`},
  gazer:{n:'Gazer',d:`A pale disc at the edge of lamp-light, patient. The bolt is fast; the
aim is long; the tell is a brightening you will learn to feel on the back of your neck.

It has been watching you for longer than you have been aware of it. That is not a figure
of speech.`},
```

---

## 5. ELITE MODIFIERS (3 new; 8 → 11, target 10–12)

All three obey the delay-before-lethality law (ref-research §2): each adds threat on a fuse
with a readable footprint; none shortens a tell, blocks movement, reflects damage, or drains
invisibly.

```js
 // ---- third wave: elites that change WHERE you fight, or what a fight costs ----
 // Quaking: every completed strike leaves its own aftershock where the lunge ended. The swing
 // was the tell; the floor answers late, and it answers exactly where the marker was.
 {id:'quaking',n:'Quaking',  c:'#c98a4a', hp:1.7, dmg:1.15,spd:0.9, tremor:{r:38,t:.45,dmg:.55}},
 // Searing: the first elite that makes a shooter feared for where it shoots. Impact leaves a
 // burning patch — the fuse is the flight time, the footprint is painted by the hit itself.
 {id:'searing',n:'Searing',  c:'#ff9a5a', hp:1.6, dmg:1.0, spd:1.0,  sear:{r:20,t:1.4,dmg:.25}},
 // Tithing: it does not hurt you more, it charges you. Hits knock shards OUT of you — they
 // scatter as pickups, recoverable — and the corpse refunds with interest. A risk you can price.
 {id:'tithing',n:'Tithing',  c:'#d8c96a', hp:1.8, dmg:1.05,spd:1.05, tithe:1, loot:2.2},
```

Fairness bars — `eliteFor` gains two lines (template: the existing trail/trail rule):

```js
  if(m.sear&&!E.shoot)return false;               // a patch needs a shot to arrive on
  if(m.tremor&&E.trail)return false;              // two hazard sources is one hazard and a frame cost
```

Consumption (one site per field, keyed off the field, never the id):

- `tremor` — in the act branch's end-of-swing closure (the `e.slammed` neighbourhood, ~3135):
  `if(e.elite&&e.elite.tremor){const T=e.elite.tremor;addHaz(e.x,e.y+e.h/2,T.r,T.t,e.dmg*T.dmg,null,'#c98a4a','shock')}` —
  one `friendly:0` shock patch per completed swing, jumpable, rides the depth curve via
  `e.dmg`, capped by `HAZ_MAX` like everything else (rule 19).
- `sear` — at enemy-shot spawn: when `e.elite&&e.elite.sear`, stamp the proj
  `p.sear={r,t}` and `p.searDmg=shotDmg*S.dmg` (shot dmg is already depth-scaled at fire
  time, so the patch inherits the curve). At enemy-proj termination (player hit or terrain):
  `if(p.sear)addHaz(p.x,p.y,p.sear.r,p.sear.t,p.searDmg,null,'#ff9a5a','fire')`. No status —
  the patch is the point, not a burn stack.
- `tithe` — beside `drain`/`hex` at 3130/3175 and the contact path: on a landed hit,
  `k=min(8,2+floor(runShards*0.04))` shards leave the player as scattered shard PICKUPS at the
  impact point (standard pickup lifetime — they can expire if you flee), `e.tithed=(e.tithed||0)+k`;
  `killEnemy` drops `e.tithed` back on top of the `loot:2.2` payout. Steals nothing the player
  has not banked-in-run; never touches `META.shards`.

Delay audit: quaking's hazard lands after a floor-clamped 0.26s+ tell plus the whole active
window, in the marker's own footprint; searing's patch arrives at the end of a ≥0.26s shot
tell plus flight time, radius 20, fade handled by the standard HAZ draw; tithing has no
lethality at all — it prices the fight instead.

---

## 6. SPLIT FIELD-IFICATION (assignment item 5 — cleft requires it)

The child type is hard-coded at ~2789 (`mkEnemy('voidling',…)`). Table change:

```js
 voidspawn:{…,split:{into:'voidling',n:2}, …},   // migrated from split:2
 cleft:    {…,split:{into:'voidspawn',n:2}, …},  // new
```

`killEnemy` ~2787 becomes:

```js
 if(D.split&&!e.isSplit){const S=D.split;
  for(let i=0;i<S.n;i++)
   queueEnemy(Object.assign(mkEnemy(S.into,e.x+rr(-14,14),e.y-6,null,threat(),null),
    {vx:rr(-90,90),vy:-140,dir:i?1:-1,isSplit:S.into===e.type?1:0}))}
```

- `isSplit` marks children only on a SELF-split (`into===e.type`), which is what the guard was
  for; a cross-species chain is bounded by acyclicity instead. Voidspawn's children (voidlings)
  now carry `isSplit:0` — behaviourally identical, voidlings have no `split`.
- Cascade: cleft → 2 voidspawn → (each killed) → 2 voidlings = ≤7 bodies, sequential, every
  one through `mkEnemy`/`queueEnemy` (cap-respecting). No legacy number shim — one file, one
  commit, migrate the voidspawn row in the same edit.
- Suite-11 gains a table-shape law: walk `split.into` chains across ENEMIES; every chain must
  terminate within 4 hops and never revisit a species (§8.4).

---

## 7. ENCOUNTER NOTES — costs and composition

Derived costs of the twelve (enemyCost formula, for the record): blackdamp 1.6, mender 3.3
(the `heal` field triggers the +1.6 support surcharge automatically — no override needed),
hypha 2.6, drudge 2.5, lurcher 2.4, pavise 5.3, cinder 1.7, clinker 5.3, seep 2.7,
voidmote 1.8, cleft 4.7 derived, gazer 3.2.

Overrides (the only two, both because the formula cannot see bodies-after-death):

- **cleft `cost:8`** (in the row, §1.1) — the derived 4.7 prices one body; the kill releases
  ~5.4 cost of voidspawn+voidlings. 8 makes it a centerpiece draw in the abyss budget
  (~11.7/chunk at 2800m) rather than a twin-spawn.
- **voidspawn `cost:4`** — add to the existing row. Derived 2.7 has always underpriced the
  halves; with cleft in the band the abyss would otherwise trend splitter-soup. (Suite-11's
  only cost assertion is `delvemite < brute`; unaffected.)

Not overridden, deliberately: trail value rides free on hypha/seep exactly as it does on
bloomback today (precedent), and pavise/clinker's derived 5.3 already prices them as
centerpieces. Support-unit composition (≤1 per group) and pack-leader-only elites are engine
law and cover mender/lurcher/cinder/voidmote with zero wiring.

Threat-budget effect: rosters grow but budgets do not, so density is unchanged; variety per
chunk rises via the `1/(1+used×1.8)` repeat damping. Ruins at 10 species slightly dilutes
chanter/warder frequency per encounter — acceptable (they are also the band's two highest
surcharges), but note it for the next balance pass.

---

## 8. TEST-SUITE EDITS (every one this content requires)

Suite-8 and suite-10 need **no source edits** — both iterate the live tables. Suite-8 will
fail until the 12 `SPR` + 12 `LORE.enemy` entries land in the same commit as the rows; suite-10
holds because §2 preserves every band's toughest/deadliest (rerun and eyeball the printout).

Suite-11 edits:

1. **Integrity soak** — add the 12 ids to the "one of every new unit, 45s at Threat V" list
   (no NaN, EN ≤ 120, PROJ ≤ 220, HAZ ≤ HAZ_MAX).
2. **Mender** (copy the chanter block): heals the most-wounded OTHER enemy; never itself;
   stops on death; at 700m vs a bloomback target, rate > 0 and < 90 hp/s; restores > 15% of a
   mid-size target's maxhp within 3s.
3. **Hypha** (copy the burrower block): closes distance through solid rock, solid-tile count
   drops, bedrock survives; PLUS (copy the bloomback spent-trail block, for hypha AND seep):
   a spent trailer lays nothing and resumes after recovery; 12 extra seconds stays ≤ HAZ_MAX.
4. **Split rework**: voidspawn assertions updated to the `{into,n}` shape; cleft kill yields
   exactly 2 live voidspawn with `isSplit:0` which each split normally (total ≤ 7 bodies,
   all through queueEnemy, cap respected); NEW table law: every `split.into` chain terminates
   ≤ 4 hops, no cycles.
5. **Elites**: modifier count assertion ≥ 8 → ≥ 11; the 300-roll fairness brute-force picks up
   the two new bars automatically once they are in `eliteFor` — add the explicit negatives
   (searing never rolls on a shoot-less species; quaking never on a trail species) and the
   behaviours: a quaking elite's completed swing leaves exactly one `friendly:0` `'shock'`
   hazard that expires; a searing elite's shot impact leaves one patch that damages only
   inside and expires; a tithing hit scatters recoverable shard pickups and its death refunds
   ≥ what it stole.
6. **Pavise / front law**: damage ×0.25 from the faced side while idle; FULL damage while
   `wind > 0` (existing rule) AND while `swind > 0` (the §0.4 refinement); shieldman's
   behaviour unchanged (no shoot block — assert the ×0.25 still holds mid-`swind`-free).
7. **Packs**: the "at most one non-`pk` member" assertion is delvemite-specific — generalize
   it to iterate every `pack` species (delvemite, drudge, lurcher, cinder, voidmote), and
   assert lurcher arrives ≥ 2 in one chunk out of the real generator (copy the delvemite
   arrival test).
8. **Role recount**: nothing to edit — coverage/bulk/shooter assertions are dynamic and §2
   shows they pass; rerun is the proof.

Then `./design/audit.sh` (CURRENT-STATE is generated), `./test/run.sh` full, and
`node test/shots.js` for the twelve new silhouettes in situ — the only way to judge feel.

---

## 9. REGISTRATION CHECKLIST (per ref-enemies §9 — nothing here is optional)

Per enemy: ENEMIES row (§1.1) → BIOMES roster (§1.2) → SPR entry built from §3's contract →
LORE.enemy (§4). Elites: ELITES rows + eliteFor bars + three consumption sites (§5). Split:
§6's one edit + row migrations. Costs: voidspawn override (§7). Code total beyond tables:
four small sites, each keyed off a field. Bestiary, drops, XP, discovery, threat costing and
elite rolls pick everything up from the tables with zero further wiring.
