# SPEC — WORLD DEPTH: rooms, band identity, secret signposting, movement pockets

Refs obeyed: ref-world (strand charters, genChunk order, suite-9/14 exact constraints),
ref-systems (HAZ/vent contracts, status potency semantics), ref-enemies (encounter budget
untouched), ref-research (§5 world/rooms, secrets rule). Band bounds are NOT moved (suite-4's
`biomeTop('caves')===70` / `biomeTop('fungal')===400` literals stay true). No new META fields,
no SAVE_VER bump, no new input actions, no new statuses, no new HAZ kinds.

## ID MANIFEST (one namespace; checked vs live tables at 3c446e9 AND sibling specs)

- vent kinds: `grit` `volt` (join `spore`/`flame`; pass through generator untouched)
- BSHAPE fields: `ventP` (per-band vent gate), `under` `flue` `trav` (pocket flags)
- BSHAPE value additions on EXISTING fields: `fungal.dark:0.85`, `abyss.heat:12`
- ROOMS entry fields: `b` (band tag) `g` (grid) — format change, see §1
- hint ids (META.hints keys): `hidden` `cold`
- code symbols: `upSecrets()` + timer `SECRETT`
- fresh genChunk hash primes: 23 (flue) 41 (undercut) 43 (traverse) — existing stamps use
  3/5/7/11/13/17/19/29/31/37; no reuse
- Rejected for near-miss: `seam`/`seams` hint id (spec-final-boss claims `seam`); template
  comment "crucible" (ability gem `crucible`) renamed "the firebox"; pocket name "chimney"
  kept distinct from fungal template "the throat". No collision with spec-classes-skills
  (33 ids), spec-gear-forge (`dagger spear brig staff shroud`, `a*` modaffs, `cut` item field —
  my pocket flag is `under`, not `cut`), spec-final-boss (`weft press seal seam witness f14
  mended usurped`).

---

## 1. ROOM TEMPLATES — 9 new (6 → 15), per-band pools

### 1.1 Format change (the one structural edit)

`ROOMS` entries become `{b:<band name|0>, g:[rows]}`. `b:0` = any rooms-band (none ship with
0; the field exists so a future template can). The six existing templates get `b:'ruins'`,
grids unchanged. Alphabet stays exactly `#.=`; `#` and `=` both stamp `B0[2]` at stamp time
(authoring notation preserved).

**genChunk edit** (lines 1786–1795) — pool filter, same hash draws, no new stream draws:

```js
  if(SH.rooms&&hashS('terrain',cx*29+3,cy*29+11)<SH.rooms){
   const pool=ROOMS.filter(R=>!R.b||R.b===B0[1]);
   if(pool.length){
    const R=pool[Math.floor(hashS('terrain',cx*31+5,cy*31+7)*pool.length)%pool.length].g;
    const rh=R.length,rw=R[0].length;
    ...rest verbatim unchanged...
```

**BSHAPE gates** (new `rooms` fields — placement gates for the new pools):

| band | rooms | why this rate |
|---|---|---|
| ruins | 0.55 (unchanged) | identity band; suite-14 asserts >25% stamp rate |
| fungal | 0.18 | grown pockets, occasional — must not read "built" |
| forge | 0.25 | worked stone; the band is dense, rooms are relief |
| abyss | 0.12 | rare made-things in the void; sparsity IS the point |
| caves | — | FORBIDDEN: suite-14 asserts `BSHAPE.caves.rooms===undefined`; kept |

### 1.2 The nine templates (paste-ready, one intent comment each — house style)

Ruins (band air 0.48; new templates 0.45–0.52 — neutral):

```js
 // the gatehouse — a hung wall ends in a lintel; the door is under it. Chokepoint, high ground.
 {b:'ruins',g:['################','#......##......#','#..==..##..==..#','#......##......#',
  '#......==......#','#..............#','################']},
 // the archive — bays with shelf ledges; floor+headroom cells everywhere, so the cache strand
 // lands chests and shrines here disproportionately. The room where things are found.
 {b:'ruins',g:['##################','#.....#....#.....#','#.==..#.==.#..==.#','#.....#....#.....#',
  '##.####....####.##','#................#','##################']},
 // the tenement — three storeys, offset drop-gaps. The fight above you is the fight.
 {b:'ruins',g:['##############','#............#','#..####.####.#','#............#',
  '#.####.####..#','#............#','##############']},
```

