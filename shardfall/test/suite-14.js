// ===== SUITE 14 — the descent has a shape =====
// Measured before this pass: the caves band was 90% air (an open void, not caves), then the world
// became MORE solid and stayed flat for the remaining 2,800 tiles. The code comment claimed
// density "grows a touch with depth"; it did the opposite and then did nothing. This suite exists
// so that never silently comes back, and so a band's identity is a fact rather than a palette.
let pass = 0, fail = 0;
function A(c, m) { if (c) { pass++; console.log('ok: ' + m) } else { fail++; console.log('FAIL: ' + m) } }

loadMeta(); META.shards = 1e6; META.cls = 'vanguard'; META.threat = 0; newRun();

function bandRange(name) {
  for (let i = 0; i < BIOMES.length; i++) if (BIOMES[i][1] === name)
    return [i ? BIOMES[i - 1][0] : SURFACE, BIOMES[i][0]];
  return null;
}
// A true band average needs width as well as height: one 40-tile window inside a large cavern
// reads 1.00 and tells you nothing about the band.
function airOf(name, cols) {
  const [y0, y1] = bandRange(name);
  let air = 0, tot = 0;
  const n = cols || 18;
  for (let w = 0; w < n; w++) {
    const tx0 = 480 + w * 34, ty0 = y0 + Math.floor((y1 - y0) * (0.12 + 0.74 * (w / n)));
    for (let ty = ty0; ty < ty0 + 30; ty++) for (let tx = tx0; tx < tx0 + 30; tx++) {
      if (getTile(tx, ty) === 0) air++; tot++;
    }
  }
  return air / tot;
}

// ---------- 1. EVERY BAND HITS ITS DECLARED AIR FRACTION ----------
console.log('\n-- the arc --');
const measured = {};
console.log('   band     target  measured   character');
for (const b of BIOMES) {
  const name = b[1], S = BSHAPE[name];
  if (!S || !S.air) continue;
  const a = airOf(name); measured[name] = a;
  console.log('   ' + name.padEnd(8) + S.air.toFixed(2).padStart(6) + '   ' + a.toFixed(3).padStart(6) +
    '     ' + S.n);
  A(Math.abs(a - S.air) < 0.13, name + ' lands within 0.13 of its declared air fraction (' +
    a.toFixed(3) + ' vs ' + S.air + ')');
}
{
  A(measured.caves < 0.55, 'the caves are caves, not an open void (was 0.904)');
  A(measured.fungal > measured.caves, 'the Bloom opens out after the caves');
  A(measured.ruins < measured.fungal, 'the ruins tighten again into built geometry');
  A(measured.forge < measured.ruins, 'the forge is the tightest band');
  A(measured.abyss > measured.forge, 'and the abyss opens into the widest of all');
  A(measured.abyss > measured.fungal, 'the last band is the most open in the game');
  const vals = BIOMES.filter(b => BSHAPE[b[1]] && BSHAPE[b[1]].air).map(b => measured[b[1]]);
  let dirs = 0;
  for (let i = 1; i < vals.length; i++) if ((vals[i] > vals[i - 1]) !== (vals[i - 1] > (vals[i - 2] === undefined ? -1 : vals[i - 2]))) dirs++;
  A(dirs >= 2, 'the descent changes direction more than once — it is an arc, not a ramp');
}

// ---------- 2. THE CALIBRATION IS DERIVED, NOT HAND-TUNED ----------
console.log('\n-- calibration --');
{
  const before = Object.assign({}, AIRCAL);
  A(Object.keys(before).length === BIOMES.length, 'every band gets a solved threshold');
  A(AIRCAL.caves !== AIRCAL.abyss, 'and they are not all the same number');
  // change the shape of the world and the thresholds must re-solve
  const oldSeed = WEAVE.terrain;
  WEAVE.terrain = (WEAVE.terrain ^ 0x5f3759df) >>> 0;
  calibrateAir();
  let moved = 0;
  for (const k in AIRCAL) if (AIRCAL[k] !== before[k]) moved++;
  A(moved > 0, 'rewriting the terrain strand re-solves the thresholds (' + moved + ' bands moved)');
  CHUNKS.clear();
  const a2 = airOf('caves');
  A(Math.abs(a2 - BSHAPE.caves.air) < 0.15, 'and the new world still hits the target (' + a2.toFixed(3) + ')');
  WEAVE.terrain = oldSeed; calibrateAir(); CHUNKS.clear();
}
{ // a band with no declared air must not be carved at all
  A(AIRCAL.surface === -1, 'the surface is not cave-carved');
}

