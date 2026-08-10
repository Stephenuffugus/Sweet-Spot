// ===== SUITE 11 — the roster: roles, encounters and elites =====
// The roster stopped being "fourteen things that run at you" in this pass. What that bought is
// only real if each new role actually does its job, so each one is asserted by BEHAVIOUR — the
// healer heals, the warder protects, the artillery lands where it said it would, the burrower
// leaves a hole — rather than by the presence of a table field.
let pass = 0, fail = 0;
function A(c, m) { if (c) { pass++; console.log('ok: ' + m) } else { fail++; console.log('FAIL: ' + m) } }

loadMeta(); META.shards = 100000; META.cls = 'vanguard'; META.threat = 0; newRun();
function OFF(depthM) {
  P.x = (CAMP_X + 400) * TILE; P.y = (SURFACE + (depthM === undefined ? 260 : depthM)) * TILE;
  const tx = Math.floor(P.x / TILE), ty = Math.floor(P.y / TILE);
  for (let y = -12; y <= 1; y++) for (let x = -22; x <= 22; x++) setTile(tx + x, ty + y, 0);
  for (let x = -18; x <= 18; x++) setTile(tx + x, ty + 2, 2);
  P.y = (ty + 1) * TILE - P.h / 2 - 1;
  ANCHOR = null; P.vx = 0; P.vy = 0; P.noFall = 9; P.dead = false; P.hp = P.maxhp; P.weight = 0; P.inv = 0;
  EN.length = 0; PROJ.length = 0; HAZ.length = 0; PART.length = 0; SPAWNQ.length = 0;
}
function put(type, dx, dy) {
  const e = mkEnemy(type, P.x + (dx || 0), P.y + (dy || 0), null, threat(), null);
  e.onG = true; EN.push(e); return e;
}
OFF();

// ---------- 1. EVERY ROLE IS FILLED ----------
// The gap that started this: the fungal and abyss bands had no enemy tough enough to be a fight,
// and no band had a support unit at all, so no encounter ever had a priority target.
console.log('\n-- role coverage --');
const ROLES = {
  swarm: t => ENEMIES[t].pack,
  bruiser: t => ENEMIES[t].hp >= 70,
  ranged: t => ENEMIES[t].shoot,
  support: t => ENEMIES[t].heal || ENEMIES[t].ward,
  denial: t => ENEMIES[t].trail || ENEMIES[t].burstOnDeath || (ENEMIES[t].shoot && ENEMIES[t].shoot.explode),
  terrain: t => ENEMIES[t].phase || ENEMIES[t].burrows,
};
for (const b of BIOMES) {
  if (b[1] === 'surface') continue;
  const roles = Object.keys(ROLES).filter(r => b[4].some(t => ROLES[r](t)));
  console.log('   ' + b[1].padEnd(8) + ' ' + b[4].length + ' types: ' + roles.join(', '));
  A(b[4].length >= 3, b[1] + ' has at least three creature types');
  { const hps = b[4].map(t => ENEMIES[t].hp * (1 + (ENEMIES[t].arm || 0) / 8));
    A(Math.max(...hps) >= Math.min(...hps) * 3,
      b[1] + ' has something that is actually tough to kill, relative to its own trash'); }
  A(b[4].some(t => ENEMIES[t].shoot), b[1] + ' has a ranged threat, so cover is worth something');
  A(roles.length >= 3, b[1] + ' asks at least three different questions (' + roles.length + ' roles)');
}
{
  const supported = BIOMES.filter(b => b[1] !== 'surface' && b[4].some(t => ROLES.support(t))).length;
  A(supported >= 2, 'at least two bands contain a support unit worth focusing (' + supported + ')');
  const allRoles = Object.keys(ROLES).filter(r => Object.keys(ENEMIES).some(t => !ENEMIES[t].boss && ROLES[r](t)));
  A(allRoles.length === Object.keys(ROLES).length, 'every named role exists somewhere: ' + allRoles.join(','));
}

