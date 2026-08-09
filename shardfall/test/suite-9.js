// ===== SUITE 9 — THE LATTICE: strands, sigils, dissonance, escape =====
// The seed is no longer an implementation detail; it is the object the endgame is about. That
// means every property a player will lean on has to be guaranteed: strands must be genuinely
// independent, glyphs must round-trip, rewriting must not dissolve the floor underfoot, and
// dissonance must escalate in the stated order and no other.
let pass = 0, fail = 0;
function A(c, m) { if (c) { pass++; console.log('ok: ' + m) } else { fail++; console.log('FAIL: ' + m) } }

loadMeta(); loadSet(); META.shards = 100000; META.cls = 'vanguard';
META.threat = 0; META.maxThreat = 0; META.bosses = {}; META.echoes = {};
newRun(); startRun();

function OFF() {
  P.x = (CAMP_X + 400) * TILE; P.y = (SURFACE + 600) * TILE;
  const tx = Math.floor(P.x / TILE), ty = Math.floor(P.y / TILE);
  for (let y = -5; y <= 1; y++) for (let x = -12; x <= 12; x++) setTile(tx + x, ty + y, 0);
  for (let x = -12; x <= 12; x++) setTile(tx + x, ty + 2, 2);
  P.y = (ty + 1) * TILE - P.h / 2 - 1;
  ANCHOR = null; P.vx = 0; P.vy = 0; P.noFall = 9; P.dead = false; P.hp = P.maxhp; P.inv = 0;
}
// A cheap fingerprint of what a strand actually produced, so "did this change?" is measurable.
function fingerprint() {
  const F = { terrain: 0, ore: 0, poi: 0, spawn: 0, boss: 0 };
  for (let cy = 14; cy < 20; cy++) for (let cx = 14; cx < 18; cx++) {
    const c = genChunk(cx, cy);
    for (let i = 0; i < c.tiles.length; i += 7) {
      const v = c.tiles[i];
      // Ore REPLACES rock rather than sitting beside it, so solidity is the terrain measure and
      // ore is counted on top of it. Counting them as disjoint made a pure ore reroll look like
      // it had moved the rock.
      if (v !== 0) F.terrain++;
      if (v === 8) F.ore++;
    }
    for (const s of c.spawns) {
      if (s.type === 'chest' || s.type === 'shrine') F.poi++;
      else if (ENEMIES[s.type] && ENEMIES[s.type].boss) F.boss++;
      else F.spawn++;
    }
  }
  return F;
}

// ---------- 1. GLYPHS ----------
console.log('\n-- glyphs --');
{
  A(seedGlyph(0).length === 6, 'a glyph is always six symbols');
  const samples = [0, 1, 12345, 0x7fffffff, 0xdeadbeef, 4294967295];
  const bad = samples.filter(v => seedGlyph(v).length !== 6);
  A(bad.length === 0, 'every seed value produces a six-symbol glyph');
  // round-trip: what a player types must produce what they were shown
  const rt = samples.filter(v => glyphSeed(seedGlyph(v)) !== (v & 0x3fffffff));
  A(rt.length === 0, 'a glyph round-trips to the low 30 bits it displays' + (rt.length ? ': ' + rt.join(',') : ''));
  A(glyphSeed(seedGlyph(12345)) === glyphSeed(seedGlyph(12345).toLowerCase()),
    'typing a glyph in lower case works');
  A(glyphSeed('!!!!!!') === 0, 'junk input degrades to zero rather than NaN');
  // the alphabet must be unambiguous — no O/0 or I/1 confusion for something people retype
  A(!/[OI01]/.test(GLYPHS), 'the glyph alphabet excludes the characters people mistype');
  A(new Set(GLYPHS).size === GLYPHS.length, 'no glyph appears twice');
}