- gatehouse 16×7: 58 air / 112 = **0.52 air**. Shieldman/warder hold the under-door; the
  lintel is the flank. Combat shape.
- archive 18×7: 58/126 = **0.46 air**. Lore niche: fragments ride chests; this room farms
  chest-placement predicates (air+floor+headroom+air-both-sides).
- tenement 14×7: 44/98 = **0.45 air**. Vertical combat inside architecture; archers get the
  storey above you.

Fungal (band air 0.58; gate 0.18):

```js
 // the gall — a hollow bulb with a ledge ring. The Bloom's one guaranteed grand chamber.
 {b:'fungal',g:['####........####','##............##','#...==....==...#','#..............#',
  '#..==......==..#','##............##','####........####']},
 // the throat — a baffled flue. Landings if you read them, a long drop if you do not.
 {b:'fungal',g:['####....####','####....####','#......==..#','#..==......#','#......==..#',
  '#..==......#','#......==..#','####....####','####....####']},
```

- gall 16×7: 74/112 = **0.66 air** (airy, matches band). Open corners blend into the carve.
  Bloomback arena + aerial fight; a poi chest on a ledge is the treasure moment.
- throat 12×9: 56/108 = **0.52 air**. Open 4-wide bore top AND bottom — it connects
  vertically (the band's `ay` identity distilled). Baffles are air-above-solid, i.e. vent
  perches: spore vents cluster in throats. Vertical traversal.

Forge (band air 0.28; gate 0.25):

```js
 // the slag run — two low decks, three floor slots. Mortar shells cannot arc into the lower one.
 {b:'forge',g:['##################','#................#','####.####.####.###','#................#',
  '##################']},
 // the firebox — a hanging block over a wide bowl. Flat floor breeds flame vents; fight above the line.
 {b:'forge',g:['##############','#....####....#','#.==.####.==.#','#....####....#',
  '#............#','#............#','##############']},
```

- slag run 18×5: 35/90 = **0.39 air**. Cover against the forge's artillery roster (mortar,
  smith volley); embers chase along the deck. Combat shape.
- firebox 14×7: 44/98 = **0.45 air**. The bowl floor is prime vent real estate (§2 forge
  `ventP:0.60`) → the room WHERE the floor burns; side ledges sit above the fire line. A
  chest that lands in the bowl is a priced treasure moment.

Abyss (band air 0.62; gate 0.12):

```js
 // the last stair — cut steps through the void. Someone descended before you, on foot.
 {b:'abyss',g:['..............','.==...........','......==......','...........==.',
  '......==......','.==...........','..............']},
 // the door — a freestanding frame on a broken sill, opening onto nothing. The doors face inward.
 {b:'abyss',g:['..........','..######..','..#....#..','..#....#..','..#....#..',
  '..#....#..','..==..==..']},
```

- last stair 14×7: 88/98 = **0.90 air** (no `#` at all — legal, alphabet is `#.=`).
  Traversal aid in the vast band + adds standing spots (helps, never hurts, suite-14
  traversability). Made-thing wrongness as lore.
- the door 10×7: 52/70 = **0.74 air**. Lore niche paying off the ruins blurb 1,500 m later.
  Interior columns 3 and 6 have floor+headroom → a chest can stand IN the doorway.

### 1.3 Air-band accounting (suite-14 ±0.13)

Per-chunk expected air shift = gate × mean((tplAir − bandAir) × tplArea) / 2304:
fungal `0.18×avg(+9.0,−6.5)/2304 ≈ +0.0001`; forge `0.25×avg(+9.9,+16.7)/2304 ≈ +0.0014`;
abyss `0.12×avg(+27.4,+8.4)/2304 ≈ +0.0009`; ruins new entries within ±0.04 of band target at
unchanged rate. All two orders of magnitude inside the ±0.13 tolerance. The ">200 air AND
>200 solid in a stamped chunk" assert is safe: worst case (last stair, 10 solid tiles added
to a 0.62-air chunk) leaves ~870 solid / ~1430 air.