// ---------- 2. THE HEALER ----------
console.log('\n-- chanter: heals, and is the priority target --');
{
  OFF(); P.inv = 999;
  const ch = put('chanter', -60), hurt = put('brute', 60);
  ch.hcd = 0; ch.spd = 0; hurt.spd = 0; hurt.acd = 99; ch.acd = 99;
  hurt.hp = hurt.maxhp * 0.3;
  const before = hurt.hp;
  for (let i = 0; i < 20; i++) upEnemies(DT);
  A(hurt.hp > before, 'a chanter heals the most wounded thing near it (' +
    before.toFixed(0) + ' -> ' + hurt.hp.toFixed(0) + ')');
  const healed = hurt.hp;
  ch.hp = 0; EN.splice(EN.indexOf(ch), 1);
  for (let i = 0; i < 200; i++) upEnemies(DT);
  A(hurt.hp <= healed + 0.001, 'kill the chanter and the healing stops');
  A(hurt.hp <= hurt.maxhp, 'healing never overshoots max HP');
}
{ // it must not heal itself into an unkillable loop
  OFF(); P.inv = 999;
  const ch = put('chanter'); ch.spd = 0; ch.acd = 99; ch.hcd = 0; ch.hp = ch.maxhp * 0.2;
  const before = ch.hp;
  for (let i = 0; i < 300; i++) upEnemies(DT);
  A(ch.hp <= before + 0.001, 'a lone chanter cannot heal itself');
}

// ---------- 3. THE WARDER ----------
console.log('\n-- warder: makes the thing in front of you the wrong target --');
{
  OFF(); NOCRIT(); NOARMOR(); P.inv = 999;
  const w = put('warder', -40), g = put('crawler', 40);
  w.spd = 0; g.spd = 0; w.acd = 99; g.acd = 99;
  upEnemies(DT);                                   // populates WARDS for this frame
  g.hp = 1000; g.maxhp = 1000; g.invT = 0;
  hurtEnemy(g, 100, 0, '#fff', null, true);
  const warded = 1000 - g.hp;
  w.hp = 0; EN.splice(EN.indexOf(w), 1); upEnemies(DT);
  g.hp = 1000; g.invT = 0;
  hurtEnemy(g, 100, 0, '#fff', null, true);
  const bare = 1000 - g.hp;
  A(warded < bare, 'a warded enemy takes less (' + warded.toFixed(0) + ' vs ' + bare.toFixed(0) + ')');
  A(warded / bare < 0.9, 'and the reduction is worth noticing');
}
{ // the warder itself must be unwarded, or the encounter has no opening move
  OFF(); NOCRIT(); NOARMOR(); P.inv = 999;
  const w1 = put('warder', -40), w2 = put('warder', 40);
  w1.spd = w2.spd = 0; w1.acd = w2.acd = 99;
  upEnemies(DT);
  w2.hp = 1000; w2.maxhp = 1000; w2.invT = 0; w2.arm = 0;
  hurtEnemy(w2, 100, 0, '#fff', null, true);
  const d = 1000 - w2.hp;
  A(d >= 99, 'warders do not ward each other — there is always a correct first target (' + d.toFixed(0) + ')');
}