// ---------- 2. STRAND INDEPENDENCE ----------
// The entire mechanic rests on this: rerolling the caches must not move the monsters.
console.log('\n-- strand independence --');
{
  deriveWeave(1234567);
  const w0 = Object.assign({}, WEAVE);
  A(STRANDS.every(s => WEAVE[s.k] !== undefined), 'every strand gets a seed');
  const vals = STRANDS.map(s => WEAVE[s.k]);
  A(new Set(vals).size === vals.length, 'no two strands share a seed');
  deriveWeave(1234567);
  A(STRANDS.every(s => WEAVE[s.k] === w0[s.k]), 'the same master seed derives the same weave');
  deriveWeave(1234568);
  A(STRANDS.every(s => WEAVE[s.k] !== w0[s.k]), 'a different master moves every strand');

  // Now the real property: change ONE strand, and only its own output changes.
  for (const target of ['ore', 'poi', 'spawn']) {
    deriveWeave(999);
    CHUNKS.clear();
    const before = fingerprint();
    WEAVE[target] = (WEAVE[target] ^ 0xABCDEF) >>> 0;
    CHUNKS.clear();
    const after = fingerprint();
    A(after[target] !== before[target], `rerolling '${target}' changes what '${target}' produces`);
    A(after.terrain === before.terrain, `rerolling '${target}' leaves the rock untouched`);
    const others = Object.keys(before).filter(k => k !== target && k !== 'terrain');
    const moved = others.filter(k => after[k] !== before[k]);
    A(moved.length === 0, `rerolling '${target}' leaves ${others.join('/')} alone` + (moved.length ? ` — ${moved.join(',')} moved` : ''));
  }
  // and terrain moves the rock
  deriveWeave(999); CHUNKS.clear();
  const t0 = fingerprint();
  WEAVE.terrain = (WEAVE.terrain ^ 0x12345) >>> 0; CHUNKS.clear();
  A(fingerprint().terrain !== t0.terrain, "rerolling 'terrain' changes the rock");
  deriveWeave(SEED); CHUNKS.clear();
}

// ---------- 3. REWEAVING ----------
console.log('\n-- reweaving --');
{
  newRun(); startRun(); OFF();
  for (let i = 0; i < 40; i++) sim(1 / 60);          // let some world exist around the player
  const pcx = Math.floor(P.x / TILE / CHUNK), pcy = Math.floor(P.y / TILE / CHUNK);
  const groundBelow = getTile(Math.floor(P.x / TILE), Math.floor(P.y / TILE) + 2);
  const before = CHUNKS.size, w0 = WEAVE.terrain;
  reweave('terrain', 4242);
  A(WEAVE.terrain === 4242, 'reweave writes the new strand seed');
  A(WEAVE.terrain !== w0, 'and it actually changed');
  // The floor must survive. Dissolving the chunk you are standing in is a bug, not a mechanic.
  A(CHUNKS.has(chunkKey(pcx, pcy)), 'the chunk the player occupies is never dissolved');
  A(getTile(Math.floor(P.x / TILE), Math.floor(P.y / TILE) + 2) === groundBelow,
    'the ground directly under the player is unchanged');
  A(!P.dead, 'the player survives a terrain rewrite');
  A(CHUNKS.size <= before, 'distant chunks are dropped so they regenerate');
  A(WOVEN > 0, 'the rewrite is counted');
  // a POI rewrite clears the POI bookkeeping rather than leaving ghosts
  CHESTS.push({ x: 0, y: 0, opened: false });
  reweave('poi', 777);
  A(CHESTS.length === 0, 'rewriting caches clears the old ones instead of leaving ghosts');
}

