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
  A(ROOMS.length >= 5, 'there is a template set (' + ROOMS.length + ' rooms)');
  let ragged = [];
  for (let i = 0; i < ROOMS.length; i++) {
    const R = ROOMS[i], w = R[0].length;
    if (R.some(r => r.length !== w)) ragged.push(i);
    for (const row of R) for (const ch of row) if ('#.='.indexOf(ch) < 0) ragged.push(i + ':' + ch);
    if (w >= CHUNK - 1 || R.length >= CHUNK - 1) ragged.push(i + ':too big for a chunk');
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
  A(BSHAPE.fungal.vent === 'spore' && BSHAPE.forge.vent === 'flame', 'two bands declare a vent');
  A(!BSHAPE.caves.vent && !BSHAPE.ruins.vent, 'and the others do not');
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
  function hover(depthM) {
    standIn(depthM); P.fuel = P.maxfuel; P.onG = false; P.noFall = 99;
    HELD.jmp = true;
    for (let i = 0; i < 90; i++) { P.onG = false; upPlayer(DT) }
    HELD.jmp = false;
    return P.fuel;
  }
  const ruinsFuel = hover(1200), forgeFuel = hover(1900);
  console.log('   fuel left after 1.5s of hovering: ruins ' + ruinsFuel.toFixed(0) + ', forge ' + forgeFuel.toFixed(0));
  A(forgeFuel < ruinsFuel - 5, 'the forge burns your fuel where the ruins do not');
  // and on the ground it slows the refill rather than stopping it, so the band is hard, not hostile
  standIn(1900); P.fuel = 0; P.onG = true;
  for (let i = 0; i < 120; i++) { P.onG = true; upPlayer(DT) }
  A(P.fuel > 0, 'but standing on the ground still refills, slowly (' + P.fuel.toFixed(0) + ')');
  A(BSHAPE.forge.heat > 0 && !BSHAPE.ruins.heat, 'and that comes from the band table, not a branch');
  A(BSHAPE.abyss.dark > 1, 'the abyss is darker by declaration');
  A(!BSHAPE.caves.dark, 'the caves are not');
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

console.log('\n' + pass + ' passed, ' + fail + ' failed');
if (fail) process.exit(1);