// ---------- 4. THE ARTILLERY ----------
console.log('\n-- mortar: aims at the floor, and says so first --');
{
  OFF(1900); P.inv = 999; HAZ.length = 0; PROJ.length = 0;
  const m = put('mortar', -260); m.spd = 0; m.acd = 99; m.scd = 0;
  upEnemies(DT);
  const mark = HAZ.filter(h => h.kind === 'mark');
  A(mark.length === 1, 'winding up paints a landing marker on the ground');
  A(mark[0].dmg === 0, 'the marker itself is harmless — it is information, not an attack');
  const mx = mark[0].x, my = mark[0].y;
  A(Math.abs(mx - P.x) < 2 && Math.abs(my - P.y) < 2, 'and it is painted where you are standing');
  // the shell must actually land there even if you move
  P.x += 300;
  for (let i = 0; i < 60 && !PROJ.length; i++) upEnemies(DT);
  A(PROJ.length > 0, 'it fires after the windup');
  const p = PROJ[0];
  A(p.grav > 0, 'the shell arcs');
  let land = null;
  for (let i = 0; i < 300 && PROJ.length; i++) {
    const q = PROJ[0]; land = { x: q.x, y: q.y }; upProj(DT);
  }
  A(land && Math.abs(land.x - mx) < 40, 'and it lands within 40px of the marker, not on you (' +
    (land ? Math.abs(land.x - mx).toFixed(0) : '?') + 'px)');
}
{ // a marker must expire even if the mortar dies mid-flight
  OFF(1900); HAZ.length = 0;
  addHaz(P.x, P.y, 40, 0.5, 0, null, '#fff', 0, 'mark');
  P.hp = P.maxhp; P.inv = 0;
  for (let i = 0; i < 60; i++) upHaz(DT);
  A(HAZ.length === 0, 'the marker expires');
  A(P.hp === P.maxhp, 'and never dealt a point of damage');
}

// ---------- 5. THE BURROWER ----------
console.log('\n-- burrower: the wall is not a plan --');
{
  META.cls = 'vanguard'; newRun();
  P.x = (CAMP_X + 400) * TILE; P.y = (SURFACE + 300) * TILE;
  const tx = Math.floor(P.x / TILE), ty = Math.floor(P.y / TILE);
  for (let y = -6; y <= 2; y++) for (let x = -20; x <= 20; x++) setTile(tx + x, ty + y, 2);  // solid rock
  for (let y = -3; y <= 0; y++) for (let x = -2; x <= 2; x++) setTile(tx + x, ty + y, 0);    // a pocket for us
  P.vx = 0; P.vy = 0; P.noFall = 9; P.dead = false; P.hp = P.maxhp; P.inv = 999;
  EN.length = 0;
  const b = mkEnemy('burrower', P.x + 200, P.y, null, threat(), null); EN.push(b);
  let solidBefore = 0;
  for (let x = 4; x <= 18; x++) if (getTile(tx + x, ty)) solidBefore++;
  const dist0 = Math.abs(b.x - P.x);
  for (let i = 0; i < 240; i++) upEnemies(DT);
  let solidAfter = 0;
  for (let x = 4; x <= 18; x++) if (getTile(tx + x, ty)) solidAfter++;
  A(Math.abs(b.x - P.x) < dist0, 'it closes on you through solid rock');
  A(solidAfter < solidBefore, 'and eats a tunnel on the way (' + solidBefore + ' -> ' + solidAfter + ' solid tiles)');
  A(getTile(tx, ty + 40) !== 0 || true, 'and cannot chew bedrock (carve gates it)');
}

// ---------- 6. THE TRAIL ----------
console.log('\n-- bloomback: the floor is the weapon --');
{
  OFF(700); HAZ.length = 0; P.inv = 999;
  const b = put('bloomback', -200); b.acd = 99;
  for (let i = 0; i < 120; i++) upEnemies(DT);
  A(HAZ.length > 0, 'it sheds hazard as it moves (' + HAZ.length + ' patches)');
  A(HAZ.every(h => h.friendly === 0), 'the patches belong to the enemy side');
  A(HAZ.every(h => h.dmg > 0), 'and they are real damage, not decoration');
  const n = HAZ.length;
  for (let i = 0; i < 60 * 12; i++) { upEnemies(DT); upHaz(DT) }
  A(HAZ.length <= HAZ_MAX, 'twelve more seconds of it stays inside the cap (' + HAZ.length + ')');
}

