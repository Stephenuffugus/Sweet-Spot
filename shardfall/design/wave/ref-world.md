# SHARDFALL — WORLD / LATTICE layer: content-author reference

Ground truth extracted from `/workspaces/Sweet-Spot/shardfall/index.html` at commit `3c446e9`
(single `<script>` block; line numbers below refer to that file unless another path is given).
This doc is a contract: everything a designer needs to add a **biome band, room template, vent /
band mechanic, tile, POI, or sigil** without reading the code. Where a code comment and the code
disagree, this doc states what the code *does*.

Verify any change with:

```bash
cd /workspaces/Sweet-Spot/shardfall
./test/run.sh          # all node suites (2-15)
./test/run.sh 9        # the Lattice
./test/run.sh 14       # descent arc / air fractions / rooms / vents / strand ownership
```

---

## 0. Coordinate system and constants (line 238)

```js
const TILE=16, CHUNK=48, WORLD_W=1600, WORLD_H=3200, SURFACE=60;
const CAMP_X=Math.floor(WORLD_W/2); // camp centered on surface  (= 800)
```

- World is 1600 × 3200 **tiles** (25.6k × 51.2k px). A chunk is 48×48 tiles.
- Positions in entity code are **pixels**; tables and generators use **tile** coordinates.
- "Depth in metres" everywhere = `tileY - SURFACE` (`depthOf(y)=Math.max(0,(y/TILE-SURFACE))`,
  line 2719). `depthMul(y)=1+depthOf(y)/900`; `depthDmg(y)=1+Math.pow(depthOf(y)/900,0.85)*0.62`.
- `CHUNKS` is a `Map` `"cx,cy" -> {tiles:Uint8Array(CHUNK*CHUNK), cv:canvas|null, dirty, spawned, spawns:[]}`.

---

## 1. TILES (line 527) — the full table, verbatim

```js
const TILES={
 0:{air:1},
 1:{c:'#54381f',hard:0},           // dirt
 9:{c:'#33552a',hard:0},           // grass
 2:{c:'#41464e',hard:1},           // stone
 3:{c:'#1c1c20',hard:9},           // bedrock
 4:{c:'#42335c',hard:0},           // fungus
 5:{c:'#544a3a',hard:1},           // ruin brick
 6:{c:'#4e2a22',hard:1},           // forge stone
 7:{c:'#241f2e',hard:2},           // abyss stone
 8:{c:'#3fc9c1',hard:0,ore:1},     // shard ore
 10:{c:'#41464e',hard:0,secret:1}, // secret wall — mimics stone, breaks to any weapon
};
```

Fields:

| field | meaning | legal values |
|---|---|---|
| key | tile id, written into `chunk.tiles` (Uint8Array — so ids must be 0–255) | integer, unique |
| `air` | 1 marks the empty tile. Only id 0 has it. Solidity everywhere is tested as `v!==0` / `v===0`, **not** via this flag | `1` on id 0 only |
| `c` | fill colour for `drawChunk` and particle bursts; also the **ground the sprite-contrast law is checked against** (suite-8) | CSS hex |
| `hard` | position on the hardness ladder. `carve()` removes a tile only if `T.hard<=maxHard` **and** `T.hard<9`. `hard:9` = bedrock, never carvable by anything | 0,1,2,9 in use |
| `ore` | carving this tile drops 2–4 shards (`dropShards(tx*TILE+8,ty*TILE+8,ri(2,4))`) unless the caller passed `dropOre===false` | `1` or absent |
| `secret` | draws faint seam lines; `hard:0` means it breaks to any weapon — that pairing IS the secret-wall mechanic | `1` or absent |

Hardness ladder in play: dirt/grass/fungus/ore/secret = 0 (any weapon), stone/ruin brick/forge
stone = 1 (needs `dig>=1`: Axe dig 1, Greataxe 2, Excavate, Bore…), abyss stone = 2, bedrock = 9.
`getTile` out of bounds returns **3** (bedrock) — the world edge is a 2-tile bedrock shell
(`tx<2||tx>=WORLD_W-2||ty>=WORLD_H-2 → v=3`, line 1755).

Rule 3 (CLAUDE.md): **never `setTile()` to dig** — all removal goes through
`carve(px,py,radius,maxHard,dropOre)` (line 1889). Contract: px/py in **pixels**, radius in
pixels (`r=ceil(radius/TILE)` tiles, circular), returns number of tiles removed, spawns dust for
the first 14. `setTile(tx,ty,v)` (tile coords) is for *placing* terrain (anchor pockets, tests).

Suite constraints on tiles: `TILES[5].hard>0` — vault brick is hard-gated (suite-3:74);
`TILES[10].hard===0` — secret walls break to any weapon (suite-4:47); secret walls must actually
generate (suite-4:46). Suite-8: ore/secret are "accent tiles", excluded from the contrast law,
but **every `c` used as a biome ground tile must let every roster sprite clear 3:1 contrast**
(and 2.4:1 against a lit version) — a new ground colour can fail suite-8 without any sprite change.

---

## 2. BIOMES (line 584) — the band table, verbatim and complete

```js
// biome by tile depth: [maxY, name, groundTile, caveScale, enemyTypes]
const BIOMES=[
 [SURFACE+10,'surface',1,0.00,['crawler']],
 [400,'caves',2,0.055,['crawler','bat','rockling','delvemite','burrower','spitter']],
 [900,'fungal',4,0.06,['spitter','sporeling','stalker','bat','bloomback','delvemite']],
 [1600,'ruins',5,0.05,['brute','archer','shieldman','chanter','warder','mortar','burrower']],
 [2400,'forge',6,0.055,['ember','smith','spitter','mortar','warder','burrower']],
 [WORLD_H,'abyss',7,0.045,['wraith','voidspawn','stalker','hollowed','chanter']],
];
```

A row is a **positional array**, not an object:

| index | field | meaning / units | legal values |
|---|---|---|---|
| `[0]` | `maxY` | band's **exclusive** lower bound in tile-Y. The band's top is the previous row's `[0]` (or `SURFACE` for the first). `biomeAt(ty)` returns the first row with `ty<b[0]`; anything past the last row falls into the last row | ints, strictly ascending, last must be `WORLD_H` |
| `[1]` | `name` | band id string. Must have a matching key in `BSHAPE`, an entry in `LORE.biome` (suite-8:247 asserts every name has lore), and optionally in `BIOME_BOSS` | lowercase string, unique |
| `[2]` | `groundTile` | `TILES` id used for all solid rock in the band, for room/arena stamping, and as the ground colour in the suite-8 contrast law | existing TILES id |
| `[3]` | `caveScale` | noise frequency for the cave carve — tiles are sampled at `noise2(tx*cs*S.ax, ty*cs*S.ay)`. **`0` disables carving entirely** (surface): `calibrateAir` sets the threshold to −1 when `!b[3]` | float ≥ 0, ~0.045–0.06 in use |
| `[4]` | `enemyTypes` | the roster: keys into `ENEMIES` drawn by the encounter-budget spawner. Bosses do NOT go here — they come from `BIOME_BOSS` | array of ENEMIES keys |

Helpers a band interacts with:

- `biomeAt(ty)` (1717) → the row; `biomeName(ty)` (1959) → the name.
- `biomeTop(name)` (1958) → the band's **starting** tile-Y (previous row's bound, min `SURFACE`).
  Suite-4:54 hard-codes `biomeTop('fungal')===400 && biomeTop('caves')===70` — moving the caves
  or fungal bounds breaks suite-4 until you update those literals.
- `BIOME_BOSS` (line 1010), verbatim:
  `const BIOME_BOSS={caves:'warden',fungal:'sporemother',ruins:'sentinel',forge:'forgelord',abyss:'voidmaw'};`
  A band absent from this map generates **no boss arenas** (the arena stamp checks
  `const bname=BIOME_BOSS[B0[1]]; if(bname&&…)`).

Suite-11 constraints on a roster (`[4]`) for every non-surface band:
at least **3** creature types; a "tough" unit — `max(hp*(1+arm/8)) >= 3 × min(...)` across the
roster; at least one shooter (`ENEMIES[t].shoot`); at least **3 distinct roles** out of
{swarm=`pack`, bruiser=`hp>=70`, ranged=`shoot`, support=`heal||ward`,
denial=`trail||burstOnDeath||shoot.explode`, terrain=`phase||burrows`}. Globally: ≥2 bands must
carry a support unit; every named role must exist on some non-boss enemy. Suite-8 additionally
requires no two enemies **in the same band** share a top shape, and every roster sprite clears
contrast on the band's ground tile.

---

## 3. BSHAPE + calibrateAir — a band's shape and how the generator solves for it

`BSHAPE` (line 551), verbatim and complete:

```js
const BSHAPE={
 surface:{air:0,    ax:1,    ay:1,    n:'the rim'},
 caves:  {air:0.42, ax:1.45, ay:0.85, n:'tight, winding'},
 fungal: {air:0.58, ax:0.70, ay:1.60, n:'open caverns and vertical shafts', vent:'spore'},
 ruins:  {air:0.48, ax:1.00, ay:1.00, n:'built geometry', rooms:0.55},
 forge:  {air:0.28, ax:1.25, ay:1.15, n:'narrow and hot', heat:30, vent:'flame'},
 abyss:  {air:0.62, ax:0.85, ay:0.85, n:'vast, dark, sparse', dark:1.28},
};
```

| field | meaning / units | consumed by |
|---|---|---|
| `air` | fraction of the band that is open space, 0–1. **Declared, not tuned**: the generator solves the carve threshold to hit it. `air:0` (falsy) → band is never carved | `calibrateAir` (1723), carve step in `genChunk` (1764) |
| `ax`,`ay` | anisotropic stretch of the carve noise. Same `air` reads as winding corridors (`ax>ay`) or vertical shafts (`ay>ax`). Also an accepted "identity" — suite-14 lets `|ax-ay|>0.2` count as a band's mechanical identity | carve step + `calibrateAir` (both must use identical scaling, and do) |
| `n` | flavour string shown in dev/design output | logs only |
| `vent` | vent kind for this band, `'spore'` or `'flame'` (any new kind needs an emission branch in `upVents`) | vent stamp in `genChunk` (1792), `upVents` (3309) |
| `rooms` | probability (0–1) that a chunk in this band stamps a room template; only ruins has it (0.55) | room stamp in `genChunk` (1782) |
| `heat` | fuel drained per second while the player stands anywhere in the band (camp/anchor exempt) | `upPlayer` (3436-3438) |
| `dark` | multiplier on the depth-darkness overlay | `drawLight` (4603): `dark=min(0.86, max(0,(ty-SURFACE-40)/900)*0.62*(threat().dark||1)*(bs.dark||1))` |

### calibrateAir (line 1723) — the solver

```js
let AIRCAL={};
function calibrateAir(){
 AIRCAL={};
 for(let i=0;i<BIOMES.length;i++){
  const b=BIOMES[i],name=b[1],S=BSHAPE[name];
  if(!S||!S.air||!b[3]){AIRCAL[name]=-1;continue}
  const y0=i?BIOMES[i-1][0]:SURFACE, y1=b[0], span=Math.max(1,y1-y0), cs=b[3];
  const vals=[];
  for(let k=0;k<1024;k++){
   const tx=(k*181)%WORLD_W, ty=y0+((k*97)%span);
   vals.push(noise2(tx*cs*S.ax,ty*cs*S.ay))}
  vals.sort((p,q)=>p-q);
  AIRCAL[name]=vals[Math.min(vals.length-1,Math.floor(S.air*vals.length))]}
 return AIRCAL}
calibrateAir();   // once at load; re-solved whenever the terrain strand changes
```

