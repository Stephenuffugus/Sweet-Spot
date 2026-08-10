// ===== SUITE 10 — combat foundations: the three beats, the two curves, and TTK =====
// This is the suite that stops balance being vibes. It asserts the things a player experiences
// as fairness: that a telegraph tells the truth, that a tell is longer than human reaction time,
// that a spent enemy is punishable, that armour is never an off switch, and that time-to-kill
// and time-to-die stay inside a designed band at every depth for every class.
let pass = 0, fail = 0;
function A(c, m) { if (c) { pass++; console.log('ok: ' + m) } else { fail++; console.log('FAIL: ' + m) } }
const near = (a, b, tol) => Math.abs(a - b) <= (tol === undefined ? 0.001 : tol);

loadMeta(); META.shards = 100000; META.cls = 'vanguard'; newRun();
function OFF(depthM) {
  P.x = (CAMP_X + 400) * TILE; P.y = (SURFACE + (depthM === undefined ? 260 : depthM)) * TILE;
  const tx = Math.floor(P.x / TILE), ty = Math.floor(P.y / TILE);
  for (let y = -6; y <= 1; y++) for (let x = -14; x <= 14; x++) setTile(tx + x, ty + y, 0);
  for (let x = -14; x <= 14; x++) setTile(tx + x, ty + 2, 2);
  P.y = (ty + 1) * TILE - P.h / 2 - 1;
  ANCHOR = null; P.vx = 0; P.vy = 0; P.noFall = 9; P.dead = false; P.hp = P.maxhp; P.weight = 0; P.inv = 0;
  EN.length = 0; PROJ.length = 0; HAZ.length = 0;
}
function mkE(o) {
  return Object.assign({ x: P.x + 30, y: P.y, vx: 0, vy: 0, w: 14, h: 12, type: 'crawler', ai: 'walk', c: '#fff',
    hp: 5000, maxhp: 5000, dmg: 0, arm: 0, spd: 0, onG: false, flash: 0, dir: -1, boss: false, elite: null,
    shoot: null, scd: 99, atk: null, acd: 99, wind: 0, act: 0, rec: 0, invT: 0, phase: 0, ph: null, st: null }, o || {});
}
OFF();

// ---------- 1. TELEGRAPH HONESTY ----------
// The ground marker used to draw `range` while the enemy lunged on the active frame, so standing
// just outside the marker was not safe on a single enemy in the game. Reach is the contract now.
console.log('\n-- telegraph honesty --');
let worstLie = 0, worstName = '', maxGruntReach = 0, maxBossReach = 0;
for (const id in ENEMIES) {
  const E = ENEMIES[id]; if (!E.atk) continue;
  const reach = atkReach(E.atk), lie = reach / E.atk.range;
  if (lie > worstLie) { worstLie = lie; worstName = id }
  if (E.boss) maxBossReach = Math.max(maxBossReach, reach); else maxGruntReach = Math.max(maxGruntReach, reach);
}
console.log('   worst marker/reach ratio: ' + worstName + ' ' + worstLie.toFixed(2) + 'x  ' +
  '| max grunt reach ' + maxGruntReach.toFixed(0) + 'px, max boss reach ' + maxBossReach.toFixed(0) + 'px');
A(atkReach({ range: 26, lunge: 260, act: 0.16 }) === 26 + 260 * 0.16, 'atkReach is range + lunge x act');
A(atkReach(null) === 0, 'atkReach survives an enemy with no attack');
// The marker is honest by construction now (render draws atkReach), so what is left to police is
// that reach itself stays inside a dodgeable distance — a 93px lunge on a 272px-wide view is a
// third of the screen crossed during a frame you cannot react to.
A(maxGruntReach <= 78, 'no grunt reaches further than 78px (was 93 on rockling)');
A(maxBossReach <= 105, 'no boss reaches further than 105px');
for (const id in ENEMIES) {
  const E = ENEMIES[id]; if (!E.atk) continue;
  A(atkReach(E.atk) >= E.atk.range, id + ': reach is never shorter than range');
}