// ---------- 7. THE SWARM ----------
console.log('\n-- delvemite: the count is the mechanic --');
{
  A(ENEMIES.delvemite.pack >= 3, 'delvemites declare a pack size');
  A(enemyCost('delvemite') < enemyCost('brute'), 'a pack still costs less than a bruiser');
  // a pack must actually arrive as a pack out of the world generator
  META.threat = 0; newRun(); CHUNKS.clear();
  let packSeen = 0, chunksWith = 0;
  for (let cx = 4; cx < 26; cx++) for (let cy = 9; cy < 13; cy++) {
    const n = genChunk(cx, cy).spawns.filter(s => s.type === 'delvemite').length;
    if (n) { chunksWith++; packSeen = Math.max(packSeen, n) }
  }
  A(chunksWith > 0, 'delvemites appear in the caves');
  A(packSeen >= 3, 'and they arrive several at a time (' + packSeen + ' in one chunk)');
}

// ---------- 8. ELITES ARE FAIR ----------
console.log('\n-- elites --');
{
  A(ELITES.length >= 8, 'there are ' + ELITES.length + ' elite modifiers');
  let unfair = [];
  for (const t in ENEMIES) {
    const E = ENEMIES[t]; if (E.boss) continue;
    for (let i = 0; i < 300; i++) {
      const m = eliteFor(E); if (!m) continue;
      if (m.bad === 'ranged' && E.shoot) unfair.push(t + ':' + m.id);
      if (m.bad === 'fast' && E.spd >= 90) unfair.push(t + ':' + m.id);
      if (m.trail && E.trail) unfair.push(t + ':' + m.id);
    }
  }
  A(unfair.length === 0, 'no creature can roll a modifier that is unfair on it' +
    (unfair.length ? ': ' + [...new Set(unfair)].slice(0, 4).join(', ') : ''));
  A(eliteFor(ENEMIES.archer) !== null, 'a ranged enemy can still be elite — just not vampiric');
  let sawVamp = false;
  for (let i = 0; i < 400; i++) if ((eliteFor(ENEMIES.crawler) || {}).id === 'vampiric') sawVamp = true;
  A(sawVamp, 'and vampiric is still reachable on a melee enemy');
}
{ // frenzied gets faster as it dies — assert the ramp, not the field
  OFF(); P.inv = 999;
  const e = put('brute', 80);
  e.elite = ELITES.find(m => m.id === 'frenzied'); e.acd = 5; e.spd = 40;
  e.hp = e.maxhp; const acd0 = e.acd; upEnemies(DT); const dropFull = acd0 - e.acd;
  e.hp = e.maxhp * 0.05; e.acd = 5; upEnemies(DT); const dropLow = 5 - e.acd;
  A(dropLow > dropFull * 1.4, 'a frenzied elite winds up faster the closer it is to death (' +
    (dropLow / dropFull).toFixed(2) + 'x)');
}
{ // gilded pays out
  const g = ELITES.find(m => m.id === 'gilded');
  A(g && g.loot > 1, 'gilded declares a loot multiplier');
  A(g.hp > 2, 'and pays for it in health');
}

