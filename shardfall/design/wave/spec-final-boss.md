# SPEC — THE FINAL BOSS AT THE MASTER GLYPH: **THE WEFT**

Refs obeyed: ref-enemies (mkEnemy/mkAtk, pattern machinery, caps), ref-world (escape flow, boss
strand rock exemption), ref-art (SPR laws), ref-systems (HAZ, feel calibration), ref-research
(boss TTK 60–90s, phase-adds-a-pattern, delay-before-lethality). All numbers checked against
the caps in those docs. New ids proposed here: `weft`, `press`, `seal`, `seam`, `witness`,
`f14`, `mended`, `usurped`, ENEMIES field `end`, META field `endings`. Verified against the
live id namespace at commit 3c446e9 — no collisions (`mender` was rejected for its near-miss
with the `mend` ability gem; `weight` rejected for colliding with the THREATS effect key).

---

## 0. The fantasy, in one paragraph

The world has been repairing itself around you all game: dissonance churn re-forms chunks, the
Weight punishes standing still, the walls forget your digging. That was never the world. That
was **the Weft** — the shuttle of the Lattice, still running the loom nine hundred years after
the loom stopped being a sky. It lives at the master glyph, at the floor of the shaft, straight
below the camp. Waking it is the last thing the game asks; killing it is the only way to hold
the pen.

---

## 1. THE CREATURE — `weft`

### 1.1 ENEMIES row (paste-ready, boss block after `voidmaw`)

```js
 // THE WEFT — the thing that has been mending the world around you. Fought at the master
 // glyph only; never rostered, never arena-stamped by BIOME_BOSS. `end:1` = killing it opens
 // the ending choice (consumed once in killEnemy, keyed off the field, never the id).
 weft:{hp:2000,dmg:34,spd:52,w:38,h:36,ai:'fly',c:'#3fc9c1',shards:220,boss:1,arm:12,phase:1,end:1,
   atk:{cd:2.2,range:44,wind:.52,act:.20,rec:.40,kb:340,lunge:300},
   shoot:{cd:2.2,dmg:15,speed:320,count:3,spread:.26,col:'#3fc9c1',range:500,wind:.42,st:{shock:1.25}},
   ph:[{at:.70,pat:'press'},{at:.45,pat:'seal'},{at:.20,pat:'summon'}]},
```

Clamp audit (every number against the ref caps):
- **Reach** `44 + 300×0.20 = 104 ≤ 105` (boss cap; deliberately 1px under, never AT the cap).
- **Melee wind .52** — the biggest tell in the game (voidmaw .36, forgelord .46); highest
  damage pairs with slowest windup per ref-research. `rec .40` = the biggest boss punish window.
- **shoot.wind .42 ≥ 0.26** in fact (nothing clamps shoot — kept well above the floor).
- **dmg 34** at 3110 m ×depthDmg(≈2.78) ≈ 95/hit ≈ 0.36× a band-5 reference maxhp (265) —
  under the 0.55× telegraphed-boss-heavy clamp. Heaviest single hit is `press` at 1.1× = 104
  ≈ 0.39× (0.52× on a thin 200 hp build — inside clamp, asserted, see §8).
- **hp 2000** × depthHP(3110 m ≈ 6.14) ≈ **12,300 live** (Threat adds no hp; Echo multiplies).
  At a viable build (~1.5× the suite-10 band-5 reference) ≈ 140–200 effective DPS → 60–90 s.
  Reference build ≈ 90–140 s. Asserted as a hits band, see §8 — tune `hp`, nothing else.
- **`phase:1` + `ai:'fly'`** — the wraith movement branch: it passes through rock. The mender
  is not stopped by what it mends; it swims in what `seal` puts back. Risk-flagged (§10): if
  playtests show it loitering inside walls, delete the one field.
- **`ph` has 3 entries** (existing bosses have 2) → 4 phases, each ADDS a pattern via the
  accumulating `e.pats` machinery unchanged: base kit → +press (.70) → +seal (.45) →
  +summon (.20). Descending `at` order as required. Phase transitions ride the shipped
  machinery: 0.9 s roar invuln, shoot cd ×0.75 compounding, `patT[pat]=0.8` first-tick.
