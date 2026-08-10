# SHARDFALL — SPRITE / ART LAYER REFERENCE

Ground truth extracted 2026-08-10 from `/workspaces/Sweet-Spot/shardfall/index.html` (the
`// ============ SPRITES ============` section, lines ~281–525, plus the render code at
~4485–4780) and `/workspaces/Sweet-Spot/shardfall/test/suite-8.js` (§6c "THE VISUAL LAWS",
lines ~488–587). Every number below was measured against the live tables with the same code
suite-8 runs, not copied from a design doc. Line numbers are approximate (the file moves);
banner comments do not.

This is the contract for adding a creature's art. Follow it and suite-8 passes on first run
(`./test/run.sh 8`).

---

## 1. Where the art lives, and the one law above all others

CLAUDE.md rule 13: **"Sprites are data."** A creature is a character grid in the `SPR` table
indexing a palette ramp, baked ONCE into an offscreen canvas at load. There are no asset
files, no sprite sheet, no build step. Adding art = adding a table entry. Rule 4 applies: if
you find yourself writing per-creature drawing code, the table is missing a field.

Order of declarations inside the single `<script>` block (all in the DATA TABLES section):

| what | identifier | approx line |
|---|---|---|
| palette ramps | `RAMPS` | 289 |
| accent colors | `ACC` | 302 |
| outline color | `OUTLINE` | 303 |
| char→color resolver | `palOf(r)` | 304 |
| sprite grids | `SPR` | 312 |
| bake target + baker | `BAKED`, `bakeSprites()` | 515 |
| terrain colors (contrast grounds) | `TILES` | 527 |
| biome rosters (law scope) | `BIOMES` | 585 |
| enemy stat table (keys, boxes) | `ENEMIES` | 869 |
| status tint colors | `STATUS` | 966 |
| enemy size at spawn | `mkEnemy()` | 2919 |
| render entry points | `SPRITES_ON`, `drawEntity`, `tintedSprite`, `drawEntityTinted` | 4496–4532 |
| enemy draw loop (frame selection, swell, tints) | inside `render()` | 4692–4746 |
| player draw (keypose selection) | inside `render()` | 4760–4780 |
| the one `bakeSprites()` call | INIT | 4958 |

---

## 2. RAMPS — the palettes

Verbatim from the file:

```js
const RAMPS={
 stone: ['#9aa3b0','#6f7889','#4e5666','#353b47','#22262e'],
 dirt:  ['#b08a5e','#8a6743','#654a30','#46331f','#2b1f13'],
 flesh: ['#d98d6a','#b06a4c','#854b34','#5c3323','#382016'],
 fungal:['#c39ae0','#9a72bd','#71508f','#4d3563','#2f2040'],
 forge: ['#f0a05a','#c9743a','#97502a','#66351c','#3d1f10'],
 void:  ['#a89af0','#7c6cc9','#574a97','#383066','#211c3d'],
 bone:  ['#bfb595','#9c9276','#746b55','#4f4839','#2e2a21'],
 rot:   ['#a8c07a','#7f9455','#5c6b3b','#3e4726','#252b15'],
 // RESERVED — the player only. Nothing else may use this ramp, which is the whole reason the
 // eye finds you instantly in a dark, busy, destructible world.
 hero:  ['#f4ecd8','#cfc4a8','#a1957a','#6d6350','#3d3830'],
};
const ACC={shard:'#3fc9c1',bright:'#bffffb',gold:'#d8a53f',blood:'#e05555',ember:'#ff8a3f'};
const OUTLINE='#14141c';   // near-black, never pure black — pure black reads as a hole
```

Rules encoded here:

- **Every ramp is exactly 5 hexes, light → dark** (index 0 lightest). Suite-8 asserts
  `length === 5` and **strictly decreasing WCAG luminance** at every step ("every ramp is 5
  steps and monotonically darkens"). Two adjacent steps with equal luminance FAIL.
- **Warm-to-cool rule** (comment in the file): "Hue rotates warm-to-cool as value drops,
  which is what stops a ramp reading as one colour at five brightnesses." This is a
  convention, not machine-tested — follow it anyway when adding a ramp: shift hue slightly
  toward blue/purple as the steps darken (look at `forge`: orange `#f0a05a` → deep
  red-brown `#3d1f10`; `stone`: blue-grey throughout but cooler/darker).
- **`hero` is RESERVED for the player.** No enemy sprite may set `r:'hero'`. Nothing
  enforces the string directly, but Law 1 (below) enforces the consequence: no other ramp
  may even approach hero's brightness.
- **Light comes from the TOP-LEFT in every sprite** (file comment). Put the '1'/'2' steps
  top-left, '4'/'5' bottom-right.
- `OUTLINE` (`#14141c`) is what the `o` character paints. Near-black on purpose.

Accents (`ACC`) and their in-use meanings, with measured WCAG luminance:

| char | ACC key | hex | luminance | conventional use in existing sprites |
|---|---|---|---|---|
| `S` | shard | `#3fc9c1` | 0.4668 | shard/crystal motifs: player's lamp, rockling's embedded ore, voidspawn core, warder's ward panel, sporemother's cap, voidmaw's maw rings |
| `B` | bright | `#bffffb` | 0.8956 | the hottest highlight: player's lamp core, ember's furnace mouth, chanter's floating motes, warder core, boss cores |
| `G` | gold | `#d8a53f` | 0.4187 | archer's bow and trim, warden's eyes |
| `R` | blood | `#e05555` | 0.2300 | eyes/menace: brute, delvemite, burrower, stalker markings, voidmaw's throat |
| `E` | ember | `#ff8a3f` | 0.3980 | fire: ember's core, smith's forge marks, mortar's fuse, forgelord's brazier |

**Accent gotcha:** Law 1 measures only `RAMPS[k][0]` — accents are exempt. `B` (0.8956) is
in fact *brighter* than the hero ramp's top step (0.8418). The comment "the shard-lamp is
the only pure highlight in the game" is a discipline, not a test: keep `B` to a few pixels
(existing sprites use 2–6 `B` cells), or you will defeat the player-findability law the
tests cannot see you defeating.

`palOf(r)` — the resolver the baker uses:

```js
function palOf(r){const c=RAMPS[r]||RAMPS.stone;
 return {'1':c[0],'2':c[1],'3':c[2],'4':c[3],'5':c[4],'o':OUTLINE,
  'S':ACC.shard,'B':ACC.bright,'G':ACC.gold,'R':ACC.blood,'E':ACC.ember}}
```

Contract: `palOf(rampName) -> {char: hexColor}`. An unknown ramp name silently falls back
to `stone` at bake time — but suite-8 fails first ("every sprite uses only palette
characters" also checks `RAMPS[SPR[k].r]` exists), so never rely on the fallback.

---

## 3. The SPR format — exactly

One entry per creature, keyed by the **same key as its `ENEMIES` row** (plus the special
key `player`):

```
SPR[key] = { r: <rampName>, f: [ frame, frame, ... ] }
```

- `r` — string, must be a key of `RAMPS`. This is the creature's entire palette.
- `f` — array of frames. Each **frame is an array of strings, one string per pixel ROW**,
  top row first. Each **character is one pixel**, indexing `palOf(r)`:

| char | paints | notes |
|---|---|---|
| `.` | nothing (transparent) | the normal empty cell |
| ` ` (space) | nothing (transparent) | legal, used mid-row in existing art as a subtle gap; renders identically to `.` |
| `o` | `OUTLINE` `#14141c` | the silhouette ring |
| `1`–`5` | ramp steps 0–4 (`1` = lightest) | the body |
| `S B G R E` | accents (see §2) | few pixels each |

Any other character is illegal — suite-8: *"every sprite uses only palette characters"*,
legal set exactly `['.', ' ', 'o', '1','2','3','4','5', 'S','B','G','R','E']`.

**Every row in a frame must be the same length** (the frame is a rectangle). Suite-8:
*"every sprite frame is rectangular"* — it compares every row's length against row 0's.
Frames within one sprite are all the same size in practice (the baker doesn't require it,
but the renderer anchors each frame independently, so mismatched frame sizes make the
creature jump; don't do it).

**Grid size convention:** the grid is authored at roughly the creature's hitbox size in
pixels (`ENEMIES[key].w × h` — see §7). It is drawn 1:1, never scaled to the box.

**Facing convention:** author the sprite facing **RIGHT** (= `face`/`dir` +1). The renderer
mirrors it in place for `face < 0` (`translate(px*2,0); scale(-1,1)`). The player's lamp
(`S`/`B` cells on the right edge) and archer's bow (right-side `G` column) are the models.

**Anchor convention:** the baked frame's **bottom edge is glued to the bottom of the hitbox**,
horizontally centered (`dy = round(y + h/2 - c.height)`, `dx = round(x) - (width>>1)`).
Consequences you design with:

- A grid **taller than the box** pokes out the top (player: 22-row grid on a 20px box).
- A grid **wider than the box** pokes out both sides (bat: 16 wide on a 12px box).
- **Trailing all-`.` rows are the hover mechanism.** Blank bottom rows are baked as
  transparent pixels, so the visible body ends above the hitbox floor — that is how
  floaters get their "visible gap under it" (wraith: 2 blank bottom rows; voidspawn: 4;
  voidmaw: 7). A walker's feet should be in (or within 1px of) the last grid row.

### Frame keys — what each index MEANS

There are no named frame keys (no idle/walk/attack/hit/death slots). Frame meaning is
positional, fixed by one line in the enemy render loop:

```js
const anim=(e.act>0)?2:(winding?1:((perf*4+e.x)|0));
```

…and `drawEntity` applies `(frame|0) % set.length`. So:

| frames authored | walking/idle | windup (the tell) | active (strike) |
|---|---|---|---|
| **1** (bosses, voidling) | `f[0]` | `f[0]` | `f[0]` |
| **2** (every other enemy — the standard) | alternates `f[0]`/`f[1]` at 4 Hz, phase-offset per entity by `e.x` | `f[1]` | `f[0]` (2 % 2) |
| **3** (none shipped for enemies) | cycles `f[0]`→`f[1]`→`f[2]` at 4 Hz | `f[1]` | `f[2]` |

The **standard enemy is 2 frames**: `f[0]` = neutral pose, `f[1]` = the stride pose, which
**doubles as the windup pose**. Existing art varies only the legs/lowest rows between the
two frames (compare crawler's frames below) — keep the top two rows IDENTICAL across
frames, both because the silhouette must not flicker and because Law 3 fingerprints only
`f[0]` (see §6).

The **player is 3 frames** and uses its own selector
(`const pf=!P.onG?2:(Math.abs(P.vx)>18?((perf*9)|0)%2?1:0:0);` — file comment: "0 idle,
1 stride, 2 airborne — three keyposes, per the animation budget"). Stride alternates 0/1 at
~4.5 Hz while grounded and moving; airborne always shows `f[2]`.

There are **no hit or death frames** (see §9 — hit is a tint overlay, death is a particle
burst).

### Verbatim sample entries

The standard 2-frame grunt (beast family: horned top, four legs; 14×12 grid on a 14×12
box) — copied character-for-character:

```js
 crawler:{r:'flesh',f:[[
  '..o..oooo..o..','.o1oo1221oo1o.','o112233443221o','o12o3344433o1o',
  'o12oo344oo3o1o','o122334443321o','.o1233444321o.','.oo23344432oo.',
  'o2o.o4oo4o.o2o','o..oo3..3oo..o','....o....o....','..............'],[
  '..o..oooo..o..','.o1oo1221oo1o.','o112233443221o','o12o3344433o1o',
  'o12oo344oo3o1o','o122334443321o','.o1233444321o.','.oo23344432oo.',
  '.o2oo4oo4oo2o.','o..o3o..o3o..o','..oo......oo..','..............']]},
```

The smallest 2-frame sprite in the game (9×8 grid, 9×8 box, one `R` accent eye):

```js
 delvemite:{r:'dirt',f:[[
  '...oo....','..o11o...','.o1221o..','o122331o.','o12R331o.','.o12331o.','.oo1o1oo.','..o...o..'],[
  '...oo....','..o11o...','.o1221o..','o122331o.','o12R331o.','.o12331o.','.o1oo1o..','.o.....o.']]},
```

A single-frame sprite (legal — the modulo handles it; voidling never gets a walk cycle,
windup pose, or strike pose, only this):

```js
 voidling:{r:'void',f:[[
  '.o..oo..o.','o1oo1221o1','o1122S3221','o122SS3321',
  'o12233 321','.o1233 21o','.oo1 32oo.','o2o.oo.o2o',
  '..oo..oo..','..........']]},
```

Note in voidling: mid-row **spaces** used as texture gaps, and one trailing blank row
(feet ride 1px above the box floor). Boss entries (warden, sentinel, forgelord, voidmaw,
sporemother) are the same format with one frame, written as one long line each in the file.

---

## 4. The baker

Verbatim:

```js
const BAKED={};
function bakeSprites(){
 for(const name in SPR){const S=SPR[name],pal=palOf(S.r);
  BAKED[name]=S.f.map(rows=>{
   const w=rows[0].length,h=rows.length;
   const c=document.createElement('canvas');c.width=w;c.height=h;
   const g=c.getContext('2d');
   for(let y=0;y<h;y++){const row=rows[y];
    for(let x=0;x<row.length;x++){const ch=row[x];if(ch==='.'||ch===' ')continue;
     const col=pal[ch];if(!col)continue;g.fillStyle=col;g.fillRect(x,y,1,1)}}
   return c})}}
```

- Contract: `bakeSprites()` fills `BAKED[name] = [canvas, canvas, ...]`, one 1px-per-cell
  offscreen canvas per frame. Canvas dimensions come from **row 0's length × row count**.
- **Runs exactly once**, in INIT (line ~4958), before the first frame and before `newRun()`.
  Nothing rebakes at runtime. If you live-edit `SPR` in the console you must call
  `bakeSprites()` yourself AND clear the `TINTED` cache (`for(const k in TINTED)delete TINTED[k]`)
  or flashes will show stale art.
- Unknown characters are silently skipped at bake time (`if(!col)continue`) — the machine
  check for them is suite-8, not the baker.
- `TINTED` — a lazy cache of single-color masked copies (`tintedSprite(kind,fr,col)`,
  built with `source-in` compositing), keyed `kind|frame|color`. Used for hit flashes and
  status tints so the silhouette survives instead of becoming a colored rectangle. You never
  touch it when adding art; it derives everything from `BAKED`.

---

## 5. drawEntity and its rect fallback

The only two render entry points that touch sprites (call sites: the enemy loop and the
player; sentries/decoys/projectiles draw their own primitives):

```js
let SPRITES_ON=true;
function drawEntity(g,kind,x,y,w,h,col,face,frame){
 const set=SPRITES_ON&&BAKED[kind];
 if(set&&set.length){
  const c=set[(frame|0)%set.length];
  const px=Math.round(x), dy=Math.round(y+h/2-c.height), dx=px-(c.width>>1);
  g.save();
  if(face<0){g.translate(px*2,0);g.scale(-1,1)}
  g.drawImage(c,dx,dy);
  g.restore();
  return true}
 g.fillStyle=col;g.fillRect(Math.round(x-w/2),Math.round(y-h/2),w,h);return false}
```

Contract:

- `(x, y)` is the **center** of the entity's hitbox; `w,h` the hitbox dims; `col` the
  fallback fill; `face` ±1; `frame` any int (wrapped by `% set.length`).
- Returns `true` if a baked sprite was blitted, `false` if it fell back to the flat rect.
- **The sprite blits at its own pixel size** — "a sprite scaled to a hitbox stops being
  pixel art" (file comment). Only the windup swell ever scales it (a canvas transform
  around the bottom-center, in the enemy loop).
- **Fallback:** any `kind` with no `BAKED` entry draws `col`-filled `w×h` rect. The enemy
  loop then adds a 3×3 black "eye" at `x + dir*w/4`. This is deliberate (CLAUDE.md: "All
  visuals go through `drawEntity()`, which falls back to flat rects when no sprite atlas is
  loaded. Keep it that way") — the game must keep rendering with a half-drawn roster.
  BUT: suite-8 no longer permits a missing enemy sprite (§6, "coverage"), so the fallback
  is a safety net, not an option for shipped content.
- `SPRITES_ON` is a debug switch (never toggled by any code or setting); set it false in
  the console to see the rect layer.

`drawEntityTinted(g,kind,x,y,h,face,frame,col,alpha) -> bool` — same anchoring, draws the
cached single-color copy at `alpha`. Returns false when no baked set exists (rect path
tints itself with a translucent rect instead).

What the enemy loop layers on top of the base blit (you do NOT draw these; know they exist
so you don't bake them in):

- **Windup**: sprite swells to ×1.28 over the windup (`s=1+t*0.28`), scaled about the
  bottom-center so the feet stay planted; strobing tint overlay `#ffffff`/`#ffd9b0` at
  22 Hz, alpha 0.65; red ground marker fills to `atkReach()`.
- **Active frames**: solid white tint overlay, alpha 0.9.
- **Hit flash** (`e.flash>0`): same warm tint overlay.
- **Status**: first active status only, `STATUS[k].c` at alpha 0.38 (burn `#e07a3f`,
  bleed `#e05555`, chill `#9fd0ff`, shock `#e6d34a`).
- **Spent (recovery)**: sprite is NOT sagged (only the rect path sags to 0.9h); a pale
  tick `#ffe9a0d0` draws above the head for the whole window.
- **Contact shadow**: black alpha-0.35 bar, `e.w*0.76` wide, at the box floor — "it is
  what stops entities floating". Your sprite does not need baked-in ground shading.
- **Elite**: 1px `#ffffff70` lines across the top and bottom of the box. **Elites do not
  recolor or rescale the sprite** — `mkEnemy` scales the *hitbox* ×1.15 and swaps `e.c`
  (rect/burst color) to the elite's color, but the baked art is untouched.
- **Player only**: invuln blink at 10 Hz, white tint at alpha 0.5 while `P.inv>0.45`.

---

## 6. THE THREE VISUAL LAWS — exactly as suite-8 enforces them

All in `test/suite-8.js` §6c. Measurement primitives (verbatim semantics):

- **Luminance** = WCAG relative luminance: per channel `v = c/255`, then
  `v <= 0.03928 ? v/12.92 : ((v+0.055)/1.055)^2.4`, then
  `L = 0.2126 R + 0.7152 G + 0.0722 B`.
- **Contrast ratio** = `(Lmax + 0.05) / (Lmin + 0.05)`.
- **Lit ground** = each RGB channel `min(255, round(c * 1.18))` — the tile's edge highlight.

### LAW 1 — nothing approaches the player's ramp in luminance

Asserted (two parts):
1. *"no ramp approaches the player ramp in luminance"* — for every ramp except `hero`:
   `lum(RAMPS[k][0]) <= lum(RAMPS.hero[0]) * 0.65`. Measured: `heroLum = 0.8418`, so the
   **hard cap on any other ramp's lightest step is 0.5472**.
2. *"the player ramp is the brightest in the game"* — strictly `< heroLum` for all others.

Current headroom: the brightest non-hero ramps are `rot` (0.4743) and `bone` (0.4629) —
0.07–0.08 under the cap. **A new ramp's step-0 must land under 0.5472**; stay ≤ ~0.47 to
match the existing family. Only `RAMPS[k][0]` is measured; deeper steps are covered by the
monotonic-darkening assert.

### LAW 2 — every actor clears 3:1 against the ground it actually stands on

Asserted: *"every actor clears 3:1 against the ground it stands on"* and *"and 2.4:1
against its lit tile edge"*.

- Only **`RAMPS[sprite.r][0]`** (the ramp's lightest step) is measured, against the
  **biome's ground tile color** `TILES[BIOMES[i][2]].c`.
- Thresholds: ratio **≥ 3.00** vs base ground (fails on `< 3`), **≥ 2.40** vs lit ground
  (×1.18). WCAG 1.4.11 non-text contrast is the cited basis.
- **Scope:** the player (`hero`) is checked against ALL six grounds; an enemy is checked
  **only against the biomes whose `BIOMES[i][4]` roster contains it**. Bosses and
  voidling are in no roster, so they skip Law 2 (and Law 3) entirely.
- Ore (`TILES[8]`) and secret walls (`TILES[10]`) are accent tiles, excluded by design.

The grounds:

| biome | ground tile | hex | lit hex |
|---|---|---|---|
| surface | 1 (dirt) | `#54381f` | `#634225` |
| caves | 2 (stone) | `#41464e` | `#4d535c` |
| fungal | 4 (fungus) | `#42335c` | `#4e3c6d` |
| ruins | 5 (ruin brick) | `#544a3a` | `#635744` |
| forge | 6 (forge stone) | `#4e2a22` | `#5c3228` |
| abyss | 7 (abyss stone) | `#241f2e` | `#2a2536` |

**The full measured matrix** (ratio vs base / vs lit, per ramp step 0 — design from this
table; a cell below 3.00/2.40 means that ramp is BANNED for enemies rostered in that biome):

| ramp | surface | caves | fungal | ruins | forge | abyss |
|---|---|---|---|---|---|---|
| stone | 4.20/3.53 | 3.73/3.04 | 4.43/3.76 | 3.41/2.77 | 4.91/4.24 | 6.29/5.82 |
| dirt | 3.39/2.84 | **3.00/2.45** | 3.57/3.03 | **2.75/2.23 ✗** | 3.96/3.42 | 5.07/4.69 |
| flesh | 4.06/3.41 | 3.60/2.94 | 4.28/3.64 | 3.30/2.68 | 4.75/4.10 | 6.08/5.63 |
| fungal | 4.60/3.86 | 4.08/3.33 | 4.85/4.12 | 3.73/3.03 | 5.37/4.64 | 6.88/6.37 |
| forge | 5.04/4.23 | 4.47/3.65 | 5.31/4.51 | 4.09/3.32 | 5.89/5.09 | 7.54/6.98 |
| void | 4.35/3.66 | 3.87/3.16 | 4.60/3.90 | 3.53/2.87 | 5.09/4.40 | 6.52/6.03 |
| bone | 5.23/4.39 | 4.64/3.79 | 5.52/4.68 | 4.24/3.45 | 6.11/5.28 | 7.83/7.24 |
| rot | 5.34/4.49 | 4.74/3.87 | 5.64/4.79 | 4.34/3.52 | 6.25/5.40 | 8.00/7.40 |
| hero | 9.09/7.63 | 8.07/6.59 | 9.59/8.14 | 7.38/5.99 | 10.63/9.18 | 13.61/12.59 |

Read it before choosing a ramp: **`dirt` FAILS ruins (2.75/2.23) and passes caves by
0.00/0.05** — the delvemite (dirt, caves+fungal roster) sits exactly on the 3.00 edge in
caves. A new caves enemy on the `dirt` ramp is one ground-tile retune away from a suite
failure; prefer another ramp, or accept the fragility knowingly. Every other ramp clears
every biome. Ruins (`#544a3a`, the lightest ground) is the binding constraint overall.

### LAW 3 — no two enemies in a biome share a top shape

Asserted: *"no two enemies in a biome share a top shape"*. Method, exactly:

```js
const top = sp.f[0].slice(0,2).join('|').replace(/[1-5SBGRE]/g, '#');
```

i.e. **frame 0's top TWO rows**, joined with `|`, with every body/accent char collapsed to
`#` — but `o`, `.` and ` ` kept distinct. Within each `BIOMES[i][4]` roster the string must
be unique. Consequences:

- The namespace is **per biome**, and an enemy rostered in several biomes plants its shape
  in each of them. Shapes may repeat across biomes that never share a roster.
- Only `f[0]` is fingerprinted — but keep all frames' top rows identical anyway (§3).
- Recoloring cells among `1–5/S/B/G/R/E` does NOT change the shape; moving an `o`, or
  swapping `o`↔body, DOES. `.` vs ` ` in the top rows would also count as different shapes
  while rendering identically — never exploit that; use `.` for empty top cells (all
  current sprites do).
- Different grid WIDTHS give different strings even for similar art — width is part of the
  fingerprint.

### The current top-shape inventory (the collision namespace)

Normalized exactly as the test does. A new enemy's `f[0]` rows 0–1 must not reproduce any
string already present in a biome it joins:

**surface** (roster: crawler)
```
crawler    "..o..oooo..o..|.o#oo####oo#o."
```
**caves** (crawler, bat, rockling, delvemite, burrower, spitter)
```
crawler    "..o..oooo..o..|.o#oo####oo#o."
bat        "oo............oo|o#oo.oooo.oo#o.."
rockling   "..o..o..o..o..|.o#oo#oo#oo#o."
delvemite  "...oo....|..o##o..."
burrower   ".....ooooo.....|...oo#####oo..."
spitter    "..........oo..|.........o##o."
```
**fungal** (spitter, sporeling, stalker, bat, bloomback, delvemite)
```
spitter    "..........oo..|.........o##o."
sporeling  "...o.oooo.o...|..o#o####o#o.."
stalker    "..o..oo..o..|.o#oo####o#o"
bat        "oo............oo|o#oo.oooo.oo#o.."
bloomback  "..ooo...ooo...ooo..|.o###o.o###o.o###o."
delvemite  "...oo....|..o##o..."
```
**ruins** (brute, archer, shieldman, chanter, warder, mortar, burrower)
```
brute      "oooooooooooooooooooo.|o##################o."
archer     "..o.oooo.o...|.o#o####o#o.."
shieldman  "oooooooooooooooooo|o################o"
chanter    "....oooo....#|...o####o..##"
warder     "oo..........oo|o#oooooooooo#o"
mortar     ".........oooo.|........o###o."
burrower   ".....ooooo.....|...oo#####oo..."
```
**forge** (ember, smith, spitter, mortar, warder, burrower)
```
ember      "....oooo.....|..oo####oo..."
smith      "oooooooooooooooooooooooo|o######################o"
spitter    "..........oo..|.........o##o."
mortar     ".........oooo.|........o###o."
warder     "oo..........oo|o#oooooooooo#o"
burrower   ".....ooooo.....|...oo#####oo..."
```
**abyss** (wraith, voidspawn, stalker, hollowed, chanter)
```
wraith     "......oo......|.....o##o....."
voidspawn  "...o..oo..o...|..o#oo####oo.."
stalker    "..o..oo..o..|.o#oo####o#o"
hollowed   "..o...o...o..|.o#o.o#o.o#o."
chanter    "....oooo....#|...o####o..##"
```

The family vocabulary behind these (file comment, "SILHOUETTE LAW"):

```
player     single tuft, 2 legs        beast   two horns w/ gap, 4 legs
construct  flat overhang, 2 blocks    swarm   domed, no top feature
wraith     single tapered spike, floats (visible gap under it)
```

### Ground-contact counts in use (the second half of the silhouette law — NOT machine-tested)

The plan (PLAN.md §3.4) also assigns each family a unique ground-contact count. Suite-8
does not assert it, but here is what ships (contiguous occupied groups in the last
non-empty row of `f[0]`) so a new sprite can stay legible against them:

| contacts | who |
|---|---|
| 1 (floater point / tail) | bat, wraith, chanter, sporemother, forgelord, voidmaw |
| 2 (legs / feet blocks) | player, crawler, rockling, sporeling, voidspawn, voidling, stalker, brute, smith, spitter, ember, delvemite, burrower, bloomback, warden, sentinel |
| 3 | archer (incl. bow tip), hollowed, warder, mortar |
| 4 | shieldman |

### Structural asserts that ride along in the same block

- *"every sprite frame is rectangular"* — every row length == row 0's, per frame.
- *"every sprite uses only palette characters"* — chars ∈ `. ␣ o 1 2 3 4 5 S B G R E`,
  and `SPR[k].r` must exist in `RAMPS`.
- *"every ramp is 5 steps and monotonically darkens"* — all ramps, used or not.
- *"every enemy has a sprite (26/26)"* — `Object.keys(ENEMIES)` (currently 26, bosses
  included) must ALL have an `SPR` entry. **A new `ENEMIES` row without art fails suite-8.**
- *"the player has a sprite"* — `SPR.player` must exist.
- (§6, codex block) *"every enemy has a bestiary entry"* — every `ENEMIES` key needs
  `LORE.enemy[key]` too. Not art, but it fails in the same suite the moment you add the row.

---

## 7. How sprites map to ENEMIES rows

- **Key naming:** `BAKED[e.type]` — the lookup key is the enemy's `ENEMIES` key, verbatim
  (`e.type` is set from it in `mkEnemy`). `SPR.crawler` ↔ `ENEMIES.crawler`. No indirection,
  no aliasing. The only `SPR` key with no `ENEMIES` row is `player`.
- **No sprite present:** `drawEntity` returns false and the flat `e.c`-colored rect + eye
  dot draws instead (game keeps working; suite-8 fails). `e.c` (the `c` field of the
  ENEMIES row) remains live even WITH a sprite: it is the death-burst particle color
  (`burst(e.x,e.y,e.c, boss?40:12)`), the fallback color, and it is replaced by the elite
  modifier's color when one rolls. Pick a `c` close to the ramp's step 1–2 so the death
  burst matches the art (existing rows do: crawler `#7d5340` vs flesh ramp).
- **Size / scale interaction:** the ENEMIES `w`,`h` fields are the HITBOX in pixels; the
  sprite grid is drawn 1:1, bottom-anchored and centered on that box, never stretched.
  Elites multiply the box ×1.15 (`mkEnemy`: `w:E.w*(el?1.15:1)`) — the sprite is unchanged,
  so an elite reads as the same creature with a slightly bigger hitbox and border marks.
  Grid ≈ box is the norm (crawler 14×12 on 14×12); deliberate deviations in use: bat
  16×12 grid on a 12×10 box (wings overhang), player 14×22 on 12×20, hollowed 13×18 on a
  15×22 box, boss sprites 2–10px narrower than their boxes (warden 24 wide on 28,
  voidmaw 24 on 34). Keep any mismatch small — the ground marker, melee reach and hits all
  use the box, and art much smaller than its box makes hits look unfair.
- The player's box is `P.w=12, P.h=20` (declared in the `const P={...}` run-state literal).

---

## 8. Registration end-to-end — every place a new id must appear

For a **new enemy** (`newkey`), the art-layer wiring is:

1. `ENEMIES.newkey = {...}` — the stat row (hp/dmg/w/h/ai/c/shards/atk built via `mkAtk`;
   that side has its own reference). This creates the key.
2. `SPR.newkey = {r:'<ramp>', f:[[...],[...]]}` — same key, 2 frames standard. REQUIRED:
   suite-8 coverage fails without it.
3. `LORE.enemy.newkey = '...'` — bestiary text. REQUIRED: suite-8 codex block.
4. Roster it: add `'newkey'` to the `BIOMES[i][4]` array of each band it spawns in. THIS is
   what puts it under Laws 2 and 3 for those biomes — check the contrast matrix (§6, Law 2)
   and the top-shape inventory (§6, Law 3) for each biome BEFORE drawing. (Spawning,
   encounter budgets and role coverage are suite-11's territory — a new roster entry must
   also survive that suite; see the roster reference.)
5. Nothing else. There is **no unlock pool, drop pool, or UI registration for sprites**:
   `bakeSprites()` iterates `SPR` wholesale at INIT, the render loop looks up
   `BAKED[e.type]` by key, and the codex/bestiary UI walks `ENEMIES` + `META.seen.en`.

For a **new ramp**: add to `RAMPS` (5 hexes, strictly darkening, step 0 luminance
≤ 0.5472 — practically ≤ 0.47) — it is automatically under Law 1 and the ramp-shape assert
even if unused. For a **new accent**: it needs a char in `palOf`'s return map AND in
suite-8's `legal` set AND in the Law-3 normalization regex `[1-5SBGRE]` — three edits, two
of them in the test; prefer the five accents that exist.

Then: `./test/run.sh 8` (the whole visual-law block), and `node test/shots.js` for
screenshots — "the only way to judge FEEL" (CLAUDE.md).

---

## 9. Animation budget — plan vs shipped

PLAN.md §3.5 budgeted "idle 2, walk 4, attack 3 (windup / strike / recover), hit 1,
death 3. Player gets more." **What actually shipped is leaner** — poses were folded
together and VFX carry the rest, per the same section's own principle ("keyposes first,
VFX over frames"):

- **Grunts: 2 frames total** — neutral + stride, with the stride pose reused as the windup
  tell and the neutral as the strike (§3 table). 21 of 26 enemies.
- **Bosses + voidling: 1 frame.** Their read comes from size, tints and patterns.
- **Player: 3 keyposes** (idle / stride / airborne), the "player gets more" clause.
- **Hit: 0 frames** — masked white/warm tint overlay (`drawEntityTinted`).
- **Windup: pose + swell (×1.28) + 22 Hz strobe tint + ground marker.**
- **Recover ("spent"): 0 frames** — pale tick over the head.
- **Death: 0 frames** — `burst()` particles in `e.c` (12 particles, 40 for bosses) +
  shake.
- Total baked frames in the game: **49** (suite-8 prints this: 26 enemies + player).

A new enemy should ship 2 frames, differing in the bottom rows only. Add a 3rd frame only
if the creature needs a distinct strike pose (the formula already supports it — `f[2]`
becomes the active-frames pose and joins the walk cycle; no other code changes).

---

## 10. Checklist for a new enemy sprite that passes suite-8 first run

1. Pick the biome roster(s) first — they define both laws' scope.
2. Pick a ramp with ≥3.00/≥2.40 in every such biome (§6 matrix; avoid `dirt` outside
   surface, and know its caves margin is 0.00/0.05). Never `hero`.
3. Design the top two rows against that biome's inventory (§6) — new silhouette family =
   new top shape; width counts; `o`-vs-body placement counts.
4. Author facing right, light from top-left, `o` outline ring, grid ≈ ENEMIES `w×h`,
   feet in the last row (walkers) or trailing blank rows (floaters).
5. Two frames, same rectangle, top rows identical, legs/bottom differ.
6. Only chars `. o 1-5 S B G R E` (space allowed; use sparingly, never in the top rows).
7. Accent budget: a few pixels; `B` most sparingly of all.
8. Add `SPR.newkey`, `LORE.enemy.newkey`; roster it in `BIOMES`.
9. `./test/run.sh 8` (then 11 if you rostered it), `node test/shots.js` to look at it.