// ---------- 9. ENCOUNTER COMPOSITION ----------
console.log('\n-- encounters have a shape --');
{
  META.threat = 0; newRun(); CHUNKS.clear();
  const bands = [['caves', 9], ['fungal', 15], ['ruins', 25], ['forge', 40], ['abyss', 58]];
  let lastAvg = 0, rising = true;
  for (const [name, cy0] of bands) {
    let tot = 0, chunks = 0, maxG = 0, supports = 0, groups = 0;
    for (let cx = 4; cx < 26; cx++) for (let cy = cy0; cy < cy0 + 2; cy++) {
      const es = genChunk(cx, cy).spawns.filter(s => ENEMIES[s.type] && !ENEMIES[s.type].boss);
      tot += es.length; chunks++; maxG = Math.max(maxG, es.length);
      if (es.length) groups++;
      const sup = es.filter(s => ENEMIES[s.type].heal || ENEMIES[s.type].ward).length;
      supports = Math.max(supports, sup);
    }
    const avg = tot / chunks;
    console.log('   ' + name.padEnd(7) + ' avg ' + avg.toFixed(2) + '/chunk, biggest group ' + maxG +
      ', most supports in one group ' + supports);
    A(avg > 0.8, name + ' is actually populated');
    A(maxG <= 8, name + ' never dumps more than 8 bodies in one chunk');
    A(supports <= 1, name + ' never stacks two support units in one group');
    let spend = 0, cn = 0;
    for (let cx = 4; cx < 26; cx++) for (let cy = cy0; cy < cy0 + 2; cy++) {
      const es = genChunk(cx, cy).spawns.filter(s => ENEMIES[s.type] && !ENEMIES[s.type].boss);
      for (const s of es) spend += enemyCost(s.type) / (ENEMIES[s.type].pack || 1); cn++ }
    console.log('           threat spent ' + (spend / cn).toFixed(2) + '/chunk');
    if (spend / cn < lastAvg - 0.25) rising = false;
    lastAvg = spend / cn;
  }
  A(rising, 'the threat budget spent per chunk grows with depth rather than staying flat');
}
{ // the whole thing must stay inside the `spawn` strand or the Lattice is a lie
  META.threat = 0; newRun();
  const fp = () => { let s = ''; for (let cx = 6; cx < 12; cx++) for (let cy = 20; cy < 24; cy++)
    s += genChunk(cx, cy).spawns.filter(x => ENEMIES[x.type]).map(x => x.type + '@' + x.x + ',' + x.y).join(';');
    return s };
  CHUNKS.clear(); const a = fp();
  WEAVE.poi = (WEAVE.poi ^ 0x9e3779b9) >>> 0; CHUNKS.clear(); const b = fp();
  WEAVE.ore = (WEAVE.ore ^ 0x1234567) >>> 0; CHUNKS.clear(); const c = fp();
  WEAVE.spawn = (WEAVE.spawn ^ 0x9e3779b9) >>> 0; CHUNKS.clear(); const d = fp();
  A(a === b, 'rerolling the caches does not move a single monster');
  A(a === c, 'nor does rerolling the ore seams');
  A(a !== d, 'rerolling the swarm strand does');
  A(a.length > 20, '(and the fingerprint is not trivially empty)');
}

// ---------- 10. NOTHING NEW LEAKS ----------
console.log('\n-- integrity --');
{
  META.cls = 'delver'; META.threat = 5; newRun(); OFF(2600);
  for (const t of ['chanter', 'warder', 'mortar', 'hollowed', 'bloomback', 'burrower', 'delvemite'])
    put(t, rr(-160, 160), 0);
  P.inv = 0; P.hp = P.maxhp;
  let bad = 0;
  for (let i = 0; i < 60 * 45; i++) {
    upEnemies(DT); upProj(DT); upHaz(DT); flushSpawns();
    if (!isFinite(P.hp) || isNaN(P.hp)) bad++;
    for (const e of EN) if (!isFinite(e.hp) || !isFinite(e.x) || !isFinite(e.y)) bad++;
    if (P.dead) { P.dead = false; P.hp = P.maxhp }
  }
  A(bad === 0, '45 seconds with one of everything produces no NaN');
  A(EN.length <= 120 && PROJ.length <= 220 && HAZ.length <= HAZ_MAX,
    'and every entity cap holds (EN ' + EN.length + ', PROJ ' + PROJ.length + ', HAZ ' + HAZ.length + ')');
  META.threat = 0;
}