- Loot/threat/sigil/XP: all automatic from `boss:1` (guaranteed 2 gems + rare+ gear at
  ilvl 3110 + 1 sigil; `META.bosses.weft=1`; threat ceiling +1 — capped, harmless; XP ×6).

### 1.2 The one new ENEMIES field: `end`

`end:1` — consumed at exactly one site, the boss branch of `killEnemy` (after the
`META.bosses` bookkeeping, ~line 2805): `if(D.end)glyphFelled();`. See §5.4. Table field, not
an id branch (rule 4).

---

## 2. THE TWO NEW PATTERNS — `press` and `seal`

Nothing else uses them (suite-10 asserts membership; neither is referenced by any other `ph`).
Both are pure area-denial through `addHaz` (rule 19), both carry a ≥1.1 s fuse with a painted
footprint (delay-before-lethality law), both measure **`P`**, never the aggro args (Decoy rule).

### 2.1 `PAT_NAME` additions (line ~2962)

```js
 press:'THE WEIGHT COMES DOWN', seal:'IT PUTS THE ROCK BACK'
```

### 2.2 `press` — the Weight, embodied

The mechanic the game has taught since minute one — standing still draws attention — with the
teacher finally in the room.

**bossPattern branch** (transition burst — cosmetic, beam/devour precedent; the machinery's
`patT[pat]=0.8` makes the first real tick arrive fast):

```js
 else if(pat==='press'){addShake(9);burst(P.x,P.y,'#3fc9c1',14);sfx('deny')}
```

**bossOngoing branch** (own timer via the shipped `tick()` closure):

```js
  else if(pat==='press'){
   if((e.prT||0)>0){e.prT-=dt;
    if(e.prT<=0){ // the press lands where you WERE. Moving is the whole counterplay.
     addHaz(e.prX,e.prY,54,0.9,e.dmg*1.1,{chill:0.6},'#3fc9c1',0,'shock');
     burst(e.prX,e.prY,'#3fc9c1',18);addShake(11);sfx('kill')}}
   else if(tick('press',5.8)){e.prT=1.2;e.prX=P.x;e.prY=P.y;
    addHaz(e.prX,e.prY,48,1.2,0,null,'#3fc9c1',0,'mark');sfx('deny')}}
```

Contract notes: lock samples `P.x/P.y` directly (never dx/dy — Decoy bug). The `'mark'` is the
mortar-marker contract exactly: dmg 0, radius = strike r ×0.9, lifetime = the 1.2 s fuse, so
marker countdown and impact agree. One mark + one shock per 5.8 s — HAZ budget trivial.
`prT` ticks only inside `bossOngoing`, which runs only while the boss is alive, not spent, not
winding — **a corpse's pending press never lands**; the orphaned dmg-0 mark expires harmlessly
(mortar precedent, tested). Fuse 1.2 s ≥ the 0.6 s fade-in floor.

### 2.3 `seal` — the repair, weaponized

The dissonance churn, aimed. It marks pockets of air near you, then puts the rock back.

**bossPattern branch** (transition burst — restores the arena shell, undoing any digging):

```js
 else if(pat==='seal'){sealShell();addShake(12);flash(0.3);sfx('dig')}
```

**bossOngoing branch:**

```js
  else if(pat==='seal'){
   if(e.sq)for(let i=e.sq.length-1;i>=0;i--){const s=e.sq[i];s.t-=dt;
    if(s.t<=0){sealFill(s.tx,s.ty,e);
     addHaz(s.tx*TILE+24,s.ty*TILE+24,30,0.4,e.dmg*0.5,null,'#3fc9c1',0,'shock');
     e.sq.splice(i,1)}}
   if(tick('seal',7.0)){e.sq=e.sq||[];
    for(let k=0;k<2;k++){const t2=sealPick(e);if(!t2)continue;   // 3x3 air pocket near P
     e.sq.push({tx:t2[0],ty:t2[1],t:1.1});
     addHaz(t2[0]*TILE+24,t2[1]*TILE+24,26,1.1,0,null,'#3fc9c1',0,'mark')}}}
```

**Helpers** (combat code, beside `bossSlam`):
- `sealPick(e)` — up to 10 tries with the sim RNG (`rr`/`ri` — runtime combat, not generation;
  bossSummon precedent): a 3×3 tile block whose center is 40–90 px from `P`, fully inside the
  arena interior, ≥2 tiles from the glyph slab, mostly air, not overlapping `P`'s or the boss's
  hitbox. Returns `[tx,ty]` of the top-left tile or null.