// ---------- 2. THE WINDUP FLOOR ----------
// ~250ms is the accepted floor for a simple visual reaction. A tell below it is not a tell.
console.log('\n-- windup floor --');
let minWind = 9, minWindT5 = 9;
for (const id in ENEMIES) {
  const E = ENEMIES[id]; if (!E.atk) continue;
  minWind = Math.min(minWind, mkAtk(E.atk, THREATS[0]).wind);
  minWindT5 = Math.min(minWindT5, mkAtk(E.atk, THREATS[5]).wind);
}
console.log('   shortest windup: ' + minWind.toFixed(3) + 's at Threat 0, ' + minWindT5.toFixed(3) + 's at Threat V');
A(minWind >= WINDUP_FLOOR - 1e-9, 'every windup clears the floor at Threat 0');
A(minWindT5 >= WINDUP_FLOOR - 1e-9, 'every windup STILL clears the floor at Threat V');
A(THREATS[3].wind === undefined && THREATS[5].wind === undefined,
  'no Threat tier shortens a windup any more');
A(THREATS[3].rec < 1 && THREATS[5].rec < 1, 'Threat III and V shorten RECOVERY instead');
A(mkAtk({ cd: 1, range: 20, wind: 0.10, act: 0.1, kb: 1 }, THREATS[0]).wind === WINDUP_FLOOR,
  'a table entry below the floor is clamped up, not trusted');

// ---------- 3. THE PUNISH WINDOW ----------
console.log('\n-- recovery --');
OFF(); NOCRIT();
{
  const e = mkE({ atk: mkAtk(ENEMIES.crawler.atk), dmg: 5, hp: 900, maxhp: 900, acd: 0, spd: 0 });
  EN.length = 0; EN.push(e);
  P.inv = 99;                                  // we are testing the enemy's state machine, not damage
  let sawWind = false, sawAct = false, sawRec = false;
  for (let i = 0; i < 200 && !sawRec; i++) {
    upEnemies(DT);
    if (e.wind > 0) sawWind = true;
    if (e.act > 0) sawAct = true;
    if (sawAct && e.rec > 0) sawRec = true;
  }
  A(sawWind, 'an enemy winds up');
  A(sawAct, 'then its strike goes live');
  A(sawRec, 'then it is SPENT — the third beat exists');
  // while spent it must not be able to start another attack
  const windAtRec = e.wind;
  let startedNew = false;
  for (let i = 0; i < 6; i++) { upEnemies(DT); if (e.wind > windAtRec) startedNew = true }
  A(!startedNew, 'a spent enemy cannot begin a new windup');
  // and it takes more damage
  NOARMOR(); e.rec = 0.3; e.hp = 1000; e.invT = 0;
  hurtEnemy(e, 100, 0, '#fff', null, true); const spentDmg = 1000 - e.hp;
  e.rec = 0; e.hp = 1000; e.invT = 0;
  hurtEnemy(e, 100, 0, '#fff', null, true); const freshDmg = 1000 - e.hp;
  A(near(spentDmg / freshDmg, RECOVER_DMG, 0.02), 'hitting a spent enemy pays ' + RECOVER_DMG + 'x (' +
    freshDmg.toFixed(0) + ' -> ' + spentDmg.toFixed(0) + ')');
}
{ // a shooter cannot snipe you out of its own recovery
  OFF();
  const e = mkE({ shoot: Object.assign({}, ENEMIES.archer.shoot), scd: 0, rec: 0.5, atk: null });
  EN.length = 0; EN.push(e); PROJ.length = 0;
  for (let i = 0; i < 10; i++) upEnemies(DT);
  A(PROJ.length === 0, 'a spent enemy cannot shoot either');
  e.rec = 0;
  for (let i = 0; i < 120; i++) upEnemies(DT);
  A(PROJ.length > 0, '...and shoots again once it has recovered');
}