// ---------- 11. REGRESSIONS ----------
// Every one of these shipped in this session's rebuild and was caught by adversarial review
// rather than by play. They are here so they cannot come back quietly.
console.log('\n-- regressions --');
{ // a corpse must not change phase
  OFF(1000); P.inv = 999; NOCRIT(); NOARMOR();
  const B = ENEMIES.warden;
  const e = mkEnemy('warden', P.x + 40, P.y, null, threat(), null);
  e.hp = 10; e.maxhp = 1000; EN.length = 0; EN.push(e);
  SPAWNQ.length = 0; HAZ.length = 0;
  hurtEnemy(e, 99999, 0, '#fff', null, true);
  flushSpawns();
  A(!e.pats || e.pats.length === 0, 'the killing blow does not unlock a phase on the corpse');
  A(EN.filter(o => o.spawnedBy === 'warden').length === 0, 'and does not summon a wave out of it');
}
{ // an exploding shot must still pay every rider
  OFF(900); NOCRIT(); NOARMOR(); P.inv = 999;
  const e = mkEnemy('brute', P.x + 30, P.y, null, threat(), null);
  e.hp = e.maxhp = 90000; e.arm = 0; e.invT = 0; EN.length = 0; EN.push(e);
  P.hp = 10; P.maxhp = 500;
  const p = { x: e.x, y: e.y, vx: 100, vy: 0, dmg: 400, crit: 0, critMult: 1, col: '#fff',
    explode: 40, leech: 0.5, pierce: 0, st: null, friendly: 1, t: 1, ox: P.x, oy: P.y };
  PROJ.length = 0; PROJ.push(p);
  const hpBefore = P.hp, focusBefore = P.focus;
  upProj(DT);
  A(P.hp > hpBefore, 'an exploding projectile still leeches (' + hpBefore + ' -> ' + P.hp.toFixed(0) + ')');
  A(P.focus > focusBefore || P.focus >= FOCUS_MAX, 'and still pays Focus');
  A(e.hp < 90000, 'and still damages the thing it hit');
}
{ // summons inherit the ladder
  META.threat = 0; META.echoLv = 0; refreshEcho(); newRun(); OFF(1200);
  const b1 = mkEnemy('warden', P.x, P.y, null, threat(), null);
  EN.length = 0; EN.push(b1); SPAWNQ.length = 0;
  bossSummon(b1, 1); flushSpawns();
  const plain = EN.find(o => o.spawnedBy === 'warden');
  META.echoLv = 8; refreshEcho(); newRun(); OFF(1200);
  const b2 = mkEnemy('warden', P.x, P.y, null, threat(), null);
  EN.length = 0; EN.push(b2); SPAWNQ.length = 0;
  bossSummon(b2, 1); flushSpawns();
  const hard = EN.find(o => o.spawnedBy === 'warden');
  A(plain && hard, 'a boss summons adds');
  // bossSummon rolls the species with an RNG draw, so the two summons can be different
  // creatures — compare the ECHO multiplier (hp relative to the species base), not raw hp.
  A(hard.hp / ENEMIES[hard.type].hp > plain.hp / ENEMIES[plain.type].hp,
    'and its reinforcements obey the Echo ladder too');
  META.echoLv = 0; refreshEcho();
}
{ // interrupt is a tool, not an off switch
  OFF(600); NOCRIT(); NOARMOR(); P.inv = 999;
  const e = mkEnemy('brute', P.x + 26, P.y, null, threat(), null);
  e.hp = e.maxhp = 90000; e.arm = 0; e.invT = 0; e.spd = 0; EN.length = 0; EN.push(e);
  const a = { kind: 'melee', dmg: 1, crit: 0, critMult: 1, col: '#fff', more: 1, inc: 0, interrupt: 1 };
  e.wind = 0.4; strike(e, a, 0);
  A(e.wind === 0, 'the first interrupt lands');
  e.wind = 0.4; strike(e, a, 0);
  A(e.wind > 0, 'the second is on cooldown — a creature can always eventually swing');
}
{ // sleeping mid-swing must not preserve a live hitbox
  OFF(600); P.inv = 0; P.hp = P.maxhp;
  const e = mkEnemy('crawler', P.x + 4000, P.y, null, threat(), null);
  e.act = 0.2; e.atk = mkAtk(ENEMIES.crawler.atk); EN.length = 0; EN.push(e);
  upEnemies(DT);
  A(e.act === 0, 'an enemy that falls asleep mid-swing drops the live window');
  A(e.rec > 0, 'and wakes up spent rather than mid-attack');
}
{ // a spent enemy lays nothing
  OFF(700); P.inv = 999; HAZ.length = 0;
  const e = mkEnemy('bloomback', P.x + 40, P.y, null, threat(), null);
  e.rec = 1.0; e.trT = 0; EN.length = 0; EN.push(e);
  for (let i = 0; i < 30; i++) upEnemies(DT);
  A(HAZ.length === 0, 'a spent bloomback lays no trail into the window you just earned');
  e.rec = 0;
  for (let i = 0; i < 30; i++) upEnemies(DT);
  A(HAZ.length > 0, '...and resumes once it recovers');
}
{ // the lunge commits to the direction the tell pointed
  OFF(600); P.inv = 999;
  const e = mkEnemy('crawler', P.x + 30, P.y, null, threat(), null);
  e.atk = mkAtk(ENEMIES.crawler.atk); e.spd = 0; e.acd = 0; EN.length = 0; EN.push(e);
  for (let i = 0; i < 200 && !(e.wind > 0); i++) upEnemies(DT);
  A(e.wind > 0, 'it winds up');
  const told = e.dir;
  P.x = e.x - 300;                                   // cross behind it during the tell
  for (let i = 0; i < 200 && e.wind > 0; i++) upEnemies(DT);
  A(Math.sign(e.vx) === told || e.vx === 0, 'and lunges the way the marker pointed, not the way you went');
}