Mechanism: per band, sample the band's own carve noise at 1024 quasi-random points inside the
band, sort, and take the `air`-quantile as the threshold. In `genChunk` a tile is carved to air
when `noise2(tx*cs*S.ax,ty*cs*S.ay) < AIRCAL[name]` (line 1765-1766). `noise2` reads the
**terrain strand only** (`noise2(x,y)=vnoiseS('terrain',x,y)*0.65+vnoiseS('terrain',x*2.1,y*2.1)*0.35`),
so cache/spawn rerolls can never move a wall. `calibrateAir()` MUST be re-run after any change
to `WEAVE.terrain` (`reweave` does this; tests that poke `WEAVE.terrain` by hand must call it
themselves) and after any change to `BSHAPE`/`BIOMES` bounds.

### The descent arc — the numbers as shipped

tight → open → built → tight → vast. Air targets: caves **0.42** → fungal **0.58** → ruins
**0.48** → forge **0.28** → abyss **0.62** (the most open band is the last and most dangerous).
Suite-14 asserts each measured fraction lands within **±0.13** of its declaration, plus the
ordering itself (see §10). Forge heat 30 fuel/s; abyss darkness ×1.28.

---

## 4. ROOMS — templates (line 559)

Format: a template is an **array of equal-length strings**, one per row. Alphabet is exactly
three characters (suite-14 rejects anything else, including spaces):

- `#` — wall, stamped as the band's own ground tile (`B0[2]`)
- `.` — air
- `=` — "a one-tile ledge you can stand on". **At stamp time `=` is identical to `#`** — the
  stamping line is `if(ch==='#'||ch==='='){t[idx]=B0[2]}else if(ch==='.'){t[idx]=0}` (1789).
  The distinction is authoring notation only (a ledge is a 1-tile-thick `=` run with air above
  and below).

One full template, verbatim (the third one, "the well"):

```js
 // the well — a vertical shaft with ledges, drops you fast if you are careless
 ['############','#....##....#','#.==.##.==.#','#....##....#','#.==......=#',
  '#....##....#','#.==.##.==.#','#....##....#','############'],
```

The six templates as shipped: pillared hall (18×7), two tiers (16×8), the well (12×9),
the crossing (10×8), collapsed gallery (20×7), the cell block (14×8).

### How templates are stamped (`genChunk` lines 1781-1789)

```js
if(SH.rooms&&hashS('terrain',cx*29+3,cy*29+11)<SH.rooms){
 const R=ROOMS[Math.floor(hashS('terrain',cx*31+5,cy*31+7)*ROOMS.length)%ROOMS.length];
 const rh=R.length,rw=R[0].length;
 if(rw<CHUNK-2&&rh<CHUNK-2){
  const lx=rS('terrain',1,CHUNK-rw-1),ly=rS('terrain',1,CHUNK-rh-1);
  ...stamp...
```

- **Gate**: `hashS('terrain', cx*29+3, cy*29+11) < BSHAPE[band].rooms` — one roll per chunk,
  terrain strand. Only bands with a `rooms` field stamp rooms (today: ruins, 0.55).
- **Template choice**: `hashS('terrain', cx*31+5, cy*31+7)` scaled over `ROOMS.length`.
- **Placement**: `rS('terrain',…)` — the per-chunk *terrain* RNG (see §6). Everything about a
  room is the **terrain strand** (rule 18): reroll `poi` and the chest inside moves; the room
  stays exactly where you learned it was.
- A template wider/taller than `CHUNK-2` (46) is **silently skipped** — the gate fires, nothing
  stamps. Rooms overwrite whatever the cave carve produced (stamped after the tile loop).
- One room max per chunk; a room never crosses a chunk boundary.

### Adding a template

1. Append the string-array to `ROOMS` (with the one-line intent comment — every existing entry
   has one). Rectangular, alphabet `#.=`, keep well under 46×46 (in-use sizes are ≤20 wide).
2. Nothing else to register — the picker indexes `ROOMS.length` dynamically.
3. Run `./test/run.sh 14`. Suite-14 §3 asserts: `ROOMS.length>=5`; every template rectangular;
   every char in `#.=`; `w<CHUNK-1 && h<CHUNK-1`; ruins stamp rate >25% of sampled chunks;
   `BSHAPE.caves.rooms===undefined`; a stamped chunk contains both >200 air and >200 solid
   tiles. A template that is nearly all `#` or all `.` can fail that last one if it becomes
   the found sample. Also re-run suite-9 — template choice consumes terrain-strand hashes, and
   changing `ROOMS.length` moves which template every chunk in the world picks (fine, but
   worth knowing it changes worlds).

---

## 5. VENTS and biome mechanical identity

The design law (suite-14 §5): **every carved band must claim at least one mechanical identity
beyond its palette** — `heat`, `dark`, `vent`, `rooms`, or shape anisotropy `|ax-ay|>0.2`.

### Vents (fungal `spore`, forge `flame`)

Generation (`genChunk` 1790-1795, terrain strand — vents are structural and survive cache
rerolls; suite-14 §6b fingerprints exactly this):

```js
if(SH.vent&&hashS('terrain',cx*37+13,cy*37+29)<0.42){
 for(let tr=0;tr<12;tr++){const lx=rS('terrain',2,CHUNK-3),ly=rS('terrain',2,CHUNK-3);
  if(t[ly*CHUNK+lx]===0&&t[(ly+1)*CHUNK+lx]!==0){
   spawns.push({x:(cx*CHUNK+lx)*TILE+8,y:(cy*CHUNK+ly)*TILE+8,type:'vent',vent:SH.vent});break}}}
```

Gate 0.42/chunk, 12 tries to find air-above-solid, **at most one vent per chunk**. The vent goes
into `chunk.spawns` as `{x,y,type:'vent',vent:kind}` and is activated in `spawnFromChunks`
(2897): `if(VENTS.length<40)VENTS.push({x,y,kind:s.vent,t:rr(0,3)})` — runtime cap **40**.

Runtime (`upVents`, 3309-3317): a vent sleeps beyond 900px horizontal / 700px vertical of the
player. On timer expiry it re-arms (`flame` 2.6s, everything else 3.4s) and emits a hazard
scaled by `depthDmg(v.y)`:

```js
if(v.kind==='flame')addHaz(v.x,v.y-10,34,1.9,7*dm,{burn:6*dm},'#ff8a3f',0,'fire');
else addHaz(v.x,v.y-6,46,4.5,4*dm,{chill:0.7},'#c98fe0',0,'cloud');
```

Rule 19: area denial is a `HAZ` entry.
`addHaz(x,y,r,t,dmg,st,col,friendly,kind)` (3289): radius px, lifetime s, damage per 0.35s tick,
status object, colour, `friendly` 0=hurts player / 1=hurts enemies, kind `'cloud'|'fire'|'shock'|'gas'`.
Cap `HAZ_MAX=64` (oldest shifted out). Vents emit with `friendly=0` — suite-14 asserts
`HAZ[0].friendly===0` ("belongs to the world, not to you").

`reweave('terrain',…)` clears `VENTS` (1418) because the shape changed; `newRun` clears it too.

### Forge heat

`upPlayer` (3436-3438): `const bs=BSHAPE[biomeName(⌊P.y/TILE⌋)]; if(bs&&bs.heat&&!nearCamp())
P.fuel=max(0,P.fuel-bs.heat*dt)` plus a hint when dry. Ground regen still runs (58/s vs 30/s
drain), so the band slows refuel rather than stopping it — suite-14 asserts both directions.

### Abyss darkness

`drawLight` (4603): `bs.dark` multiplies the depth-darkness alpha (see §3 table). Render-only.

### Adding a new band mechanic

Declare a field in `BSHAPE` (data), consume it in exactly **one** site (`genChunk` for
structure — terrain strand; `upPlayer`/`upVents`/`upEnemies` for simulation; `drawLight`/render
for presentation), then extend suite-14 §5 in the shape of the existing asserts
(`BSHAPE.x.field>0 && !BSHAPE.y.field`, plus a behavioural measurement). A new vent *kind* is:
`vent:'newkind'` in `BSHAPE` + an emission branch in `upVents` (the `else` today is the spore
cloud; timers are `kind==='flame'?2.6:3.4`) + suite-14-style vent asserts. Nothing else — the
generator and `spawnFromChunks` pass the kind string through untouched.

---

## 6. POI stamping in genChunk — gates, strands, densities

`genChunk(cx,cy)` (1738) builds one RNG **per strand per chunk**:

```js
const CRs={};
for(const st of STRANDS)CRs[st.k]=mulberry((WEAVE[st.k]^Math.imul(cx,374761393)^Math.imul(cy,668265263))>>>0);
const rS=(st,a,b)=>a+Math.floor(CRs[st]()*(b-a+1));   // int in [a,b] from strand st
const cS=(st,p)=>CRs[st]()<p;                          // bool from strand st
```

Rule 18: **rock is `terrain`-strand only; contents are `poi`.** A cavity/room/pocket/arena is
SHAPE (terrain); the chest/shrine inside it is CACHE (poi). Suite-14 §6 fingerprints solidity
positionally and fails any strand that starts editing walls. Order matters: draws from a
strand's chunk RNG are sequential, so inserting a new `rS('terrain',…)` call *before* existing
ones reshuffles everything downstream in that strand for every chunk (a legal but
world-changing edit).

POI stamps run only for chunks below the surface (`cy*CHUNK > SURFACE-4`), in this order:

| POI | gate (one roll per chunk) | geometry strand | contents strand | placement rule |
|---|---|---|---|---|
| room template | `hashS('terrain',cx*29+3,cy*29+11) < BSHAPE.rooms` | terrain (`rS('terrain',…)` position) | — (rooms are empty) | see §4 |
| vent | `SH.vent && hashS('terrain',cx*37+13,cy*37+29) < 0.42` | terrain | — | 12 tries, air-above-solid, max 1 |
| encounter | always (threat budget) | — | **spawn** only | budget `(3.0+depthM/900*2.8)*threat().dens*ECHO.dens`; cost `enemyCost(ty)=hp/40+dmg/14+arm/7+(shoot?0.8)+(heal||ward?1.6)+pack*0.25` (min 0.5); ≤8 bodies, ≤1 support, repeat weight `1/(1+used*1.8)`; 26 tries for a standing spot, failed search retries the whole draw; packs written as groups `{…,type,pk:0|1}`; excluded within 20 tiles of CAMP_X above SURFACE+20 |
| treasure chest | `hashS('poi',cx*7+5,cy*7+3) < 0.12` | — (needs an existing cavity) | poi (14 tries via `rS('poi',…)`, needs air+floor+headroom) | `{type:'chest'}` |
| shrine | `hashS('poi',cx*11+2,cy*11+9) < 0.18` | — (may NOT carve; it once did, and that bug is why the rule exists) | poi (22 tries, needs air, floor, headroom, air both sides) | `{type:'shrine'}` |
| sealed vault | `hashS('terrain',cx*13+7,cy*13+4) < 0.10` | terrain: `rw=rS('terrain',9,13)`, `rh=rS('terrain',6,8)`; walls always **tile 5** (ruin brick, hard 1 — needs a digger or blast) | poi decides the *bonus* chest (`cS('poi',.5)`); the first chest rides with the room | 1–2 `{type:'chest'}` inside |
| secret cache | `hashS('terrain',cx*19+3,cy*19+8) < 0.14` | terrain: 5×4 pocket, stamped ONLY if the pocket+1-tile ring is fully buried; one side column becomes **tile 10** | chest pushed unconditionally with the pocket | `{type:'chest'}` |
| boss arena | `bname=BIOME_BOSS[band]` exists **and** `hashS('boss',cx*17+11,cy*17+6) < 0.045` | **boss strand** (geometry AND gate — the strand table defines `boss` as "the arenas, and what stands in them", so an arena moving on a boss reroll is the mechanic, not a leak) | boss | 26×16 room: top+bottom rows = ground tile, interior = air, **side columns left as-is**; spawn `{type:bname}` near the floor |