// ---------- 4. ARMOUR IS NEVER AN OFF SWITCH ----------
console.log('\n-- armour floor --');
A(applyArmor(100, 0) === 100, 'no armour changes nothing');
A(applyArmor(100, 40) === 60, 'flat subtraction still applies in the normal band');
A(near(applyArmor(100, 1000), 100 * ARMOR_MIN_FRAC),
  'armour can never remove more than ' + ((1 - ARMOR_MIN_FRAC) * 100).toFixed(0) + '% of a hit');
A(near(applyArmor(20, 999), 20 * ARMOR_MIN_FRAC), 'the floor is proportional, not a flat constant');
A(applyArmor(100, 999) / applyArmor(20, 999) === 5, 'a hit five times bigger still lands five times harder');
A(applyArmor(0.4, 999) === ARMOR_FLOOR, 'and never drops below the absolute floor');
{ // the floor protects the player from being one-shot-proof too — it applies to both sides
  OFF(); NOCRIT();
  const e = mkE({ arm: 9999, hp: 10000, maxhp: 10000, invT: 0 });
  EN.length = 0; EN.push(e);
  hurtEnemy(e, 200, 0, '#fff', null, true);
  A(near(10000 - e.hp, 200 * ARMOR_MIN_FRAC, 0.5),
    'enemy armour obeys the same floor (an Armoured elite is a wall, not an immunity)');
}

// ---------- 5. CRIT DAMAGE IS SOFTLY CAPPED ----------
console.log('\n-- crit soft cap --');
A(softCrit(2.0) === 2.0, 'below the cap, crit multiplier is untouched');
A(softCrit(CRIT_SOFT) === CRIT_SOFT, 'the cap itself is exact');
A(near(softCrit(CRIT_SOFT + 4), CRIT_SOFT + 4 * CRIT_SOFT_RATE), 'past the cap each point is worth a quarter');
A(softCrit(20) < 9, 'and it cannot run away (20x raw -> ' + softCrit(20).toFixed(2) + 'x)');
{
  OFF();
  EQ.melee = mkItem('sword', 0); EQ.armor = mkItem('vest', 0);
  RUNB = RUNB0(); RUNB.critMult = 12; META.tree = {}; refreshAttacks();
  A(ATK.melee.critMult < CRIT_SOFT + 3, 'a stacked crit-damage build lands at ' +
    ATK.melee.critMult.toFixed(2) + 'x, not 13.8x');
  RUNB = RUNB0(); refreshAttacks();
}

// ---------- 6. THE TWO DEPTH CURVES ----------
console.log('\n-- depth scaling --');
const Y = m => (SURFACE + m) * TILE;
console.log('   depth |   HP  |  dmg  | ratio');
for (const m of [0, 400, 900, 1600, 2400, 3140]) {
  console.log('   ' + String(m).padStart(5) + ' | ' + depthHP(Y(m)).toFixed(2) + 'x | ' +
    depthDmg(Y(m)).toFixed(2) + 'x | ' + (depthHP(Y(m)) / depthDmg(Y(m))).toFixed(2));
}
A(near(depthHP(Y(0)), 1) && near(depthDmg(Y(0)), 1), 'both curves start at 1x on the surface');
A(near(depthHP(Y(900)), 2.25, 0.15), 'HP is ~2.25x at 900m');
A(near(depthDmg(Y(900)), 1.62, 0.1), 'damage is ~1.6x at 900m');
A(near(depthHP(Y(3140)), 6.2, 0.4), 'HP reaches ~6.2x at the floor');
A(near(depthDmg(Y(3140)), 2.8, 0.2), 'damage reaches only ~2.8x at the floor');
for (const m of [400, 900, 1600, 2400, 3140]) {
  A(depthHP(Y(m)) > depthDmg(Y(m)), m + 'm: deep enemies are tougher, not deadlier');
}
{ // monotone and finite everywhere, including silly inputs
  let mono = true;
  for (let m = 0; m < 3200; m += 40) if (depthHP(Y(m + 40)) <= depthHP(Y(m))) mono = false;
  A(mono, 'the HP curve is monotone the whole way down');
  A(isFinite(depthHP(Y(-500))) && depthHP(Y(-500)) === 1, 'above the surface is clamped, not negative');
}