### 1.4 Consequences to state out loud

- Template CHOICE hash is unchanged but pool composition changes → every ruins chunk may pick
  a different template than before (ref-world explicitly blesses this: "changes worlds").
- Activating the rooms block in fungal/forge/abyss inserts its 2 existing placement draws
  (`rS('terrain',…)` ×2) ahead of the vent/vault/cache draws in THOSE bands' room-gated
  chunks only. Caves and ruins streams unchanged. All suite fingerprints are comparative
  (within-run), so nothing breaks; grafted `META.echoes` seeds will produce shifted worlds
  after the update — cross-version drift, already accepted for ROOMS.length changes.
- Stamp order stays rooms → vents → … → vault → cache, so a vault can still overwrite a room
  (vault integrity preserved) and vents can perch on room ledges.

---

## 2. BAND IDENTITY — one addition per carved band, existing machinery only

| band | addition | machinery |
|---|---|---|
| caves | `vent:'grit', ventP:0.22` — rockfall seams | HAZ vents |
| fungal | `dark:0.85` — the Bloom glows | darkness (render-only) |
| ruins | `vent:'volt', ventP:0.30` — live conduits | HAZ vents |
| forge | `ventP:0.60` — the floor is increasingly on fire | HAZ vents (density knob) |
| abyss | `heat:12` — the dark drinks your charge | heat (fuel drain) |

### 2.1 `ventP` — one data field, one one-line edit

genChunk line 1797: `if(SH.vent&&hashS('terrain',cx*37+13,cy*37+29)<0.42){` becomes
`if(SH.vent&&hashS('terrain',cx*37+13,cy*37+29)<(SH.ventP||0.42)){`. Fungal keeps the 0.42
default (no `ventP`). Changing forge's gate changes WHICH forge chunks draw vent tries →
their downstream terrain draws (vault/cache positions) shift; same statement as §1.4,
comparative fingerprints unaffected.

### 2.2 caves — `grit` (rockfall): the teaching vent

The first band's hazard is honest: plain damage, no status, brief, rare (0.22 — half the
default). It teaches the read-the-floor verb three bands before the forge weaponizes it.
Fiction is already paid for: "still holding that shape long after the thing that pushed it
stopped moving" — sometimes it doesn't hold.

`upVents` (line 3357) gains one branch before the spore `else` (timer: falls into the
existing `3.4` arm, no timer edit):

```js
   if(v.kind==='flame')addHaz(v.x,v.y-10,34,1.9,7*dm,{burn:6*dm},'#ff8a3f',0,'fire');
   else if(v.kind==='grit')addHaz(v.x,v.y-8,26,1.0,6*dm,null,'#8a7a62',0,'cloud');
   else if(v.kind==='volt')addHaz(v.x,v.y-8,30,1.4,2*dm,{shock:1.3},'#e6d34a',0,'shock');
   else addHaz(v.x,v.y-6,46,4.5,4*dm,{chill:0.7},'#c98fe0',0,'cloud');
   burst(v.x,v.y,v.kind==='flame'?'#ff8a3f':v.kind==='grit'?'#8a7a62':v.kind==='volt'?'#e6d34a':'#c98fe0',6)
```

Numbers: 6×dm per 0.35s tick, but hurtPlayer i-frames rate-limit hostile hazards to ~1 hit
per 0.7 s — at caves depth that is 6–7 hp against a 13-dmg crawler band. Fair.

### 2.3 fungal — `dark:0.85` (bloomglow): zero code

`drawLight` already multiplies by `(bs.dark||1)`; 0.85 is pure data. "Fungus grows where
shard-light reaches" — the Bloom is faintly luminous. This turns darkness into a second
descent ARC (dim caves → glowing Bloom → neutral ruins → ember forge → black abyss) and
sharpens the abyss by contrast. Existing asserts (`abyss.dark>1`, `!caves.dark`) stay true.

### 2.4 ruins — `volt` (live conduits): the whitelist trap, done deliberately