// ---------- 3. ROOMS ----------
console.log('\n-- rooms --');
{
  A(ROOMS.length >= 14, 'there is a template set (' + ROOMS.length + ' rooms)');
  let ragged = [];
  for (let i = 0; i < ROOMS.length; i++) {
    const R = ROOMS[i].g, w = R[0].length;
    if (R.some(r => r.length !== w)) ragged.push(i);
    for (const row of R) for (const ch of row) if ('#.='.indexOf(ch) < 0) ragged.push(i + ':' + ch);
    if (w >= CHUNK - 1 || R.length >= CHUNK - 1) ragged.push(i + ':too big for a chunk');
    if (ROOMS[i].b && !BIOMES.some(B => B[1] === ROOMS[i].b)) ragged.push(i + ':band');
  }
  A(ragged.length === 0, 'every template is rectangular, legal and fits in a chunk' +
    (ragged.length ? ': ' + ragged.join(',') : ''));
  // and they actually get stamped into the band that asked for them
  const [y0, y1] = bandRange('ruins');
  const cy0 = Math.floor(y0 / CHUNK) + 1, cy1 = Math.floor(y1 / CHUNK) - 1;
  let stamped = 0, checked = 0;
  for (let cx = 8; cx < 26; cx++) for (let cy = cy0; cy < Math.min(cy1, cy0 + 6); cy++) {
    checked++;
    if (hashS('terrain', cx * 29 + 3, cy * 29 + 11) < BSHAPE.ruins.rooms) stamped++;
  }
  console.log('   ruins: ' + stamped + '/' + checked + ' chunks carry a room');
  A(stamped > checked * 0.25, 'rooms are common in the ruins, not a rarity');
  A(BSHAPE.caves.rooms === undefined, 'and the caves are still caves');
  // every rooms-band has a non-empty pool, and its gate actually stamps somewhere
  for (const b of ['fungal', 'forge', 'abyss']) {
    A(ROOMS.some(R => !R.b || R.b === b), b + ' has templates in its pool');
    const [by0] = bandRange(b);
    const bcy = Math.floor(by0 / CHUNK) + 1;
    let st = 0;
    for (let cx = 6; cx < 30; cx++) for (let cy = bcy; cy < bcy + 6; cy++)
      if (hashS('terrain', cx * 29 + 3, cy * 29 + 11) < BSHAPE[b].rooms) st++;
    A(st > 0, b + ' stamps rooms at its own rate (' + st + ')');
  }
  // a stamped room must leave a floor you can stand on and air you can stand in
  CHUNKS.clear();
  let foundFloorAndAir = false;
  for (let cx = 8; cx < 30 && !foundFloorAndAir; cx++) for (let cy = cy0; cy < cy0 + 5; cy++) {
    if (hashS('terrain', cx * 29 + 3, cy * 29 + 11) >= BSHAPE.ruins.rooms) continue;
    const c = getChunk(cx, cy);
    let air = 0, solid = 0;
    for (let i = 0; i < c.tiles.length; i++) { if (c.tiles[i] === 0) air++; else solid++ }
    if (air > 200 && solid > 200) { foundFloorAndAir = true; break }
  }
  A(foundFloorAndAir, 'a room chunk has both walls and space');
}