// ---------- 7. TIME TO KILL / TIME TO DIE ----------
// The band targets are PLAN.md 4.3. A representative build is assembled per depth: the class kit,
// depth-appropriate gems, the tree spend a player would realistically have, and the in-run level
// they would realistically be. If this table drifts out of band, the game got harder or softer.
console.log('\n-- TTK / TTD --');
// `tough` is the highest-HP grunt actually in that band's roster, looked up rather than named,
// so this table cannot quietly go stale when the rosters change — and so a band with no tough
// enemy at all shows up as an absurd number instead of hiding.
// TWO different questions, so two different lookups. Time-to-kill is about the band's beefiest
// enemy; time-to-die is about its most dangerous one, and those are rarely the same creature —
// measuring both against "highest HP" is how a band of 6-damage spitters passed for a threat.
function toughestOf(biome) {
  const B = BIOMES.find(b => b[1] === biome); let best = null;
  for (const t of B[4]) if (!best || ENEMIES[t].hp > ENEMIES[best].hp) best = t;
  return best;
}
function deadliestOf(biome) {
  const B = BIOMES.find(b => b[1] === biome); let best = null;
  for (const t of B[4]) if (!best || ENEMIES[t].dmg > ENEMIES[best].dmg) best = t;
  return best;
}
const BANDS = [
  { m: 200, biome: 'caves', grunt: 'crawler', lvl: 4, tree: 1, gems: 1, tier: 1, boons: 0 },
  { m: 700, biome: 'fungal', grunt: 'sporeling', lvl: 7, tree: 2, gems: 2, tier: 1, boons: 1 },
  { m: 1200, biome: 'ruins', grunt: 'archer', lvl: 10, tree: 3, gems: 2, tier: 2, boons: 2 },
  { m: 1900, biome: 'forge', grunt: 'ember', lvl: 12, tree: 4, gems: 3, tier: 2, boons: 3 },
  { m: 2800, biome: 'abyss', grunt: 'voidspawn', lvl: 14, tree: 5, gems: 3, tier: 3, boons: 4 },
];
for (const b of BANDS) { b.tough = toughestOf(b.biome); b.deadly = deadliestOf(b.biome) }
// The reference build is the honest question "what would a competent player actually be holding
// at this depth?". Too pessimistic and the test demands the game be too easy; too generous and it
// waves through a difficulty wall. Gear rarity, gem count, gem tier, tree spend, in-run levels and
// shrine boons all move together with depth, because in a real run they do.
function build(cls, band) {
  META.cls = cls; META.threat = 0; newRun();
  OFF(band.m);
  META.tree = {};
  const br = (cls === 'marksman' || cls === 'pyromancer' || cls === 'conductor') ? 's' : cls === 'delver' ? 'c' : 'm';
  for (let i = 1; i <= band.tree; i++) META.tree[br + i] = 1;
  RUNB = RUNB0();
  RUNB.dmg = 0.15 * Math.floor(band.lvl / 2) + 0.25 * band.boons;   // attunements + Wrath-class boons
  RUNB.hp = 30 * Math.floor(band.lvl / 3);
  RUNB.cdr = 0.12 * Math.floor(band.lvl / 4);
  RUNB.crit = 0.06 * Math.floor(band.lvl / 5);
  RUNB.critMult = 0.35 * Math.floor(band.lvl / 6);
  const wslot = (cls === 'marksman' || cls === 'pyromancer' || cls === 'conductor') ? 'ranged' : 'melee';
  // gear keeps pace: magic by the ruins, rare by the forge
  const baseId = EQ[wslot] ? EQ[wslot].base : (wslot === 'melee' ? 'sword' : 'bow');
  EQ[wslot] = mkItem(baseId, band.tree >= 4 ? 2 : band.tree >= 2 ? 1 : 0);
  const it = EQ[wslot];
  const SUP = ['conc', 'fasteratk', 'addedfire'];
  for (let i = 0; i < Math.min(band.gems, it.sockets.length); i++) {
    it.sc[i] = GEMS[SUP[i]].col; it.sockets[i] = { id: SUP[i], tier: band.tier };
  }
  P.maxhp = maxHP(); P.hp = P.maxhp; refreshAttacks();
  return ATK[wslot] || ATK.melee || ATK.ranged;
}
function hitsToKill(a, type, m, elite) {
  const E = ENEMIES[type], y = Y(m);
  const hp = E.hp * depthHP(y) * (elite ? 3 : 1);
  const arm = (E.arm || 0) + (elite ? 9 : 0);
  const hits = (a.count || 1) * (1 + Math.min(3, a.pierce || 0) * 0.15);
  // Conditional supports are most of a real build's damage now, and a fight that lasts more than
  // one swing SATISFIES them — the target is burning because this attack set it on fire, and it
  // spends half the fight below half health. Modelling them as never active understates every
  // build in the game by a third and turns the TTK band into fiction.
  let sustain = 1;
  if (a.vsBurn && a.stR && a.stR.burn) sustain *= 1 + a.vsBurn;
  if (a.vsChill && a.st && a.st.chill) sustain *= 1 + a.vsChill;
  if (a.vsLow) sustain *= 1 + a.vsLow * 0.5;
  const avg = a.dmg * (1 + a.crit * (a.critMult - 1)) * (a.twin ? 1.6 : 1) * sustain;
  const per = applyArmor(avg, arm) * hits;
  return { n: Math.ceil(hp / Math.max(0.01, per)), secs: Math.ceil(hp / Math.max(0.01, per)) * a.cd };
}
function hitsToDie(type, m) {
  const E = ENEMIES[type];
  const dmg = E.dmg * depthDmg(Y(m));
  return Math.ceil(P.maxhp / Math.max(1, applyArmor(dmg, P.armor || 0)));
}
let ttkFails = 0, ttdFails = 0;
for (const cls of ['vanguard', 'marksman', 'pyromancer', 'delver', 'conductor', 'bloodletter']) {
  console.log('   ' + cls.toUpperCase());
  for (const band of BANDS) {
    const a = build(cls, band);
    const g = hitsToKill(a, band.grunt, band.m), t = hitsToKill(a, band.tough, band.m);
    const e = hitsToKill(a, band.grunt, band.m, true);
    const d = hitsToDie(band.deadly, band.m);
    console.log('     ' + String(band.m).padStart(4) + 'm  trash ' + String(g.n).padStart(2) + ' hits/' +
      g.secs.toFixed(1) + 's   tough ' + String(t.n).padStart(2) + '   elite ' + String(e.n).padStart(2) +
      '   die in ' + String(d).padStart(2) + ' (' + band.deadly + ')  hp ' + String(P.maxhp).padStart(3) +
      ' arm ' + String(P.armor | 0).padStart(2) + ' dps ' + dpsOf(a));
    if (g.n < 1 || g.n > 6) { ttkFails++; console.log('       ^ trash out of band') }
    if (t.n < 3 || t.n > 16) { ttkFails++; console.log('       ^ tough out of band') }
    if (d < 4 || d > 20) { ttdFails++; console.log('       ^ TTD out of band') }
  }
}
A(ttkFails === 0, 'every class kills trash in 1-6 and tough in 3-16 hits at every depth (' + ttkFails + ' out of band)');
A(ttdFails === 0, 'every class survives 4-20 hits from its band\'s deadliest enemy (' + ttdFails + ' out of band)');