The brickwork is still wired (the world blurb: everything "runs on the shattered body").
Emission (above): tiny chip damage `2×dm` + `{shock:1.3}` — shock is a MULTIPLIER status so
the potency is flat, never depth-scaled (ref-systems §1.3 trap; matches the beam pattern's
1.3). Mechanical identity: standing in the wrong part of the architecture makes the band's
archers/mortars/smiths hit 30% harder — the room itself flanks you. `sres` and the Warding
aura now have a band where they shine. Rate 0.30 (below default — rooms remain the primary
identity).

**THE TRAP — two exact test edits this requires:**

1. `test/suite-9.js` line 281 (zeroed-strand legality; chunk (20,30) IS ruins, so volt vents
   can now appear there):
   ```js
   if (c.spawns.some(s => s.type !== 'chest' && s.type !== 'shrine' && !ENEMIES[s.type])) broken.push(k + ':spawn');
   ```
   becomes
   ```js
   if (c.spawns.some(s => s.type !== 'chest' && s.type !== 'shrine' && s.type !== 'vent' && !ENEMIES[s.type])) broken.push(k + ':spawn');
   ```
2. `test/suite-14.js` lines 119–120:
   `A(BSHAPE.fungal.vent==='spore'&&BSHAPE.forge.vent==='flame',…)` extends to
   `…&&BSHAPE.caves.vent==='grit'&&BSHAPE.ruins.vent==='volt'` ('four bands declare a vent');
   `A(!BSHAPE.caves.vent&&!BSHAPE.ruins.vent,…)` becomes
   `A(!BSHAPE.surface.vent&&!BSHAPE.abyss.vent,'and the others do not')`.

Note the suite-9 FINGERPRINT (chunks cx 14–18 × cy 14–20 reach ruins at cy 19) counts vents
into `F.spawn`; vents are terrain-strand so poi/ore rerolls leave them fixed (assert holds)
and spawn rerolls still change `F.spawn` via encounters (assert holds). No edit needed there.

### 2.5 forge — `ventP:0.60`: density as identity

"Narrow and hot" becomes "narrow, hot, and the floor is the thing you read" (the generator's
own comment, intensified). Pure data once §2.1 lands. Runtime `VENTS` cap 40 and the 1-per-
chunk stamp rule bound the cost; suite-14's 60-s HAZ-cap assert already covers the worst case.

### 2.6 abyss — `heat:12`: the dark taxes flight

`heat` is mechanically "fuel drained per second" — flavor-agnostic, consumed at exactly one
site (`upPlayer` 3436–3438), camp/anchor exempt, ground regen (58/s) untouched. The vast band
(air 0.62) begs you to fly, and the dark charges 12/s for it — less than half the forge's 30.
The wraith band finally prices what it invites. One player-facing line — the existing dry-fuel
hint fires with forge text, so gate it by band in the heat branch:

```js
   if(P.fuel<=0&&chance(dt*1.5))hint(bn==='forge'?'heat':'cold',
    bn==='forge'?'The forge burns your fuel. Updraft and the harness carry more.'
               :'The dark is drinking your charge. Keep to the stone.');
```

(`bn` is already in scope in `upPlayer`; `cold` is a new one-shot hint id.)

---

## 3. SECRET SIGNPOSTING (playtest: discovery is broken)

The rule (ref-research §5): learnable tell + proximity cue; an aura may reveal from anywhere
but must never be the only way. Today tile 10's only tell is two 1-px dark seams, and
Prospector is effectively the only perception. Three additions, one visual language:
**teal glint = cut stone.**

### 3.1 The baked tell — drawChunk edit (line 1917)

```js
  if(T.secret){g.fillStyle='#00000028';g.fillRect(lx*TILE+2,ly*TILE+3,1,TILE-6);g.fillRect(lx*TILE+TILE-3,ly*TILE+3,1,TILE-6);
   g.fillStyle='#3fc9c13d';g.fillRect(lx*TILE+6,ly*TILE,4,1);g.fillRect(lx*TILE+6,ly*TILE+TILE-1,4,1)}
```