// ---------- 4. VENTS: THE BAND ITSELF IS DOING SOMETHING ----------
console.log('\n-- vents --');
{
  A(BSHAPE.fungal.vent === 'spore' && BSHAPE.forge.vent === 'flame'
    && BSHAPE.caves.vent === 'grit' && BSHAPE.ruins.vent === 'volt', 'four bands declare a vent');
  A(!BSHAPE.surface.vent && !BSHAPE.abyss.vent, 'and the others do not — the abyss is empty on purpose');
  // density is a band knob: sparse where it teaches (caves), dense where it prices (forge)
  A((BSHAPE.caves.ventP || 0.42) < 0.42 && (BSHAPE.forge.ventP || 0.42) > 0.42,
    'vent density is a band knob, sparse where it teaches');
  {
    let cv = 0, fv = 0;
    for (let cx = 6; cx < 56; cx++) for (let cy = 2; cy < 4; cy++) {
      if (hashS('terrain', cx * 37 + 13, cy * 37 + 29) < BSHAPE.caves.ventP) cv++;
      if (hashS('terrain', cx * 37 + 13, cy * 37 + 29) < BSHAPE.forge.ventP) fv++;
    }
    A(cv < fv, 'the caves gate passes fewer chunks than the forge gate (' + cv + ' vs ' + fv + ')');
  }
  // grit is honest (damage, no status); volt's shock is a FLAT multiplier at every depth
  {
    VENTS.length = 0; HAZ.length = 0;
    VENTS.push({ x: P.x + 40, y: P.y, kind: 'grit', t: 0 });
    upVents(DT);
    A(HAZ.length === 1 && HAZ[0].dmg > 0 && HAZ[0].st === null, 'grit hits plainly — the teaching vent carries no status');
    for (const d of [600, 2600]) {
      VENTS.length = 0; HAZ.length = 0;
      VENTS.push({ x: P.x + 40, y: (SURFACE + d) * TILE, kind: 'volt', t: 0 });
      P.y = (SURFACE + d) * TILE;
      upVents(DT);
      A(HAZ.length === 1 && HAZ[0].st && HAZ[0].st.shock === 1.3,
        'volt shock is 1.3 FLAT at ' + d + 'm (multiplier statuses never depth-scale)');
    }
    P.y = (SURFACE + 600) * TILE;
  }
  CHUNKS.clear();
  let vents = 0;
  const [y0] = bandRange('fungal');
  for (let cx = 6; cx < 30; cx++) for (let cy = Math.floor(y0 / CHUNK) + 1; cy < Math.floor(y0 / CHUNK) + 6; cy++)
    vents += genChunk(cx, cy).spawns.filter(s => s.type === 'vent').length;
  console.log('   fungal vents found: ' + vents);
  A(vents > 0, 'vents generate in the Bloom');
  // and they emit
  META.cls = 'vanguard'; newRun();
  P.x = (CAMP_X + 300) * TILE; P.y = (SURFACE + 600) * TILE;
  VENTS.length = 0; HAZ.length = 0;
  VENTS.push({ x: P.x + 40, y: P.y, kind: 'spore', t: 0 });
  for (let i = 0; i < 30; i++) upVents(DT);
  A(HAZ.length > 0, 'a vent emits a hazard');
  A(HAZ[0].friendly === 0, 'which belongs to the world, not to you');
  const n = HAZ.length;
  for (let i = 0; i < 60 * 60; i++) { upVents(DT); upHaz(DT) }
  A(HAZ.length <= HAZ_MAX, 'and a minute of venting stays inside the hazard cap (' + HAZ.length + ')');
  // a vent far away must cost nothing
  VENTS.length = 0; HAZ.length = 0;
  VENTS.push({ x: P.x + 5000, y: P.y, kind: 'flame', t: 0 });
  for (let i = 0; i < 120; i++) upVents(DT);
  A(HAZ.length === 0, 'a vent two screens away does not tick');
}