// ---------- 8. BOSS PHASES DO SOMETHING ----------
console.log('\n-- boss phases --');
META.cls = 'vanguard'; newRun(); OFF(1000);
{
  const B = ENEMIES.warden;
  const e = mkE({ type: 'warden', boss: 1, w: B.w, h: B.h, hp: 1000, maxhp: 1000,
    dmg: 20, atk: mkAtk(B.atk), shoot: Object.assign({}, B.shoot), ph: B.ph, scd: 99, acd: 99 });
  EN.length = 0; EN.push(e); P.inv = 999;
  A(!e.pats, 'phase 1: no patterns');
  e.hp = 600; bossPhase(e);
  A(e.pats && e.pats.length === 1 && e.pats[0] === 'slam', 'phase 2 unlocks slam and REMEMBERS it');
  e.hp = 300; bossPhase(e);
  A(e.pats.length === 2 && e.pats.indexOf('summon') >= 0, 'phase 3 ADDS summon — it does not replace slam');
  A(bossPat(e, 'slam') && bossPat(e, 'summon'), 'both patterns are still live in the final phase');
  // the ongoing hook must actually produce something
  HAZ.length = 0; SPAWNQ.length = 0; EN.length = 1;
  let ticks = 0;
  for (let i = 0; i < 60 * 12; i++) { bossOngoing(e, DT, 20, 0, 20); ticks++ }
  flushSpawns();
  A(EN.length > 1, 'summon trickles adds over time (' + (EN.length - 1) + ' after 12s), not one burst at the transition');
  let mine = 0; for (const o of EN) if (o.spawnedBy === 'warden') mine++;
  A(mine <= 4, 'and it is capped, so a long fight cannot bury you in adds (' + mine + ')');
}
{ // every named pattern must be implemented — a phase that names a pattern nothing handles is a lie
  const impl = ['slam', 'volley', 'spores', 'firewall', 'summon', 'beam', 'devour', 'press', 'seal'];
  let unhandled = [];
  for (const id in ENEMIES) { const E = ENEMIES[id]; if (!E.ph) continue;
    for (const p of E.ph) if (impl.indexOf(p.pat) < 0) unhandled.push(id + ':' + p.pat) }
  A(unhandled.length === 0, 'every boss phase names a pattern that exists (' + (unhandled.join(',') || 'all good') + ')');
  for (const p of impl) A(!!PAT_NAME[p], p + ' has a player-facing callout');
}
{ // slam leaves a floor hazard you can jump, not an unavoidable tax
  OFF(1000); HAZ.length = 0;
  const e = mkE({ type: 'warden', boss: 1, dmg: 30, hp: 500, maxhp: 500 });
  bossSlam(e);
  A(HAZ.length === 1 && HAZ[0].kind === 'shock', 'slam leaves a ground shockwave hazard');
  A(HAZ[0].friendly === 0, 'and it belongs to the enemy side');
}