- `sealFill(tx,ty,e)` — for each of the 9 tiles: if air AND not overlapping `P`'s hitbox AND
  not overlapping the boss: `setTile(x,y,7)` (abyss stone, hard 2 — a digger re-opens it, a
  non-digger routes around it). **Placement, not digging** — `setTile` is the sanctioned
  placement path (anchor-pocket precedent); `carve` remains the only removal path (rule 3).
  The player-overlap skip is load-bearing: the fill may never entomb; the 0.4 s shock burst is
  what punishes standing in the pocket, not the rock itself. Asserted, §8.
- `sealShell()` — re-stamps the arena wall ring and floor (from the §3 rect, tile 7) wherever
  it has become air, skipping player/boss-overlapping tiles. Fires only on the phase
  transition: once per fight the arena heals.

Budget: ≤2 marks + ≤2 shocks per 7 s + press's pair ≈ ≤8 concurrent HAZ from the boss — far
under `HAZ_MAX=64` (asserted over 60 s, §8). `e.sq` timers live in `bossOngoing` → frozen at
death; pending marks expire with **zero terrain change** (asserted).

Why these two and not more: press punishes standing still, seal punishes orbiting — together
with the .52/.20/.40 melee they force the three-beat read (bait tell → punish `rec`) while the
floor itself is being edited. Phase 4 adds `summon` (abyss roster via the shipped
`bossSummon`, `spawnedBy:'weft'`, ≤4 cap) so the last fifth splits your attention rather than
inflating a number, per ref-research.

### 2.4 suite-10 impl-list edit

`test/suite-10.js` line ~290: `const impl=['slam','volley','spores','firewall','summon','beam','devour','press','seal'];`
The "every named pattern has a PAT_NAME" assert then covers both for free.

---

## 3. THE ARENA — the master glyph, at the floor of the shaft

### 3.1 Site

```js
const MG={tx:CAMP_X,ty:3170};   // straight below the camp. depth = 3110 m
```

Fixed, not hashed: the master glyph is the SEED — its address does not reroll. "Look down the
shaft at night and you can see the glow" (LORE.biome.surface) — the glow was always this.

### 3.2 Geometry (stamped in `genChunk`, boss-strand charter)

Rect: tx **778–821** (44), ty **3148–3171** (24). Intersects chunks (16,65) (17,65) (16,66)
(17,66). Per intersecting chunk, stamped AFTER the cave carve (rooms precedent), each chunk
writing only its slice:

- Wall ring 2 tiles thick: tile **7** (abyss stone, hard 2 — diggable with deep tools; the
  Weft's `seal` transition re-heals it once).
- Interior: air (ty 3150–3168).
- Floor: ty 3169–3171, tile 7.
- **Glyph slab**: tx 794–805, ty 3168, tile **3** (bedrock — nothing carves it; Quake/Bore
  cannot delete the ending). The player stands on it at ty 3167.
- **Entrance**: top wall opening tx 797–802 left as air — you drop in from the shaft. Sealed
  at wake (§5.3).
- **Two pillars** (press/beam cover): 2×5 of tile 7 rising from the floor at
  `tx = 800±(8+Math.floor(hashS('boss',MG.tx,MG.ty)*5))` — **positional boss-strand hash, not
  `rS`**, so the two chunks agree and no boss-strand stream draws are inserted (draw order
  preserved; suite-9/-14 fingerprints undisturbed).
- Guards in the same chunks: **skip the miniboss (voidmaw) arena stamp** and skip
  chest/shrine/vault/cache/vent stamps when the chunk intersects the MG rect — the room is
  bare, the reward is the ending. No spawn records are pushed (the boss is not a world spawn;
  the glyph is not a POI object — proximity is checked against `MG` directly, §5.2).

Legality: rock shaped outside the `terrain` strand is legal HERE and only here — suite-14
deliberately exempts the **boss** strand from the rock-ownership fingerprint, and the strand's
charter is "the arenas, and what stands in them" (ref-world §7). Deterministic stamping means
dissonance churn regenerating these chunks rebuilds the arena bit-identically (and heals
player digging outside the live 5×5 — thematically free).

Suite-14 exposure: cy 65–66 sit outside the sealed-chunk sweep (cy 12–60) and outside the
strand-ownership sample (cy 22–26); the arena is ~78% air so the abyss air target (0.62 ±0.13)
is safe even if a measurement window clips it.

### 3.3 Presentation

Render (RRNG only): the six glyphs of `seedGlyph(SEED)` drawn in `ACC.shard` above the slab,
faint pulse. Full map (`openMap`): once `canEscape()` first turns true in a run, mark the site
gold and fire the one-time hint
`hint('wayout','The world is thin. The master glyph waits at the floor of the shaft, straight below the camp.')`.

---

## 4. WHERE IT SITS IN THE OLD FLOW

Shipped flow: `canEscape()` → pause → `openLattice()` → THE WAY OUT button → `openEscape()`
(modal confirm) → `doEscape()` (unconditional ending).

New flow: `canEscape()` **unchanged** (DISSONANCE≥100 ∧ ≥3 distinct `META.bosses`) → it now
gates the WAKE, not the ending → `openLattice()`'s THE WAY OUT row becomes a **pointer**, not a
trigger → walk to the slab → `openGlyphSeat()` → WAKE → fight → kill → `openEnding()` (the
panel `openEscape` used to be) → `doEnding(kind)` (the fork `doEscape` used to be) → epilogue →
DESCEND AGAIN. Every old function keeps a live role; suite-9's direct `doEscape()` call keeps
working with a one-line test edit (§8).

---

## 5. THE GATE REWIRING — exact hooks

### 5.1 Run state

```js
let MGS=0;   // 0 dormant · 1 woken · 2 felled — run-scoped, reset in newRun()
```

Reset beside `SENTRY.length=0` in `newRun()` (~3509). Never persisted — a new run always
starts with the Weft at its work.

### 5.2 `openLattice()` edit (line 3725)

Replace the THE WAY OUT button with a pointer row (non-modal, informational):

```js
 if(canEscape())h+=`<div class="sub" style="color:var(--gold)">THE WAY OUT — the glyph is at the floor of the shaft, ${Math.max(0,3110-runDepth)}m further down. What keeps it will not step aside.</div>`;
```

The `else if(DISSONANCE>=100)` warden line at 3726 stays verbatim.

### 5.3 The seat — `openGlyphSeat()` + `wakeWeft()`

Proximity in `sim()`/`upPlayer` beside the shrine check (~4871): player within 56 px of the
slab center, no live weft, not paused → open once (re-arm after leaving a 120 px radius,
shrine-style guard). Panel (non-modal builder, `openPanel(h,false,openGlyphSeat)`), all
`<button>`s, prompts through `pr()`:

- Header: master glyph `seedGlyph(SEED)` large, dissonance bar.
- `MGS===2`: one button `THE GLYPH IS BARE <sub>choose what it says</sub>` → `openEnding()`
  (re-entry path — dismissing the ending choice can never soft-lock it away).
- else if `canEscape()` and no live weft: button
  `WAKE IT <sub>write the first stroke</sub>` → `wakeWeft()`.
- else the refusal lines: `DISSONANCE<100` → *"The world is not thin enough to write on. It
  heals faster than you can mark it."* ; bosses<3 → the line 3726 warden text.
- `CLOSE`.

```js
function wakeWeft(){
 closePanel(true);
 for(let x=797;x<=802;x++)for(let y=3148;y<=3149;y++)setTile(x,y,7);  // the door was never a door
 queueEnemy(mkEnemy('weft',MG.tx*TILE,(MG.ty-14)*TILE,null,threat(),null));
 MGS=1;addShake(10);flash(0.5);sfx('bosskill');toast('IT PUTS DOWN ITS WORK')}
```

Contracts kept: spawn through `mkEnemy` (depth/Threat/Echo multipliers, `invT`, mkAtk floor —
never hand-rolled) via `queueEnemy` (cap-safe; bosses may push EN to 124 and evict a far
sleeper). Entrance fill skips any player-overlapping tile (standing in the doorway at wake must
shove, never entomb — same skip as `sealFill`). Re-wake safety: if the boss despawns (a
mid-fight `spawn`/`boss` strand reweave despawns live enemies >420 px), the seat re-offers WAKE
because the button condition is "no live weft ∧ MGS<2" — waking is repeatable, only the kill is
terminal.

### 5.4 The kill — `glyphFelled()`

Hooked in `killEnemy`'s boss branch off the table field (§1.2):

```js
function glyphFelled(){MGS=2;toastQ('THE LOOM IS STILL');
 openEnding()}   // modal; queues behind a same-frame level-up via PANEL_Q, as shipped
```

Phase-persistence rules honored by construction: `bossPhase` already refuses on a corpse
(`hurtEnemy` calls it only while `e.hp>0` — the tested regression); the killing blow can
therefore never unlock `summon` and flood the ending screen with adds; `bossOngoing` stops at
death so pending press/seal actions die with the body (asserted, §8). If the player dies to a
simultaneous hit, `die()` outranks everything (PANEL_Q cleared, `openPanel` refuses) — MGS is
run-scoped, the run ends, wake it again next run. No soft-lock in either direction.

### 5.5 The choice — `openEnding()` (replaces `openEscape`'s role)

Modal (`openPanel(h,true,null)`). Gate: `if(MGS<2)return;`. Header lore:

> The glyph is bare. The thing that kept it is not coming back, and the rock is waiting to be
> told what it is.
>
> Six symbols. Choose what they say.

Buttons (each gate re-checked inside `doEnding` — never trust a button):

```js
 <button onclick="doEnding('escape')">ESCAPE <span class="sub">write a way out, and leave it growing</span></button>
 <button ${mendOK?'':'disabled'} onclick="doEnding('mend')">MEND <span class="sub">${mendOK?'reweave the sky':'the five knots still hold — '+knotCount+'/5 felled'}</span></button>
 <button ${usurpOK?'':'disabled'} onclick="doEnding('usurp')">USURP <span class="sub">${usurpOK?'become the law':'descend at Echo VI or deeper to claim it'}</span></button>
 <button onclick="closePanel(true)">NOT YET <span class="sub">${pr('cancel')}</span></button>
```

NOT YET returns to the run; the seat re-offers the choice (§5.3) — dismissal is safe.

### 5.6 The fork — `doEnding(kind)` + compat alias

```js
function doEnding(kind){
 if(MGS<2)return;
 if(kind==='mend'&&!Object.values(BIOME_BOSS).every(b=>META.bosses&&META.bosses[b]))return;
 if(kind==='usurp'&&(META.echoLv|0)<6)return;
 META.escapes=(META.escapes||0)+1;
 META.maxEcho=Math.max(META.maxEcho||0,META.escapes||0);
 META.shards+=Math.round(400+DISSONANCE*6);
 META.maxThreat=Math.min(THREATS.length-1,(META.maxThreat||0)+1);
 META.endings=META.endings||{};META.endings[kind]=1;
 discover('frag',kind==='mend'?'mended':kind==='usurp'?'usurped':'escape',true);
 saveMeta();
 flash(0.9);addShake(20);sfx('level');rumble(1,1,900);
 /* per-kind epilogue panel: title + fragment text via loreHTML + the shipped stats table
    + single button DESCEND AGAIN → newRun(). Titles:
    escape 'THE WORLD RE-FORMS' (shipped) · mend 'THE SKY REMEMBERS' · usurp 'THE ROCK AGREES' */}
function doEscape(){doEnding('escape')}   // kept: suite-9 and any stale caller
```

All three endings feed the same Echo ladder (`escapes`→`maxEcho`) — USURP is the ladder's
fiction, MEND and ESCAPE still climb it; equal payout, no ending is the farm ending. The only
new META field is `endings` → **`SAVE_VER` 2→3**: append
`if(m.ver<3){m.endings=m.endings||{};m.ver=3}` to `migrate()` (old blocks kept), belt-and-braces
`if(!META.endings)META.endings={}` in `loadMeta()`. Old-save audit: no mid-run state persists;
`canEscape` unchanged; a migrated save loses nothing and gains the walk to the bottom.

### 5.7 Camp acknowledgment (brief: progress FELT at the surface)

`openCamp()` header gains one line, first match wins:

```js
 META.endings&&META.endings.usurp?'The camp is quiet around you. Everything here knows who it agrees with now.'
:META.endings&&META.endings.mend ?'There is a colour in the sky over the camp. Nobody talks about it. Everybody looks.'
:META.endings&&META.endings.escape?'The shaft is the wrong depth, and the camp pretends not to measure it.':''
```

---

## 6. ENDING GATES — the exact checks (restated plainly)

| ending | gate | check |
|---|---|---|
| ESCAPE | boss felled this run | `MGS===2` (all endings require it) |
| MEND | all five Knots ever felled | `Object.values(BIOME_BOSS).every(b=>META.bosses[b])` — names the five biome bosses exactly; `weft` (and `witness`, §9) in `META.bosses` can never satisfy it |
| USURP | playing deep Echo NOW | `(META.echoLv|0)>=6` — rung 6 is Brittle, the first rung that cuts YOU; being less and descending anyway is the usurper's résumé. `echoLv` (playing), not `maxEcho` (earned) — you claim the law from inside a world you let be harder. Single tunable constant. |

---

## 7. SPRITE + ART

### 7.1 New ramp (RAMPS, paste-ready)

```js
 seam:  ['#6ec4bc','#4f9da1','#3a747f','#2b525f','#1d3440'],  // shard-teal cooling to depth-blue
```

Validated: strictly darkening (WCAG 0.4643/0.2835/0.1492/0.0737/0.0309), step-0 0.4643 ≤ the
0.5472 Law-1 cap and inside the ≤0.47 house band; hue cools as value drops. The Weft wears the
shard accent as a BODY — it is made of the same stuff the player mines. Bosses sit in no
roster, so Laws 2/3 don't bind it; Law 1 and the ramp-shape assert do, and pass.

### 7.2 `SPR.weft` — the largest sprite in the game (paste-ready, 32×38, 1 frame)

Boss convention: 1 frame; grid narrower than the box (32 on a 38 box — voidmaw is 24 on 34)
and taller (38 rows poke 2px above the 36 box); floater with 7 trailing blank rows (the
visible gap; the contact shadow is drawn by the engine). Light top-left; `B` budget 4 cells;
`S` glyph-ring core; three hanging strand-threads, the long one knotted with `S`. Facing is
symmetric (it has no face; the mirror transform is a no-op visually).

```js
 weft:{r:'seam',f:[[
  '................................',
  '................................',
  '................................',
  '.............oooooo.............',
  '........ooooo222222ooooo........',
  '......oo2222222222333333oo......',
  '....oo22222222223333333333oo....',
  '...o222222222223333333333334o...',
  '..o222222222SSSSSSSS333333444o..',
  '..o22222222SS33BB33SS33344444o..',
  '.o222222223SS33BB33SS344444444o.',
  '..o22222333SS333333SS44444444o..',
  '..o222333333SSSSSSSS444444444o..',
  '...o233333333333344444444444o...',
  '....oo33333333334444444444oo....',
  '......oo3333334444444444oo......',
  '........ooooo444444ooooo........',
  '........4....oooooo....4........',
  '........4.......4......4........',
  '........4.......4......4........',
  '........4.......4......4........',
  '........o.......4......4........',
  '........4.......4......4........',
  '........4.......4......4........',
  '........o.......4......o........',
  '................4......4........',
  '................S......4........',
  '................4......o........',
  '................4...............',
  '................4...............',
  '................o...............',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................']]},
```

Machine-checked: rectangular, legal chars only, 4 `B` cells, last inked row 30 of 37.
The implementer may polish shading; keep the silhouette (horizontal shuttle + three trailing
strands — no existing family reads like it) and the B/S budget.

---

## 8. LORE — bestiary + fragments (paste-ready, voice-matched)

### 8.1 `LORE.enemy` additions

```js
  weft:{n:'The Weft',d:`The shuttle. The thing the strands are pulled through, still running
the loom nine hundred years after the loom stopped being a sky.

Every wall that healed behind you, every chunk that forgot your digging, every time the deep
felt watched — that was not the world. That was maintenance. It does not hate you. You are a
tear, and it closes tears.

It has never once been interrupted at its work. Be the first.`,boss:1},
```

### 8.2 `LORE.frag` additions

Buried — insert AFTER `f13` (depth 3050; array must stay non-decreasing in depth):

```js
  {id:'f14',depth:3100,n:'Scored into the glyph slab',d:`Not words. Tally marks.

Whatever kept the glyph did not read it. It counted against it — checked the world against the
figure, stroke by stroke, and mended every place the two disagreed. You have felt it do this.
You have been one of the places.

The marks stop mid-row.`},
```

Unburied — granted only by `doEnding` (append near `escape`, depth −1; suite-8 requires ≥1
unburied and never serves them from chests):

```js
  {id:'mended',depth:-1,n:'What you mended',d:`You stood on the outside of the thing, which is
the bottom of the world, and you did not write a way out.

You wrote the sky.

Six symbols is not enough to describe a sky, but it turns out it does not need describing. It
needs permission. Every knot you cut on the way down was a hand letting go of a rope, and when
the last one let go the whole weight of heaven remembered where it used to hang.

The camp woke to a colour nobody had a name for, because the last person with the name died
eight hundred years ago.

It is not finished. It may never be finished. But the shaft is closing, slowly, from the
bottom, like a wound that has finally been left alone.

Descend while you still can.`},
  {id:'usurped',depth:-1,n:'What you became',d:`The glyph was never a lock. It was a signature.

You read it, all six symbols, and you understood that the thing below had signed the world the
way a mason signs a foundation stone — once, at the bottom, where nobody argues.

So you wrote your name over it.

The rock agreed. The rock has to. That is what you are now: the thing it agrees with. The
Weight does not come for you anymore, because the Weight reports to you, and somewhere very
far down, something that was patient for nine hundred years has begun, for the first time, to
wait.

The world re-forms harder. You would not have it any other way.

Descend again.`},
```

(The shipped `escape` fragment stays verbatim as the ESCAPE epilogue.)

---

## 9. OPTIONAL SIXTH KNOT — **THE WITNESS** (thin spec; first thing to cut)

Assessment: worth shipping THIN. The scale target wants a sixth boss; an Echo-gated deep boss
is the cheapest true one — **zero new patterns, zero new systems**, one row + one gated arena
stamp + sprite + blurb. It also gives `META.echoLv` a second consumer so the USURP gate isn't
the ladder's only in-fiction tooth. Cut line: if the wave runs long, cut it — nothing above
references it; MEND deliberately does not require it (BIOME_BOSS names the five).

```js
 // THE WITNESS — the sixth knot, not on any map. Appears only in worlds remade often enough
 // to need checking (Echo III+). Reuses shipped patterns only.
 witness:{hp:1500,dmg:28,spd:60,w:26,h:34,ai:'fly',c:'#a89af0',shards:170,boss:1,arm:6,phase:1,
   atk:{cd:2.0,range:40,wind:.46,act:.18,rec:.32,kb:280,lunge:280},
   shoot:{cd:1.6,dmg:15,speed:340,count:2,spread:.18,col:'#a89af0',range:520,wind:.40,st:{shock:1.25}},
   ph:[{at:.66,pat:'beam'},{at:.33,pat:'devour'}]},
```

Reach 40+280×.18=90.4 ≤105 ✓. Arena: reuse the shipped 26×16 miniboss stamp shape, gated
`(META.echoLv|0)>=3 && depth>2800m && hashS('boss',cx*23+7,cy*23+17)<0.03` — a fresh boss-strand
hash (no stream draws inserted; generation already reads live ECHO/threat state for density, so
an echo-conditional stamp has precedent). Drops ride `boss:1` automatically; counts into
`META.bosses` (helps `canEscape`'s ≥3 and the threat ceiling; cannot satisfy MEND). Sprite at
implementation: `void` ramp, 22×36 grid on the 26×34 box, 1 frame, single tapered spike top
(wraith family, exaggerated), floats with ≥4 blank bottom rows. Bestiary:

```js
  witness:{n:'The Witness',d:`There is no record of it because it is the thing that keeps the
records.

It stands in none of the strata. It arrives when the world has been remade often enough to
need checking, and it checks. Delvers who descend into their sixth or seventh rewritten world
report being read — not watched, read — and the guild has stopped correcting the verb.`,boss:1},
```

---

## 10. TEST-SUITE EDITS (exact, per suite)

1. **suite-10** line ~290: extend `impl` to
   `['slam','volley','spores','firewall','summon','beam','devour','press','seal']`.
   (PAT_NAME coverage and the reach-cap sweep pick up `weft` automatically.)
2. **suite-10** new block "the weft": assemble the shipped band-5 reference build at 3110 m;
   assert hits-to-kill `H=ceil(liveHP/perHit)` satisfies **90 ≤ H ≤ 320** (the 60–90 s viable
   target expressed for the reference build; tune `ENEMIES.weft.hp` only); assert
   `applyArmor(34*depthDmg(MG.ty*TILE)*1.1, P.armor) < P.maxhp*0.55` (press under the
   boss-heavy clamp).
3. **suite-9** §6 (~line 238): insert `MGS=2;` before the existing `doEscape()` call and reset
   `MGS=0` after the block. NEW asserts: `wakeWeft()` under `canEscape()===false` spawns
   nothing; under true (after `flushSpawns()`) exactly one live `weft` exists in `EN` with
   finite hp/invT; `doEnding('x')` at `MGS<2` mutates nothing; MEND truth table — all five
   `BIOME_BOSS` values in `META.bosses` required, `{weft:1}` alone insufficient; USURP refuses
   at `echoLv=5`, fires at 6; each ending increments `escapes`, writes its fragment
   (`escape`/`mended`/`usurped`), sets `META.endings[kind]`; reset `META.endings`,
   `META.echoLv` after the block (harness trap).
4. **suite-11** new blocks (chanter/mortar shape): **press** — lock paints exactly one `'mark'`
   with `dmg===0` within 2 px of `P`; after the 1.2 s fuse a damaging hazard lands within 2 px
   of the LOCK even after `P` moves 300 px; a dead weft's pending press never lands. **seal** —
   marks are dmg 0; after the fuse the marked 3×3's solid count rises; the tile under `P` is
   never filled (place `P` centered in a marked pocket, assert `P`'s tile stays air and the
   shock burst fired); boss death leaves pending marks to expire with zero terrain delta; 60 s
   of press+seal+summon stays ≤ `HAZ_MAX` with no NaN.
5. **suite-14** new block "the master arena": generated world has air across the MG interior,
   `getTile(800,3168)===3` (slab bedrock), wall ring tile 7; positional solidity print of
   chunks (16,65)(17,65)(16,66)(17,66) identical under `poi`/`spawn`/`ore`/`flux` rerolls
   (boss-strand exemption as shipped); those chunks contain no `voidmaw`/chest/shrine/vent
   spawn records.
6. **suite-8**: automatic — new `ENEMIES` keys demand `SPR` + `LORE.enemy` (shipped above);
   `seam` ramp joins Law 1 + monotone asserts; fragment-order assert covers `f14` (3100 after
   3050) and the two `depth:-1` entries.
7. **test/pwa.js**: extend the migration assert — planted v1 blob lands `ver===3` and
   `META.endings` is `{}`.
8. If the Witness ships: suite-11 gated-arena assert — chunk sweep of deep abyss finds zero
   `witness` records at `echoLv=0` and ≥1 at `echoLv=3` (reset `META.echoLv` after).
9. `./design/audit.sh` to regenerate CURRENT-STATE; `node test/shots.js` for the arena/boss
   feel pass.

---

## 11. RISKS

- **`phase:1` on the boss** may read as hiding if it lingers inside sealed rock; counterplay
  exists (it must exit to melee; its bolts die on the rock face) but feel is unproven. It is
  one field — drop it if shots.js says so.
- **Runtime `setTile` placement in combat is novel** (anchor pockets are out-of-combat). The
  player-overlap skip is the whole safety case; suite-11 block 4 is the tripwire.
- **press at 0.52× on a 200 hp build** brushes the 0.55 boss-heavy clamp — the suite-10 assert
  pins it; if gear-hp inflation ever drops, retune the 1.1 ratio first.
- **`seam` vs the Seam strand display name** (`STRANDS.ore.n`) — accepted near-miss, distinct
  keys, thematically deliberate (the boss wears the seam's colour). Flagged so nobody "fixes"
  one into the other.
- **Menu escape becomes a place** — the one behavior change a veteran will feel. Mitigated by
  the Lattice pointer line, the map marker, and the `wayout` hint; `canEscape()` semantics and
  suite-9's truth table are untouched.
- **HP is a spreadsheet guess** — 2000 targets 60–90 s at 1.5× reference DPS; instrument via
  the suite-10 hits band and shots.js before trusting it (ref-research: measured TTK, not depth
  constants).
- Two fights (weft, witness) with `phase:1` + fly could feel samey if the Witness ships —
  differentiate in tuning (witness is faster, frailer, beam-led) or drop its `phase:1`.