Two 4-px shard-teal glints on the top and bottom edges (`#3fc9c1` is already the game's
ore/secret color — one language). Baked once per chunk canvas: zero per-frame cost. Subtle at
rest, unmistakable once learned.

### 3.2 The proximity cue — `upSecrets(dt)` (sim-side, existing particle machinery)

```js
let SECRETT=0;
function upSecrets(dt){SECRETT-=dt;if(SECRETT>0)return;SECRETT=0.6;
 const tx0=Math.floor(P.x/TILE)-7,ty0=Math.floor(P.y/TILE)-5;
 for(let ty=ty0;ty<ty0+11;ty++)for(let tx=tx0;tx<tx0+15;tx++)
  if(getTile(tx,ty)===10){
   if(chance(0.5))burst(tx*TILE+8,ty*TILE+8,'#3fc9c1',2);
   hint('hidden',`That seam is cut, not cracked — strike it (${pr('mel')})`);return}}
```

Called from `sim()` beside `upVents` (NOT render — it mutates PART and consumes RNG, which is
legal sim-side only). 165 getTile per 0.6 s, window is around the player so chunks exist. The
first-ever nearby secret also teaches the mechanic through `pr()` (rule 11), once per save.
Prospector keeps its full-map reveal — it upgrades perception rather than being it.

### 3.3 The universal rim — tile 10 marks every made pocket

Every §4 pocket mouth is rimmed with tile-10 tiles (specified per pocket below). One
learnable rule covers secret caches AND movement pockets: teal glint means somebody cut this.
Tile 10 is `hard:0` so a rim never gates anything — it breaks to any weapon.

---

## 4. MOVEMENT-GATED POCKETS — three kinds, terrain strand, never hard-locked

Calibration constants (from CURRENT-STATE): jump apex `430²/(2·1500) ≈ 62 px ≈ 3.8 tiles`;
baseline tank ≈ `100 fuel / 42 per s ≈ 2.4 s` thrust; climb cap 190 px/s → ~20–24 tiles of
real climb per tank; **fuel regens at 58/s on the ground, so no fuel gate can ever strand you**
— every gate below is soft by construction, before even counting digging (all pocket rock is
the band's own ground tile, hard ≤2). Future movement-track tiers (tank, efficiency,
air-dash, wall-kick, grapple) trivialize these geometries without any rebalance: the heights
are fixed, the player grows.

All three stamp from `terrain` draws APPENDED after the secret-cache block and BEFORE the
boss arena (the arena may still overwrite a pocket — harmless, it only reshapes rock). The
guaranteed chest is pushed **unconditionally** (no RNG — strand-neutral; the secret-cache
precedent). Encounters are placed earlier in genChunk, so pockets are combat-free by
construction. Suite-9's fingerprint classifies their chests into `F.poi`; they move only on a
`terrain` reroll, which no suite forbids (poi/ore rerolls leave them fixed, as asserted).

### 4.1 THE FLUE — `flue:1` on fungal and abyss (the climb)

```js
  // ---- THE FLUE ---- a capped bore above a cavern ceiling. Fuel is the price; the chest is
  // the argument. Rock is terrain; the chest rides the pocket (no draw), rule 18.
  if(SH.flue&&hashS('terrain',cx*23+9,cy*23+5)<0.05){
   for(let tr=0;tr<10;tr++){
    const lx=rS('terrain',6,CHUNK-9),ly=rS('terrain',26,CHUNK-4);
    if(t[ly*CHUNK+lx]!==0||t[ly*CHUNK+lx+1]!==0)continue;               // open air to enter from
    if(t[(ly-1)*CHUNK+lx]===0||t[(ly-1)*CHUNK+lx+1]===0)continue;       // rock above to bore into
    const h=16+rS('terrain',0,4);                                        // 16-20 tile bore
    for(let y=1;y<=h;y++){t[(ly-y)*CHUNK+lx]=0;t[(ly-y)*CHUNK+lx+1]=0}
    for(let y=h+1;y<=h+3;y++)for(let x=-1;x<=2;x++)t[(ly-y)*CHUNK+lx+x]=0; // 4x3 top chamber
    t[(ly-1)*CHUNK+lx-1]=10;t[(ly-1)*CHUNK+lx+2]=10;                     // teal rim at the mouth
    spawns.push({x:(cx*CHUNK+lx-1)*TILE+8,y:(cy*CHUNK+ly-h-1)*TILE+8,type:'chest'});break}}
```