// ---------- 5. BIOME IDENTITY IS MECHANICAL, NOT COSMETIC ----------
console.log('\n-- band identity --');
{
  META.cls = 'vanguard'; META.threat = 0; newRun();
  function standIn(depthM) {
    P.x = (CAMP_X + 500) * TILE; P.y = (SURFACE + depthM) * TILE;
    const tx = Math.floor(P.x / TILE), ty = Math.floor(P.y / TILE);
    for (let y = -6; y <= 1; y++) for (let x = -8; x <= 8; x++) setTile(tx + x, ty + y, 0);
    for (let x = -8; x <= 8; x++) setTile(tx + x, ty + 2, 2);
    P.y = (ty + 1) * TILE - P.h / 2 - 1;
    ANCHOR = null; P.vx = 0; P.vy = 0; P.noFall = 9; P.dead = false; P.inv = 999;
    P.maxfuel = maxFuel(); P.fuel = P.maxfuel; HELD.jmp = false;
    EN.length = 0; HAZ.length = 0; VENTS.length = 0;
  }
  // Movement-wave ruling: the base tank is 45 (was 60) and every player who reaches the forge
  // deed-owns the draught gait (+20 -> 65) — grant it here or a 1.5s hover floors BOTH bands
  // at 0 and the identity is invisible. 1.0s of hover keeps both readings off the clamp.
  META.moves = { draught: 1 };
  function hover(depthM) {
    standIn(depthM); P.fuel = P.maxfuel; P.onG = false; P.noFall = 99;
    HELD.jmp = true;
    for (let i = 0; i < 60; i++) { P.onG = false; upPlayer(DT) }
    HELD.jmp = false;
    return P.fuel;
  }
  const ruinsFuel = hover(1200), forgeFuel = hover(1900);
  console.log('   fuel left after 1.0s of hovering: ruins ' + ruinsFuel.toFixed(0) + ', forge ' + forgeFuel.toFixed(0));
  A(forgeFuel < ruinsFuel - 5, 'the forge burns your fuel where the ruins do not');
  META.moves = {};
  // and on the ground it slows the refill rather than stopping it, so the band is hard, not hostile
  standIn(1900); P.fuel = 0; P.onG = true;
  for (let i = 0; i < 120; i++) { P.onG = true; upPlayer(DT) }
  A(P.fuel > 0, 'but standing on the ground still refills, slowly (' + P.fuel.toFixed(0) + ')');
  A(BSHAPE.forge.heat > 0 && !BSHAPE.ruins.heat, 'and that comes from the band table, not a branch');
  A(BSHAPE.abyss.dark > 1, 'the abyss is darker by declaration');
  A(!BSHAPE.caves.dark, 'the caves are not');
  A(BSHAPE.fungal.dark < 1 && BSHAPE.abyss.dark > 1, 'the Bloom glows; the abyss does not');
  // the abyss taxes flight too — at less than half the forge's rate, priced not punished
  A(BSHAPE.abyss.heat > 0 && BSHAPE.abyss.heat < BSHAPE.forge.heat, 'the dark drinks charge, gentler than the forge');
  META.moves = { draught: 1 }; MOVE_CK = 1e9;   // pin the deed watermark — a live GLIDE grant mid-hover cuts drain 0.68x and erases the heat delta
  const abyssFuel = hover(2700);
  console.log('   abyss hover fuel: ' + abyssFuel.toFixed(0));
  A(abyssFuel < ruinsFuel - 3, 'hovering in the abyss costs more than the ruins');
  A(abyssFuel > forgeFuel, 'and less than the forge');
  META.moves = {};
  standIn(2700); P.fuel = 0; P.onG = true;
  for (let i = 0; i < 120; i++) { P.onG = true; upPlayer(DT) }
  A(P.fuel > 0, 'the abyss ground still refills');
  // every band must claim at least one mechanical identity beyond a palette
  for (const b of BIOMES) {
    const name = b[1], S = BSHAPE[name]; if (!S || !S.air) continue;
    const has = !!(S.heat || S.dark || S.vent || S.rooms) || Math.abs(S.ax - S.ay) > 0.2;
    A(has, name + ' has an identity beyond its colour');
  }
}

// ---------- 6. THE SHAPE IS THE TERRAIN STRAND'S, AND NOTHING ELSE'S ----------
console.log('\n-- strand ownership of the rock --');
{
  META.threat = 0; newRun();
  function rockPrint() {
    let h = 2166136261;
    for (let cx = 7; cx < 13; cx++) for (let cy = 22; cy < 27; cy++) {
      const c = getChunk(cx, cy);
      // SOLIDITY only, positionally. `flux` legitimately swaps one solid tile type for another
      // ("the small variances — texture, scatter, chance"), and `ore` legitimately turns stone
      // into a seam; neither moves a wall. What must never move is where the rock IS.
      for (let i = 0; i < c.tiles.length; i++) { h ^= (c.tiles[i] ? 1 : 0) + i * 3; h = Math.imul(h, 16777619) }
    }
    return h >>> 0;
  }
  CHUNKS.clear(); const base = rockPrint();
  // `boss` is deliberately absent: the strand table defines it as "the arenas, and what stands
  // in them", so a boss arena moving when you rewrite it is the mechanic working, not a leak.
  for (const strand of ['poi', 'spawn', 'flux']) {
    const old = WEAVE[strand];
    WEAVE[strand] = (WEAVE[strand] ^ 0xABCDEF) >>> 0; CHUNKS.clear();
    A(rockPrint() === base, 'rerolling ' + strand + ' does not move one tile of rock');
    WEAVE[strand] = old;
  }
  WEAVE.terrain = (WEAVE.terrain ^ 0xABCDEF) >>> 0; calibrateAir(); CHUNKS.clear();
  A(rockPrint() !== base, 'rerolling the shape strand does');
  newRun();
}
{ // vents are structural, so they follow the rock
  META.threat = 0; newRun(); CHUNKS.clear();
  // sample the BLOOM (tiles 400-900), which is where vents live — the previous window sat in
  // the ruins, where both prints were empty and therefore equal
  const vp = () => { let s = ''; for (let cx = 7; cx < 16; cx++) for (let cy = 10; cy < 18; cy++)
    s += genChunk(cx, cy).spawns.filter(x => x.type === 'vent').map(x => x.x + ',' + x.y).join(';'); return s };
  const a = vp();
  WEAVE.poi = (WEAVE.poi ^ 0x1234) >>> 0; CHUNKS.clear();
  A(vp() === a, 'rerolling the caches does not move a vent');
  WEAVE.terrain = (WEAVE.terrain ^ 0x1234) >>> 0; calibrateAir(); CHUNKS.clear();
  A(vp() !== a, 'rerolling the shape does');
  newRun();
}