// ---------- 9. HAZARDS ----------
console.log('\n-- hazards --');
{
  OFF(); HAZ.length = 0;
  addHaz(P.x, P.y, 40, 1.0, 10, null, '#fff', 0, 'fire');
  A(HAZ.length === 1, 'a hazard can be placed');
  P.inv = 0; P.hp = P.maxhp;
  for (let i = 0; i < 30; i++) upHaz(DT);
  A(P.hp < P.maxhp, 'standing in it hurts');
  const hpAfter = P.hp;
  P.x += 400;
  for (let i = 0; i < 30; i++) upHaz(DT);
  A(P.hp === hpAfter, 'leaving it stops the damage');
  for (let i = 0; i < 120; i++) upHaz(DT);
  A(HAZ.length === 0, 'and it expires');
}
{ // friendly hazards hit enemies, not you
  OFF(); HAZ.length = 0; P.hp = P.maxhp; P.inv = 0;
  const e = mkE({ hp: 500, maxhp: 500, invT: 0 }); EN.length = 0; EN.push(e);
  addHaz(P.x + 20, P.y, 60, 1.0, 20, null, '#fff', 1, 'fire');
  for (let i = 0; i < 40; i++) upHaz(DT);
  A(e.hp < 500, 'a friendly hazard damages enemies');
  A(P.hp === P.maxhp, 'and never the player');
}
{ // the cap holds
  OFF(); HAZ.length = 0;
  for (let i = 0; i < HAZ_MAX * 3; i++) addHaz(P.x, P.y, 10, 5, 1, null, '#fff', 0, 'cloud');
  A(HAZ.length === HAZ_MAX, 'the hazard array is capped at ' + HAZ_MAX);
}
{ // a long fight cannot leak hazards
  OFF(1500); HAZ.length = 0; EN.length = 0;
  const B = ENEMIES.forgelord;
  const e = mkE({ type: 'forgelord', boss: 1, w: B.w, h: B.h, hp: 9e9, maxhp: 9e9, dmg: 20,
    atk: mkAtk(B.atk), shoot: Object.assign({}, B.shoot), ph: B.ph, scd: 99, acd: 99, vx: 40 });
  e.pats = ['firewall', 'slam']; e.patT = {};
  EN.push(e); P.inv = 999;
  for (let i = 0; i < 60 * 90; i++) { bossOngoing(e, DT, 30, 0, 30); upHaz(DT) }
  A(HAZ.length <= HAZ_MAX, '90 seconds of firewall stays inside the cap (' + HAZ.length + ')');
  A(isFinite(P.hp) && !isNaN(P.hp), 'and nothing leaks NaN into the player');
}