// ---------- 4. SIGILS ----------
console.log('\n-- sigils --');
{
  newRun(); startRun(); OFF();
  A(SIGILS.length === 0 && DISSONANCE === 0 && WOVEN === 0, 'a run starts with a clean lattice');
  // every sigil is well-formed and has lore
  const badSig = Object.keys(SIGILS_DEF).filter(k => {
    const d = SIGILS_DEF[k];
    return !d.n || !d.d || !(d.diss > 0) || !d.col;
  });
  A(badSig.length === 0, 'every sigil has a name, description, cost and colour' + (badSig.length ? ': ' + badSig.join(',') : ''));
  const noLore = Object.keys(SIGILS_DEF).filter(k => !LORE.sigil[k]);
  A(noLore.length === 0, 'every sigil has a codex entry' + (noLore.length ? ': ' + noLore.join(',') : ''));

  // using one consumes it and raises dissonance
  SIGILS = ['reroll'];
  const w0 = WEAVE.ore, d0 = DISSONANCE;
  useSigil('reroll', 'ore'); closePanel();
  A(SIGILS.length === 0, 'using a sigil consumes it');
  A(WEAVE.ore !== w0, 'unmaking rerolls the strand');
  A(DISSONANCE === d0 + SIGILS_DEF.reroll.diss, 'and raises dissonance by its stated cost');

  // binding blocks later rewrites of that strand
  SIGILS = ['lock', 'reroll'];
  const wt = WEAVE.terrain;
  useSigil('lock', 'terrain'); closePanel();
  A(!!WEAVE_LOCK.terrain, 'binding locks the strand');
  A(WEAVE.terrain === wt, 'binding does not change the strand');
  // the UI must refuse the reroll, which is what latPick disables — assert the state it reads
  A(WEAVE_LOCK.terrain && SIGILS.indexOf('reroll') >= 0,
    'a bound strand still shows an unspent reroll rather than eating it');

  // inversion is its own value, and is reversible
  SIGILS = ['invert', 'invert'];
  const wi = WEAVE.spawn;
  useSigil('invert', 'spawn'); closePanel();
  A(WEAVE.spawn === (~wi >>> 0), 'inversion mirrors the strand exactly');
  useSigil('invert', 'spawn'); closePanel();
  A(WEAVE.spawn === wi, 'inverting twice returns the original world');

  // echo needs a recorded past, and refuses gracefully without one
  META.echoes = {};
  SIGILS = ['echo'];
  const we = WEAVE.flux;
  useSigil('echo', 'flux'); closePanel();
  A(WEAVE.flux === we, 'echo with no recorded past changes nothing');
  A(SIGILS.length === 1, 'and returns the sigil rather than eating it');
  META.echoes.flux = 55555;
  useSigil('echo', 'flux'); closePanel();
  A(WEAVE.flux === 55555, 'echo restores a recorded strand');
  A(SIGILS.length === 0, 'and is consumed when it works');

  // grafting: the seed-scummer's dream, priced. Backing out must not eat the sigil.
  SIGILS = ['graft'];
  useSigil('graft', 'ore');
  A(SIGILS.length === 0, 'grafting takes the sigil while the keypad is open');
  graftCancel('ore'); closePanel();
  A(SIGILS.length === 1, 'and gives it back if you back out');
  useSigil('graft', 'ore');
  GRAFT_BUF = 'ABCDEF';
  const dg = DISSONANCE;
  graftGo('ore'); closePanel();
  A(WEAVE.ore === glyphSeed('ABCDEF'), 'a graft writes exactly the glyph you named');
  A(DISSONANCE === dg + SIGILS_DEF.graft.diss, 'and costs the most dissonance of any sigil');
  A(SIGILS_DEF.graft.diss > SIGILS_DEF.reroll.diss, 'authorship costs more than vandalism');
}

// ---------- 5. DISSONANCE ----------
console.log('\n-- dissonance --');
{
  newRun(); startRun(); OFF();
  A(dissStage().n === DISS_STAGES[0].n, 'a clean run is Quiet');
  // stages are ordered and every one is reachable
  for (let i = 1; i < DISS_STAGES.length; i++)
    A(DISS_STAGES[i].at > DISS_STAGES[i - 1].at, `stage ${i} sits above stage ${i - 1}`);
  const seen = new Set();
  for (let d = 0; d <= 140; d += 5) { DISSONANCE = d; seen.add(dissStage().n) }
  A(seen.size === DISS_STAGES.length, 'every dissonance stage is reachable');

  // the three effect channels switch on at their stated thresholds and nowhere else
  DISSONANCE = 0;
  A(dissSpeed() === 1 && dissBleed() === 0 && dissChurn() === 0, 'Quiet changes nothing');
  DISSONANCE = 30;
  A(dissSpeed() > 1, 'Stirring makes enemies faster');
  A(dissBleed() === 0 && dissChurn() === 0, 'and nothing else yet');
  DISSONANCE = 60;
  A(dissBleed() > 0, 'Bleeding lets other depths through');
  A(dissChurn() === 0, 'but the rock still holds');
  DISSONANCE = 90;
  A(dissChurn() > 0, 'Unstable makes the rock forget its shape');
  DISSONANCE = 140;
  A(dissSpeed() <= 1.5 && dissBleed() <= 0.45 && dissChurn() <= 0.6,
    'every channel is capped, so maximum dissonance is hostile rather than unplayable');

  // dissonance is bounded and never negative
  DISSONANCE = 0; addDissonance(1e6);
  A(DISSONANCE <= 140, 'dissonance is capped');
  A(DISSONANCE > 0, 'and accumulates');
  // it resets with the run — the world forgets, you do not
  newRun();
  A(DISSONANCE === 0 && SIGILS.length === 0 && WOVEN === 0, 'a new descent starts clean');
}