// ---------- 7. THE WORLD IS STILL PLAYABLE ----------
console.log('\n-- traversability --');
{
  // Every band has to contain standable ground, or the encounter budget has nowhere to put a
  // fight and the player has nowhere to land.
  META.threat = 0; newRun(); CHUNKS.clear();
  for (const b of BIOMES) {
    const name = b[1]; if (!BSHAPE[name] || !BSHAPE[name].air) continue;
    const [y0, y1] = bandRange(name);
    // A band's floor has to be measured across the band, not down one shaft: the abyss is made
    // of caverns hundreds of tiles wide, so a single 100-tile window can legitimately be sky.
    let spots = 0;
    const ty0 = Math.floor((y0 + y1) / 2);
    for (let ty = ty0 - 60; ty < ty0 + 60; ty++) for (let tx = 480; tx < 880; tx++)
      if (getTile(tx, ty) === 0 && getTile(tx, ty + 1) !== 0) spots++;
    A(spots > 200, name + ' has ground to stand on (' + spots + ' standing spots in a 400x120 block)');
  }
  // and the generator must never produce a chunk that is entirely solid at depth, which would be
  // an impassable seam across the whole world
  let sealed = 0;
  for (let cx = 6; cx < 26; cx++) for (let cy = 12; cy < 60; cy += 7) {
    const c = getChunk(cx, cy);
    let air = 0; for (let i = 0; i < c.tiles.length; i++) if (c.tiles[i] === 0) air++;
    if (air === 0) sealed++;
  }
  A(sealed === 0, 'no fully sealed chunk anywhere in the descent');
}