// ---------- 10. NOTHING IN THE PIPELINE PRODUCES NaN ----------
console.log('\n-- integrity --');
{
  META.cls = 'pyromancer'; META.threat = 5; newRun(); OFF(2600);
  EQ.melee = mkItem('greataxe', 2); EQ.ranged = mkItem('wand', 2); EQ.armor = mkItem('robe', 2);
  for (const sl of ['melee', 'ranged', 'armor']) { const it = EQ[sl];
    for (let i = 0; i < it.sockets.length; i++) { it.sc[i] = 'b'; it.sockets[i] = { id: 'addedfire', tier: 3 } } }
  refreshAttacks();
  let bad = 0;
  for (const k of ['melee', 'ranged']) { const a = ATK[k]; if (!a) continue;
    for (const f of ['dmg', 'cd', 'crit', 'critMult']) if (!isFinite(a[f])) bad++ }
  A(bad === 0, 'a fully tiered Threat V build produces finite numbers everywhere');
  A(ATK.melee.critMult <= CRIT_SOFT + 2, 'and its crit multiplier is still capped');
  META.threat = 0;
}

// ---------- THE WEFT: the hits band is the truth ----------
console.log('\n-- the weft --');
{
  // reference band-5 build; tune ENEMIES.weft.hp ONLY if this drifts
  const at = build('vanguard', BANDS[BANDS.length - 1]);
  NOCRIT();
  const liveHP = ENEMIES.weft.hp * depthHP(MG.ty * TILE);
  const perHit = Math.max(1, ATK.melee.dmg - ENEMIES.weft.arm);
  const H = Math.ceil(liveHP / perHit);
  console.log('   weft live hp ' + Math.round(liveHP) + ', reference per-hit ' + perHit.toFixed(0) + ' -> ' + H + ' hits');
  A(H >= 90 && H <= 320, 'the weft dies in the designed band (' + H + ' hits, want 90-320)');
  A(atkReach(ENEMIES.weft.atk) <= 105, 'the weft honors the boss reach cap');
  const press = applyArmor(34 * depthDmg(MG.ty * TILE) * 1.1, P.armor || 0);
  A(press < P.maxhp * 0.55, 'the press stays under the boss-heavy clamp (' + press.toFixed(0) + ' vs ' + (P.maxhp * 0.55).toFixed(0) + ')');
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
if (fail) process.exit(1);