// ---------- 6. THE ESCAPE ----------
console.log('\n-- the escape --');
{
  newRun(); startRun();
  META.bosses = {}; DISSONANCE = 0;
  A(!canEscape(), 'you cannot leave a world you have not damaged');
  DISSONANCE = 120;
  A(!canEscape(), 'dissonance alone is not enough');
  META.bosses = { warden: 1, sporemother: 1, sentinel: 1 };
  A(canEscape(), 'thin world plus three fallen wardens opens the way');
  DISSONANCE = 60;
  A(!canEscape(), 'and it closes again if the world is not thin enough');

  DISSONANCE = 120;
  const s0 = META.shards, t0 = META.maxThreat || 0, e0 = META.escapes || 0;
  runDepth = 1500; WOVEN = 3;
  doEscape();
  A((META.escapes || 0) === e0 + 1, 'escaping is recorded');
  A(META.shards > s0, 'and tears loose a payout');
  A((META.maxThreat || 0) > t0, 'and raises the threat ceiling');
  A(!!META.seen.frag.escape, 'and writes the fragment you can only earn');
  const f = LORE.frag.find(x => x.id === 'escape');
  A(f && f.depth < 0, 'that fragment is not buried anywhere');
  newRun(); startRun();
}

// ---------- 7. INTEGRATION ----------
console.log('\n-- integration --');
{
  META.threat = 2; META.maxThreat = 5;
  for (const u of UNLOCKS) META.unlocks[u.id] = 1;
  newRun(); startRun(); OFF();
  // Run the world hard while rewriting it underneath, at maximum dissonance, and confirm the
  // game stays coherent — this is the state the endgame is actually played in.
  DISSONANCE = 110;
  const strands = STRANDS.map(s => s.k);
  for (let i = 0; i < 2400; i++) {
    HELD.mel = i % 6 < 2; HELD.jmp = i % 37 < 4;
    IN.tx = ((i / 50) | 0) % 2 ? 1 : -1;
    if (i % 300 === 0) { reweave(strands[(i / 300) % strands.length], (i * 2654435761) >>> 0) }
    sim(1 / 60);
    if (paused) { closePanel(true); paused = false }
  }
  HELD.mel = HELD.jmp = false; IN.tx = 0;
  console.log(`   2400 frames, ${WOVEN} rewrites at dissonance ${Math.round(DISSONANCE)}: ` +
    `chunks ${CHUNKS.size} EN ${EN.length} PROJ ${PROJ.length}`);
  const vals = [P.x, P.y, P.vx, P.vy, P.hp, P.fuel, P.focus, DISSONANCE];
  A(vals.every(v => typeof v === 'number' && isFinite(v)), 'no NaN while reality is being rewritten');
  A(EN.length <= 121 && PROJ.length <= 221 && PART.length <= 351, 'entity caps hold through rewrites');
  A(CHUNKS.size < 4000, `chunk map does not grow without bound (${CHUNKS.size})`);
  A(!P.dead || P.hp <= 0, 'player state is coherent');
  // every strand must still generate a legal world after being rewritten arbitrarily
  const broken = [];
  for (const k of strands) {
    WEAVE[k] = 0; CHUNKS.clear();
    const c = genChunk(20, 30);
    if (c.tiles.length !== CHUNK * CHUNK) broken.push(k + ':size');
    if (c.spawns.some(s => s.type !== 'chest' && s.type !== 'shrine' && !ENEMIES[s.type])) broken.push(k + ':spawn');
  }
  A(broken.length === 0, 'a zeroed strand still generates a legal world' + (broken.length ? ': ' + broken.join(',') : ''));
  deriveWeave(SEED); CHUNKS.clear();
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) { console.log('SUITE 9 FAILURES'); process.exit(1) }
console.log('ALL PASS');