// ---------- POCKETS: soft-gated treasure, terrain-strand shape ----------
console.log('\n-- pockets --');
{
  A(BSHAPE.caves.under === 1 && BSHAPE.fungal.flue === 1 && BSHAPE.abyss.flue === 1 && BSHAPE.forge.trav === 1,
    'the four hosting bands declare their pockets');
  A(!BSHAPE.surface.under && !BSHAPE.ruins.flue && !BSHAPE.ruins.under && !BSHAPE.ruins.trav,
    'and nobody else does');
  // a sweep of each hosting band finds at least one pocket, and it carries treasure
  function sweep(band, flagGate) {
    const [y0] = bandRange(band); const cy0 = Math.floor(y0 / CHUNK) + 1;
    CHUNKS.clear();
    for (let cx = 4; cx < 30; cx++) for (let cy = cy0; cy < cy0 + 6; cy++) {
      if (!flagGate(cx, cy)) continue;
      const c = genChunk(cx, cy);
      let t10 = 0; for (let i = 0; i < c.tiles.length; i++) if (c.tiles[i] === 10) t10++;
      // pocket rims are 2 tile-10 tiles in a chunk that FAILED the cache gate
      if (t10 >= 2 && hashS('terrain', cx * 19 + 3, cy * 19 + 8) >= 0.14) {
        return { c, cx, cy };
      }
    }
    return null;
  }
  const uc = sweep('caves', (cx, cy) => hashS('terrain', cx * 41 + 11, cy * 41 + 7) < 0.055);
  A(!!uc, 'the caves grow an undercut somewhere');
  if (uc) A(uc.c.spawns.some(s => s.type === 'chest'), 'and it holds a chest');
  const fl = sweep('fungal', (cx, cy) => hashS('terrain', cx * 23 + 9, cy * 23 + 5) < 0.05);
  A(!!fl, 'the Bloom grows a flue somewhere');
  if (fl) A(fl.c.spawns.some(s => s.type === 'chest'), 'with a chest at the top');
  const tv = sweep('forge', (cx, cy) => hashS('terrain', cx * 43 + 7, cy * 43 + 19) < 0.05);
  A(!!tv, 'the forge works a traverse somewhere');
  if (tv) {
    A(tv.c.spawns.some(s => s.type === 'chest'), 'with a chest past the fire');
    A(tv.c.spawns.filter(s => s.type === 'vent').length >= 1, 'and the pit holds a live vent');
  }
  // pocket walls are never bedrock — a pocket is soft-gated by geometry, not sealed by law
  if (uc) {
    let bed = 0; for (let i = 0; i < uc.c.tiles.length; i++) if (uc.c.tiles[i] === 3) bed++;
    // bedrock only exists at the world floor; a caves chunk should carry none at all
    A(bed === 0, 'no pocket wall is bedrock');
  }
  // pocket solidity is TERRAIN property: identical under poi/ore/spawn rerolls
  if (uc) {
    const solidOf = c => { let sig = ''; for (let i = 0; i < c.tiles.length; i += 7) sig += (c.tiles[i] === 0 ? 0 : 1); return sig };
    const base = solidOf(uc.c);
    const savedW = {};
    for (const k of ['poi', 'ore', 'spawn']) { savedW[k] = WEAVE[k]; WEAVE[k] = (WEAVE[k] ^ 0x5a5a5a5) >>> 0; }
    CHUNKS.clear();
    const re = genChunk(uc.cx, uc.cy);
    A(solidOf(re) === base, 'pocket rock ignores poi/ore/spawn rerolls (the strand charter holds)');
    for (const k of ['poi', 'ore', 'spawn']) WEAVE[k] = savedW[k];
    CHUNKS.clear();
  }
}

// ---------- THE MASTER ARENA ----------
console.log('\n-- the master arena --');
{
  CHUNKS.clear();
  getChunk(16, 65); getChunk(17, 65); getChunk(16, 66); getChunk(17, 66);
  let air = 0; for (let y = 3151; y <= 3167; y++) for (let x = 781; x <= 818; x++) if (getTile(x, y) === 0) air++;
  A(air > 500, 'the arena interior is open (' + air + ' air tiles)');
  A(getTile(800, 3168) === 3, 'the glyph slab is bedrock — nothing deletes the ending');
  A(getTile(778, 3158) === 7 && getTile(821, 3158) === 7, 'the wall ring stands');
  A(getTile(799, 3148) === 0, 'the entrance is open before the wake');
  // the bare-room law: those chunks carry no POI spawns
  for (const [cx, cy] of [[16, 65], [17, 65], [16, 66], [17, 66]]) {
    const c = getChunk(cx, cy);
    A(!c.spawns.some(x => x.type === 'chest' || x.type === 'shrine' || x.type === 'vent' || x.type === 'voidmaw'),
      '(' + cx + ',' + cy + ') is bare — the room\'s reward is the ending');
  }
  // solidity is boss-strand property: identical under every other strand's reroll
  const sig = () => { let g = ''; for (let y = 3148; y <= 3171; y += 2) for (let x = 778; x <= 821; x += 2) g += (getTile(x, y) === 0 ? 0 : 1); return g };
  const base = sig(); const saved = {};
  for (const k of ['poi', 'ore', 'spawn', 'flux']) { saved[k] = WEAVE[k]; WEAVE[k] = (WEAVE[k] ^ 0xBEEF11) >>> 0 }
  CHUNKS.clear(); getChunk(16, 65); getChunk(17, 65); getChunk(16, 66); getChunk(17, 66);
  A(sig() === base, 'the arena ignores poi/ore/spawn/flux rerolls (boss-strand charter)');
  for (const k in saved) WEAVE[k] = saved[k];
  CHUNKS.clear();
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
if (fail) process.exit(1);