Measured densities (HANDOFF, line 101): **1 chest / 5.5 chunks, 1 shrine / 30, 1 boss / 26** —
"Tune in genChunk hash gates." Suite-3 asserts only existence (chests>0, shrines>0, bosses>0)
and logs density; suite-11 leans on the encounter budget heavily (composition, supports≤1,
packs, delvemite groups).

Activation: `spawnFromChunks` (2889) runs over the 3×3 chunks around the player, once per chunk
(`c.spawned=true`), converting spawn records: `chest→CHESTS`, `shrine→SHRINES`, `vent→VENTS`,
anything else → `mkEnemy` (with elite roll for non-boss non-pack-member leaders, and the
dissonance-Bleed substitution — see §7). Spawn record `type` strings must be
`'chest'|'shrine'|'vent'` or an `ENEMIES` key; suite-9 §7 asserts (for a ruins-band chunk) that
every spawn is chest/shrine/known-enemy — note `'vent'` is NOT whitelisted there and passes only
because no vent band covers the sampled chunk (20,30).

---

## 7. THE LATTICE — six strands, sigils, dissonance, the escape

### The six strands (line 1673), verbatim

```js
const STRANDS=[
 {k:'terrain',n:'Shape',   d:'the rock itself — caves, cliffs, the way down'},
 {k:'ore',    n:'Seam',    d:'where the shards lie'},
 {k:'poi',    n:'Cache',   d:'chests, shrines, vaults, the secret places'},
 {k:'spawn',  n:'Swarm',   d:'what lives here, and where it waits'},
 {k:'boss',   n:'Warden',  d:'the arenas, and what stands in them'},
 {k:'flux',   n:'Drift',   d:'the small variances — texture, scatter, chance'},
];
```

`WEAVE` holds one 32-bit seed per strand; `WEAVE_LOCK[k]=1` marks a bound strand.
`deriveWeave(master)` (1683): `WEAVE[s.k]=(imul(master^imul(i+1,0x9E3779B9),2654435761)^(master>>>(i+3)))>>>0`
— each strand a different mixing so no two move together. Called by `newRun()` with
`SEED=(Date.now()^ri(0,1e9))>>>0`.

**Every generator read goes through the strand:**

- `hashS(strand,x,y)` (1701) → float [0,1): spatial hash of (x, y, `WEAVE[strand]`). All the POI
  gates above use it. `hash2(x,y)` = `hashS('terrain',x,y)` (legacy alias).
- `vnoiseS(strand,x,y)` / `noiseS(strand,x,y)` — value noise over `hashS`; `vnoise`/`noise2`
  are the terrain-strand versions (the carve uses `noise2`).
- Per-strand per-chunk RNGs `CRs`/`rS`/`cS` (§6).
- In-chunk usages: ore is `hashS('ore',tx*3+1,ty*3+2)<0.012` → tile 8 (**replaces** rock, so
  solidity is unchanged — an ore reroll must not move a wall); cosmetic hard flecks are
  `hashS('flux',tx*5+3,ty*5+1)<0.05 → tile 2` (flux swaps one solid tile type for another,
  never solid↔air); `drawChunk` texture reads `flux`.

Rule 7: if rerolling the caches moves the monsters, the Lattice is broken. Suite 9 §2 asserts it
by fingerprinting (see §10).

### Glyphs (1692)

```js
const GLYPHS='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
```

`seedGlyph(v)` → **six** symbols, 5 bits each = the low **30 bits** of the seed (the code
comment says "8 symbols… 40 bits"; the loop is `i<6` — trust the code, and suite-9 asserts 6
symbols and a 30-bit round-trip: `glyphSeed(seedGlyph(v)) === (v & 0x3fffffff)`).
`glyphSeed(g)` is case-insensitive, strips non-alphabet chars, junk → 0. The alphabet must
never regain O/I/0/1 (asserted) and must stay duplicate-free (asserted). The glyph string is
UI-facing: the Lattice panel, the master glyph, the graft keypad.

### SIGILS_DEF (line 1376), verbatim and complete

```js
const SIGILS_DEF={
 reroll:{n:'Sigil of Unmaking', d:'reroll one strand — that part of the world becomes another world',
   diss:14, col:'#e05555'},
 lock:  {n:'Sigil of Binding',  d:'lock one strand — no later reroll may touch it',
   diss:6,  col:'#6ad07a'},
 echo:  {n:'Sigil of Echo',     d:'restore one strand to the value it had on a past run',
   diss:10, col:'#6f8fe0'},
 invert:{n:'Sigil of Inversion',d:'mirror one strand — the same world, reflected',
   diss:12, col:'#c39ae0'},
 graft: {n:'Sigil of Grafting', d:'write one strand to a glyph you name',
   diss:22, col:'#d8a53f'},
};
```

Fields: `n` display name, `d` one-line description (shown on pickup and in the picker), `diss`
dissonance added per use (must be >0 — suite-9 asserts all four fields), `col` UI diamond
colour. What each rewrites (`useSigil(id,k)`, 3743):

- **lock**: `WEAVE_LOCK[k]=1`. Enforcement is **UI-level**: `latPick` disables every non-lock
  sigil button on a bound strand (`blocked=WEAVE_LOCK[k]&&id!=='lock'`); `useSigil` itself does
  not check the lock. Suite-9 asserts the state the UI reads.
- **reroll**: `reweave(k,(imul(WEAVE[k]^0x9E3779B9,2654435761)^(Date.now()&0xffff))>>>0)`.
- **invert**: `reweave(k,(~WEAVE[k])>>>0)` — exactly reversible (asserted).
- **echo**: `reweave(k, META.echoes[k])`; if no recorded past, refuses, toasts, and **returns
  the sigil** (asserted).