(The chest sits at chamber-west, column `lx-1` — rock below it is unbored, so it rests on
the chamber floor rather than over the bore's throat.)

Gate math: bore + chamber ≈ 19–23 tiles of climb = most of a baseline tank, entered from a
ceiling (you must NOTICE ceilings — hover literacy). Trivial with any fuel affix (T1 12–40),
Updraft (+70), the harness, or future tank tiers. Never locked: in fungal the walls are tile
4 (`hard:0` — ANY weapon digs handholds); in abyss tile 7 (`hard:2` — Greataxe/Bore), or just
fly. Draw budget: ≤10 tries × 2 + 1 height draw, appended.

### 4.2 THE UNDERCUT — `under:1` on caves (the climb OUT)

```js
  // ---- THE UNDERCUT ---- a drop-shaft under the floor. Falling in is free; the way out is
  // the lesson. Rock is terrain; bonus chest is the cache strand's call.
  if(SH.under&&hashS('terrain',cx*41+11,cy*41+7)<0.055){
   for(let tr=0;tr<10;tr++){
    const lx=rS('terrain',5,CHUNK-8),ly=rS('terrain',6,CHUNK-14);
    let ok=1;for(let x=0;x<3;x++)if(t[ly*CHUNK+lx+x]!==0||t[(ly+1)*CHUNK+lx+x]===0)ok=0;
    if(!ok)continue;                                                     // a 3-wide floor site
    for(let y=1;y<=8;y++)t[(ly+y)*CHUNK+lx+1]=0;                         // opens the floor: 8-tile shaft
    for(let y=9;y<=11;y++)for(let x=-1;x<=3;x++)t[(ly+y)*CHUNK+lx+x]=0;  // 5x3 chamber
    t[(ly+1)*CHUNK+lx]=10;t[(ly+1)*CHUNK+lx+2]=10;                       // teal rim on the lip
    spawns.push({x:(cx*CHUNK+lx-1)*TILE+8,y:(cy*CHUNK+ly+11)*TILE+8,type:'chest'});
    if(cS('poi',.5))spawns.push({x:(cx*CHUNK+lx+3)*TILE+8,y:(cy*CHUNK+ly+11)*TILE+8,type:'chest'});
    break}}
```

Gate math: 8-tile smooth shaft vs a 3.8-tile jump — you hover out (~0.8 s of a 2.4 s tank),
or wall-kick (future tier, trivial), or dig sideways (caves stone hard 1 = Axe), or stand on
the chamber floor and let fuel regen at 58/s. Band 1 teaches the whole pocket grammar cheaply.
The `cS('poi',.5)` bonus chest is a NEW poi draw appended after the vault's `cS('poi',.5)` —
the last existing poi draw — per §5.

### 4.3 THE TRAVERSE — `trav:1` on forge (the crossing)

```js
  // ---- THE TRAVERSE ---- a sealed gallery with a fire pit at its waist. The band's own heat
  // prices the crossing. Rock is terrain; the vent kind is the band's own.
  if(SH.trav&&hashS('terrain',cx*43+7,cy*43+19)<0.05){
   for(let tr=0;tr<10;tr++){
    const rw=16,rh=6,lx=rS('terrain',4,CHUNK-rw-4),ly=rS('terrain',4,CHUNK-rh-4);
    let buried=true;
    for(let y=-1;y<=rh;y++)for(let x=-1;x<=rw;x++){if(t[(ly+y)*CHUNK+lx+x]===0)buried=false}
    if(!buried)continue;
    for(let y=1;y<rh-2;y++)for(let x=1;x<rw-1;x++)t[(ly+y)*CHUNK+lx+x]=0; // 14x3 gallery
    for(let x=5;x<11;x++)t[(ly+rh-2)*CHUNK+lx+x]=0;                       // 6-wide pit, 1 deep
    t[(ly+1)*CHUNK+lx]=10;t[(ly+2)*CHUNK+lx]=10;                          // teal side-door
    spawns.push({x:(cx*CHUNK+lx+rw-2)*TILE+8,y:(cy*CHUNK+ly+rh-3)*TILE+8,type:'chest'});
    spawns.push({x:(cx*CHUNK+lx+8)*TILE+8,y:(cy*CHUNK+ly+rh-2)*TILE+8,type:'vent',vent:SH.vent});
    break}}
```

Gate math: a 6-tile pit with a live flame vent in it, inside the band that drains 30 fuel/s —
a max-jump covers ~6 tiles, so baseline is a timing test over fire with no hover budget to
spare; tank tiers/Updraft/Skyrigger make it a stroll. Never locked: dig around (forge stone
hard 1) or eat one flame tick (~7×dm, payable). Its vent rides the existing terrain-strand
vent plumbing (`spawnFromChunks` → `VENTS`, cap 40); this chunk may now hold 2 vents total —
the cap and sleep rule absorb it.

Expected density (gates × site-success, measured intent): roughly 1 pocket per 20–30 chunks
per hosting band — rarer than chests (1/5.5), rarer than caches (1/7). Drop-volume impact
≈ +10–15% chests, inside the 8–12 items/run target; verify with `design/audit.sh`.

---

## 5. RNG DISCIPLINE — the full draw ledger after this spec

Terrain-strand draw order per chunk (chunk stream; hash gates are positional and consume
nothing): 1. rooms placement (existing; newly fires in fungal/forge/abyss room-chunks —
stated in §1.4) → 2. vent tries (existing; newly fires in caves/ruins chunks passing their
`ventP` gates — inserts ≤24 draws ahead of vault/cache in THOSE chunks only) → 3. vault
(unchanged) → 4. secret cache (unchanged) → **5. undercut (NEW, appended) → 6. flue (NEW,
appended) → 7. traverse (NEW, appended)** → boss arena (boss strand, separate stream).
Blocks 5–7 in exactly this code order; only one can fire per chunk today (disjoint band
flags), but the order is fixed for the day a band hosts two.

Poi-strand order: chest tries → shrine tries → vault bonus `cS('poi',.5)` → **undercut bonus
`cS('poi',.5)` (NEW, appended — the only new poi draw in this spec)**. Flue and traverse
consume zero poi draws (unconditional pushes).

Spawn/ore/flux/boss strands: untouched.

---

## 6. TEST-SUITE EDITS (exact, per suite)

**suite-9** (`test/suite-9.js`)
1. Line 281 — zeroed-strand whitelist: add `s.type !== 'vent'` (verbatim in §2.4). Required
   by ruins volt vents at chunk (20,30).
2. No fingerprint edits: vents/pocket-chests are terrain-anchored; all §2/§4 content leaves
   the ore/poi/spawn cross-assertions true (argued in §2.4, §4 preamble).

**suite-14** (`test/suite-14.js`)
1. Line 82: `ROOMS.length >= 5` → `ROOMS.length >= 14`.
2. Lines 84–89 (shape loop): read `const R = ROOMS[i].g`; add
   `if(ROOMS[i].b && !BIOMES.some(B=>B[1]===ROOMS[i].b)) ragged.push(i+':band')`.
3. Line 102 `BSHAPE.caves.rooms === undefined` — KEEP (caves stay caves).
4. Add per-band pool + gate asserts: for each band with `BSHAPE[b].rooms`, pool
   `ROOMS.some(R=>!R.b||R.b===b)` is non-empty; gate-hash sweeps (copy the ruins loop at
   lines 96–99) find >0 stamped chunks for fungal/forge/abyss.
5. Lines 119–120 (vents declared): per §2.4.
6. Add emission asserts (copy the spore block at 127–138): a `grit` vent's hazard has
   `dmg>0 && st===null`; a `volt` vent's hazard has `st.shock===1.3` at BOTH 600 m and
   2600 m (multiplier statuses never depth-scale) while its `dmg` differs (damage does).
7. Add `ventP`: `A((BSHAPE.caves.ventP||0.42)<0.42 && (BSHAPE.forge.ventP||0.42)>0.42,
   'vent density is a band knob, sparse where it teaches')`; gate-count sweep over 100 chunk
   coords: caves passes < forge passes.
8. Band identity: existing hover test untouched (ruins/forge unaffected); add: hover 90
   frames in abyss → fuel < ruins fuel − 3 AND > same-test forge fuel; grounded refill in the
   abyss still positive; `A(BSHAPE.abyss.heat < BSHAPE.forge.heat)`;
   `A(BSHAPE.fungal.dark < 1 && BSHAPE.abyss.dark > 1, 'the Bloom glows; the abyss does not')`.
9. New `-- pockets --` block: flags (`caves.under===1`, `fungal.flue===1`, `abyss.flue===1`,
   `forge.trav===1`, none on surface/ruins); a 24×6-chunk sweep of each hosting band finds
   ≥1 pocket (detect via ≥2 tile-10 tiles in a chunk that FAILS the cache gate
   `hashS('terrain',cx*19+3,cy*19+8)>=0.14`, or via the flue's bore signature); a pocket
   chunk contains ≥1 `'chest'` spawn; positional solidity print over caves chunks
   (cx 7–12 × cy 2–7 — the existing §6 print covers only ruins) is bit-identical under
   `poi`/`ore`/`spawn` rerolls and changes under `terrain`; no pocket tile is bedrock
   (every stamped wall ∈ {band ground tile, 0, 10}).
10. Air fractions: no numeric edits — §1.3/§4 keep every band inside ±0.13; the run itself is
    the verification.

**suite-4** (`test/suite-4.js` — secret walls' home)
1. Add: `setTile` a tile 10 six tiles from the player (placement, sanctioned), set
   `PART.length=0`, call `upSecrets(0.7)` ×10 directly → `PART.length>0` and
   `META.hints.hidden===1`; control: clear the tile, reset PART, ×10 more → `PART.length===0`.
2. Existing `TILES[10].hard===0` and secret-generation asserts: untouched, still true.

**suite-11 / suite-10 / suite-15**: no edits — no enemy, budget, feel, or echo change in this
spec. (Vent hazards ride the already-asserted HAZ caps.)

**After implementation**: `./design/audit.sh` (room-template count 6 → 15 is published in
CURRENT-STATE), then `./test/run.sh` all suites + `node test/shots.js` for the glint/glow
reads (baked-canvas tells are invisible to the node harness — feel is judged by shots only).

---

## 7. RISKS / COORDINATION

- **Cross-version world drift** (§1.4, §2.1): room-pool size, new-band rooms, and `ventP`
  gates shift some chunks' terrain streams. Within-version determinism and all comparative
  fingerprints hold; `META.echoes` grafts will render differently post-update. Accepted and
  stated; if the owner wants graft stability across updates, that is a future versioned-weave
  hook, not this spec.
- **Vent ubiquity**: four of five bands now vent. Mitigated by kind distinctness (honest
  pulse / chill cloud / shock floor / burn) and rates (0.22 / 0.42 / 0.30 / 0.60); the abyss
  pointedly has none — its emptiness is the identity. If playtest reads "samey", drop grit to
  0.15 before cutting a kind.
- **Volt + Threat II/V armor + ranged bands** could spike incoming damage; shock is 1.3 flat
  and vents are dodgeable floor patches, but watch suite-10 TTD margins if a future spec
  raises ruins shooter damage.
- **Movement-track dependency**: pockets are calibrated to TODAY'S baseline (hover 2.4 s
  tank). If the movement spec lowers the STARTING tank below ~80 fuel, re-check the flue
  (19–23 tiles) still lands in "difficult, not impossible"; heights need no change for
  upgrades, only for nerfs.
- **Forge chunk crowding**: traverse + vault + cache + denser vents in one band. Gates are
  low and the buried check fails often in practice; if audit shows >1 made-POI per 4 forge
  chunks, halve the traverse gate to 0.025.
- The `upSecrets` hint fires for the SECRET-CACHE wall and pocket rims alike — one rule, one
  hint. Do not add per-pocket hints; the teal glint is the teacher.