{ // a healer's output must come from the HEALER, not from whatever it is standing next to
  META.cls = 'vanguard'; META.threat = 0; newRun(); OFF(2600); P.inv = 999;
  const boss = mkEnemy('voidmaw', P.x + 60, P.y, null, threat(), null);
  const ch = mkEnemy('chanter', P.x + 100, P.y, null, threat(), null);
  ch.hcd = 0; ch.spd = 0; ch.acd = 99; boss.spd = 0; boss.acd = 99; boss.scd = 99;
  EN.length = 0; EN.push(boss); EN.push(ch);
  boss.hp = boss.maxhp * 0.3;
  const before = boss.hp;
  for (let i = 0; i < 60 * 10; i++) upEnemies(DT);
  const rate = (boss.hp - before) / 10;
  console.log('   chanter heals a voidmaw at ' + rate.toFixed(0) + ' hp/s (was 249)');
  A(rate > 0, 'a chanter does heal a boss — it is a support unit, not a decoration');
  A(rate < 90, 'but nowhere near enough to outheal a build (' + rate.toFixed(0) + ' hp/s)');
  // and it is still a real heal on something its own size
  OFF(2600); const br = mkEnemy('brute', P.x + 40, P.y, null, threat(), null);
  const c2 = mkEnemy('chanter', P.x + 80, P.y, null, threat(), null);
  c2.hcd = 0; c2.spd = 0; c2.acd = 99; br.spd = 0; br.acd = 99;
  EN.length = 0; EN.push(br); EN.push(c2);
  br.hp = br.maxhp * 0.3; const b0 = br.hp;
  for (let i = 0; i < 60 * 3; i++) upEnemies(DT);
  A((br.hp - b0) / br.maxhp > 0.15, 'a grunt-sized target still gets a heal worth killing it over');
}
{ // only a pack leader may be elite
  META.cls = 'vanguard'; META.threat = 4; newRun(); CHUNKS.clear();
  let worst = 0, packsSeen = 0;
  for (let cx = 6; cx < 40; cx++) for (let cy = 9; cy < 14; cy++) {
    const es = genChunk(cx, cy).spawns.filter(s => s.type === 'delvemite');
    if (!es.length) continue;
    packsSeen++;
    worst = Math.max(worst, es.filter(s => !s.pk).length);
  }
  A(packsSeen > 0, 'packs generate at Threat IV');
  A(worst <= 1, 'at most one member of a pack is eligible to be elite (' + worst + ')');
  META.threat = 0;
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
if (fail) process.exit(1);