- **graft**: opens the on-screen glyph keypad (`openGraft`); the sigil is held while the keypad
  is open; `graftCancel` pushes it back (asserted); `graftGo` does
  `reweave(k, glyphSeed(GRAFT_BUF))` for exactly the six glyphs typed. Costs the most
  dissonance of any sigil — suite-9 asserts `graft.diss > reroll.diss` ("authorship costs more
  than vandalism"), so any new sigil pricing must preserve that ordering at the top.

After any successful use: `addDissonance(D.diss)` and `META.echoes[k]=WEAVE[k]; saveMeta()` —
echoes persist **across runs** in the meta save.

Acquisition (a new sigil id needs nothing extra here — pools are `Object.keys(SIGILS_DEF)`):
- Every boss corpse drops one, uniform over the pool (2796-2797).
- Chests: only below 400 m; chance `min(0.35,(d-400)/4000)`; below 1600 m the full pool,
  otherwise 60% `reroll` / 40% `lock` (2837-2841).
- Pickup path: `upPickups` `kind==='sigil'` → `SIGILS.push(id)`, toast, `discover('sigil',id)`,
  lattice hint (3326-3329).
- **Registration requirement**: a matching prose entry in `LORE.sigil` (line 1308) — suite-9
  asserts every `SIGILS_DEF` key has one.

### Dissonance (1390-1436)

```js
const DISS_STAGES=[
 {at:0,   n:'Quiet',      d:'The world has not noticed.'},
 {at:20,  n:'Stirring',   d:'Enemies find you faster. Something is paying attention.'},
 {at:45,  n:'Bleeding',   d:'Creatures from other depths appear where they should not.'},
 {at:70,  n:'Unstable',   d:'The rock forgets its shape. Chunks re-form as you pass.'},
 {at:100, n:'Unwritten',  d:'It knows your name now. The way out is open.'},
];
```

`DISSONANCE` caps at **140** (`addDissonance`), resets to 0 each `newRun`, and leaks into the
world through exactly three stated channels:

| channel | formula | cap | consumed at |
|---|---|---|---|
| `dissSpeed()` | `1+min(0.5,DISSONANCE/200)` | ≤1.5 | enemy chase speed multiplier (3058) |
| `dissBleed()` | `≥45: min(0.45,(D-45)/160)` else 0 | ≤0.45 | `spawnFromChunks` (2909): non-boss spawns are substituted with a random non-boss type from a random band's roster, stats and all |
| `dissChurn()` | `≥70: min(0.6,(D-70)/120)` else 0 | ≤0.6 | main loop sweep (4877): every ~2s, with probability churn, delete one cached chunk **outside** the 5×5 around the player so it regenerates |

Stage-up fires a toast/flash/shake and `discover('diss',stage.n)`. Suite-9 §5 asserts stage
ordering, reachability of all five, the exact on/off thresholds of the three channels, their
caps, the 140 cap, and clean reset on `newRun`.

### reweave(strand,newSeed) (1403) — the one rewrite path

`WEAVE[strand]=newSeed>>>0; WOVEN++; bTick('weave')` (bounty tick — "Rewrite a strand"), then:
terrain → `calibrateAir()`; all cached chunks **except the 3×3 around the player** are either
deleted (structural strands `terrain`/`boss` — tiles must regenerate) or get
`spawned=false; spawns=genChunk(...).spawns` (content strands); `poi` → `CHESTS`/`SHRINES`
cleared; terrain → `VENTS` cleared; `spawn`/`boss` → live enemies further than 420 px despawn;
shake+flash+sfx; `MM=null` (minimap forgotten). Never dissolves the floor underfoot — suite-9
§3 asserts the occupied chunk and the ground directly below the player survive.

### The escape — the current endgame code path, end to end

1. **Gate** (1436): `canEscape() = DISSONANCE>=100 && Object.keys(META.bosses).length>=3`.
   `META.bosses` is **meta-persistent** (one key per distinct boss *type* ever felled, written
   in the boss-death path 2798-2805) — so the boss requirement spans all runs; the dissonance
   requirement is this run only. Suite-9 §6 asserts all four truth-table corners.
2. **Surface**: pause menu → THE LATTICE (`openLattice`, 3713) shows master glyph
   `seedGlyph(SEED)`, the six strand glyphs, sigils carried, `WOVEN`, and the dissonance bar.
   When `canEscape()` it appends the gold button `THE WAY OUT — the world is thin enough`;
   when `DISSONANCE>=100` but bosses <3 it shows the "not felled enough of its wardens" line.
3. **Confirm** (`openEscape`, 3789): modal panel, lore, `REWRITE THE WORLD` → `doEscape()` or
   `NOT YET` → back.
4. **`doEscape()`** (3805) — the run's win ending, in order:
   - `META.escapes++` — each escape opens one more Echo rung (`META.maxEcho=max(maxEcho,escapes)`;
     the ladder past Threat V, unbounded by design).
   - Payout `META.shards += Math.round(400+DISSONANCE*6)`.
   - `META.maxThreat=Math.min(THREATS.length-1,(META.maxThreat||0)+1)`.
   - `discover('frag','escape',true)` — the lore fragment with `depth:-1` ("What you wrote",
     line 1286), earnable only this way (suite-9 asserts it is written and `depth<0`).
   - `saveMeta()`, celebration FX, then a modal summary (depth, strands rewritten, dissonance,
     shards, threat ceiling) whose only button is `DESCEND AGAIN → newRun()`.
5. `newRun()` re-seeds everything: new `SEED`, `deriveWeave`, `calibrateAir`, dissonance/sigils/
   WOVEN cleared, chunks cleared.

**Hook points for a final boss / multiple endings**: the gate is `canEscape()`; the arena/entity
would live on the `boss` strand (arenas + occupants are its charter, and suite-14 deliberately
exempts `boss` from the rock-ownership fingerprint, so a boss-strand arena may shape rock);
the ending fork is `doEscape()` (currently unconditional); persistent outcome state goes in
`META` (bump `SAVE_VER` + extend `migrate()` — rule 2); suite-9 §6 pins the current gate and
payout behaviour and would need extending, not breaking.

---

## 8. Anchors and camp placement

- **Camp** is the surface strip around `CAMP_X=800`: `nearCamp()` (3988) is true within 7 tiles
  of CAMP_X while above `SURFACE+4`, **or** within 90 px of the current `ANCHOR`. Near camp:
  +12 hp/s regen (4869), The Weight resets (3387), forge heat suspended (3437), camp button/menu
  available.
- **Setting**: first time a run's player enters a band, `upPlayer` (3457) does
  `META.anchors[bn]=1; saveMeta()` and toasts `ANCHOR SET`. `loadMeta` guarantees
  `META.anchors.surface=1` and resets `META.startBiome` to `'surface'` if its anchor is missing.
- **Choosing**: Camp → `DESCEND FROM` (`openAnchors`, 4056) lists `BIOMES` names with
  `META.anchors[n]` set, showing `~(biomeTop(n)-SURFACE)m`; `setAnchor(n)` writes
  `META.startBiome` and saves.
- **Spawning** (`startRun`→`newRun` tail, 3532-3538): surface start = on the terrain at CAMP_X.
  Anchor start = at `(CAMP_X, biomeTop(sb)+6)`: carves a pocket by hand with `setTile` — air
  for x±6, y−4…+2, a stone (tile 2) floor row at y+3 — sets `ANCHOR={x,y}` (which makes the
  spot a safe zone) and places the player on the floor. This is the one sanctioned direct
  `setTile` terrain edit (placement, not digging).
- Suite-4 asserts: anchors set on reaching caves/fungal; `biomeTop` returns band starts (the
  hard-coded 70/400); anchor spawn is not inside rock; anchor pocket heals and counts as camp;
  picker persists; surface start returns to camp; meta round-trips anchors+loadout.

---

## 9. Helper-function contracts (quick reference)

| function | signature → returns | contract |
|---|---|---|
| `biomeAt(ty)` | tile-Y → BIOMES row | first row with `ty<b[0]`; below the world → last row |
| `biomeName(ty)` | tile-Y → name string | `biomeAt(ty)[1]` |
| `biomeTop(name)` | name → tile-Y of band start | previous row's bound, min SURFACE |
| `calibrateAir()` | → `AIRCAL` map name→threshold | −1 = never carve; MUST re-run after `WEAVE.terrain` or band-table changes |
| `hashS(strand,x,y)` | → float [0,1) | deterministic in (strand seed, x, y); the only sanctioned generator randomness besides `rS`/`cS` |
| `noiseS(strand,x,y)` / `noise2(x,y)` | → float ~[0,1) | 2-octave value noise; `noise2` is terrain-strand |
| `rS(st,a,b)` / `cS(st,p)` | int in [a,b] / bool | per-strand per-chunk streams inside `genChunk` only; draw order is part of the world definition |
| `seedGlyph(v)` / `glyphSeed(g)` | uint32 → 6-char string / string → uint32 | round-trips the low 30 bits; case-insensitive parse; junk→0 |
| `deriveWeave(master)` | → WEAVE | resets `WEAVE_LOCK`; deterministic |
| `reweave(strand,newSeed)` | → true | see §7; the ONLY correct way to change a live strand |
| `addDissonance(n)` | — | cap 140; fires stage-up FX + codex |
| `canEscape()` | → bool | `DISSONANCE>=100 && ≥3 distinct META.bosses` |
| `genChunk(cx,cy)` | → `{tiles,cv:null,dirty:true,spawned:false,spawns}` | pure given WEAVE+tables; never touch the global `RNG` inside it |
| `getChunk` / `getTile` / `setTile` | lazy gen; OOB getTile=3 | `setTile` marks dirty; never use it to dig (rule 3) |
| `carve(px,py,radius,maxHard,dropOre)` | → tiles removed | hardness gate, ore drops, bedrock guard — the one dig path |
| `addHaz(x,y,r,t,dmg,st,col,friendly,kind)` | — | cap 64; ticks every 0.35 s; rule 19 |
| `enemyCost(ty)` | → float ≥0.5 | budget price; override with an explicit `cost` field on the ENEMIES row |
| `discover(kind,id,quiet)` | → bool (first time) | kinds: en/item/biome/frag/cls/sigil/diss; writes META.seen |
| `nearCamp()` | → bool | camp strip or 90 px of ANCHOR |

---

## 10. Test constraints on this content — exact numbers

### Suite 9 (`test/suite-9.js`) — the Lattice

**The fingerprint** (`fingerprint()`, lines 22-41): over chunks `cx∈[14,18) × cy∈[14,20)`
(24 chunks, caves/fungal depth), sampling every 7th tile index:
`F.terrain` = count of `v!==0` (solidity — ore counts as terrain because it **replaces** rock),
`F.ore` = count of `v===8`, and over `chunk.spawns`: chest/shrine→`F.poi`, boss types→`F.boss`,
everything else→`F.spawn`. Assertions: for each target in `ore, poi, spawn` — rerolling it
changes its own count, leaves `terrain` identical, leaves every other non-terrain count
identical; rerolling `terrain` changes `terrain`.

Also asserted, with exact numbers: glyphs always 6 symbols; 30-bit round-trip; lower-case parse;
junk→0; alphabet excludes `O I 0 1`, no duplicates. Reweave: occupied chunk survives, ground
under player unchanged, `CHUNKS.size` does not grow, `WOVEN>0`, poi rewrite empties `CHESTS`.
Sigils: all fields present, all have `LORE.sigil` entries, consumption/refund semantics per
sigil, dissonance rises by the exact `diss` of the sigil used, `graft.diss > reroll.diss`.
Dissonance: stages strictly ascending, all 5 reachable, channels off at 0 / speed>1 at 30 /
bleed>0 at 60 / churn>0 at 90, caps `speed≤1.5, bleed≤0.45, churn≤0.6`, total cap ≤140,
clean at newRun. Escape: full gate truth table; escaping increments `escapes`, pays shards,
raises `maxThreat`, writes the `escape` fragment, and that fragment has `depth<0`.
Integration: 2400 frames at dissonance 110 with a reweave every 300 frames → no NaN in
`P.x/y/vx/vy/hp/fuel/focus/DISSONANCE`; caps `EN≤121, PROJ≤221, PART≤351`; `CHUNKS.size<4000`;
**a zeroed strand still generates a legal world**: `tiles.length===CHUNK*CHUNK` and every spawn
type is `'chest'|'shrine'|ENEMIES key` for chunk (20,30) — note `'vent'` is not whitelisted
there; it only passes because chunk (20,30) is in the ruins.

### Suite 14 (`test/suite-14.js`) — the descent arc

**Sampling rule** (`airOf`): 18 windows of 30×30 tiles, stepped 34 tiles apart in x starting at
tx=480 and staggered diagonally down the band — i.e. a band is measured across **hundreds of
tiles of width and height**, never one 40-tile window ("one large cavern reads as 100% air").

- Every band with declared air lands within **±0.13** of it (±0.15 for the re-solved-world
  check on caves).
- Ordering: `caves<0.55`; `fungal>caves`; `ruins<fungal`; `forge<ruins`; `abyss>forge`;
  `abyss>fungal`; the sequence changes direction ≥2 times ("an arc, not a ramp").
- Calibration: `AIRCAL` has one entry per BIOMES row; `AIRCAL.caves!==AIRCAL.abyss`; rerolling
  `WEAVE.terrain` + `calibrateAir()` moves ≥1 threshold and the new world still hits target;
  `AIRCAL.surface===-1`.
- Rooms: `ROOMS.length>=5`; rectangular; alphabet exactly `#.=`; `w<CHUNK-1 && h<CHUNK-1`;
  ruins stamp rate >25% of sampled chunks; `BSHAPE.caves.rooms===undefined`; some stamped chunk
  has both >200 air and >200 solid tiles.
- Vents: `fungal.vent==='spore' && forge.vent==='flame'`; caves/ruins declare none; vents
  generate in the Bloom; an emitted hazard has `friendly===0`; 60 s of venting stays
  `≤HAZ_MAX` (64); a vent 5000 px away emits nothing.
- Band identity: after 90 frames of hovering, forge fuel < ruins fuel − 5; grounded refill in
  the forge still positive; `forge.heat>0 && !ruins.heat`; `abyss.dark>1 && !caves.dark`;
  **every carved band** has `heat||dark||vent||rooms` or `|ax-ay|>0.2`.
- Strand ownership: positional solidity hash over chunks cx 7-12 × cy 22-26 is **bit-identical**
  under `poi`/`spawn`/`flux` rerolls and changes under `terrain` (`boss` deliberately exempt);
  vent-position print over cx 7-15 × cy 10-17 (the Bloom) identical under `poi` reroll, changed
  under `terrain`.
- Traversability: every carved band has >200 standing spots (air above solid) in a 400×120-tile
  block at band middle (tx 480-880); no fully-sealed chunk anywhere in cx 6-26, cy 12-60.

### Other suites that constrain world content

- Suite 3: `TILES[5].hard>0`; chests, shrines and minibosses must generate; caps hold.
- Suite 4: `TILES[10].hard===0`; secret walls generate; anchors (incl. hard-coded
  `biomeTop('fungal')===400`, `biomeTop('caves')===70`); anchor pocket carved/safe/persists.
- Suite 8: every BIOMES name in `LORE.biome`; every roster sprite ≥3:1 contrast on its band's
  ground tile colour (2.4:1 lit); no two enemies in a band share a top shape.
- Suite 11: roster role rules (§2 above); encounter composition (≤1 support per chunk,
  ≤8 bodies, packs spawn as groups, spawn positions identical when `poi` is rerolled).

---

## 11. Registration checklists — every place a new id must appear

**New biome band**
1. `BIOMES` row (position sets its depth slot; keep bounds ascending, last = `WORLD_H`; update
   the neighbour's bound). 2. `BSHAPE[name]` with `air/ax/ay/n` + ≥1 identity field (or
   anisotropy >0.2) — suite-14 fails otherwise. 3. Ground tile in `TILES` (new one must pass
   suite-8 contrast vs every roster sprite + the player). 4. Roster of existing/new `ENEMIES`
   keys satisfying suite-11 (≥3 types, 3× toughness spread, a shooter, ≥3 roles).
5. `BIOME_BOSS[name]` if the band should have arenas (and the boss enemy + its sigil-drop
   behaviour come free). 6. `LORE.biome[name]={n,d}` (suite-8). 7. Re-check suite-4's
   hard-coded `biomeTop` literals if any existing bound moved, and suite-14's arc-ordering
   asserts (they name bands explicitly). 8. `calibrateAir()` needs no edit — it iterates BIOMES.

**New room template** — append to `ROOMS` (rect, `#.=`, ≤45×45), run suite 14. Nothing else.

**New vent kind / band mechanic** — field in `BSHAPE`, one consumption site (`upVents` branch
for vents), suite-14-style asserts. Generator passes vent kinds through untouched.

**New sigil** — `SIGILS_DEF[id]` (`n,d,diss>0,col`) + a behaviour branch in `useSigil` +
`LORE.sigil[id]` prose. Drop pools are `Object.keys(SIGILS_DEF)` — automatic. Keep `graft` the
most expensive or update suite-9's "authorship costs more than vandalism".

**New tile** — `TILES[id]` (id ≤255, unique); decide `hard` (0=any weapon, 1=digger, 2=deep
digger, 9=never); if a biome ground, see suite-8 contrast; if ore-like set `ore:1` and the
carve drop is automatic.

**New POI** — copy an existing stamp in `genChunk`: gate with `hashS(<strand>, cx*P1+K1, cy*P2+K2) < density`
using fresh small primes; geometry (if any) from `terrain` draws; contents from `poi` draws;
spawn record type either `'chest'`/`'shrine'`/`'vent'` or a new type handled in
`spawnFromChunks`; append draws **after** existing ones of the same strand to avoid reshuffling
every chunk; extend suite-9's fingerprint classifier if the new spawn type is neither
chest/shrine/boss/enemy, or its legality check will flag it.
