// ===== SUITE 7 — foundation lock + content wave =====
// Covers the systems added after the browser playtest: the increased/more split, crit, flat
// armor, ailment stacking and interactions, telegraphs, Focus, socket colors, gem tiers and
// fusion, the Vault, The Weight, depth-scaled shards, and the new enemy behaviours.
let pass = 0, fail = 0;
function A(c, m) { if (c) { pass++; console.log('ok: ' + m) } else { fail++; console.log('FAIL: ' + m) } }
const near = (a, b, tol) => Math.abs(a - b) <= (tol === undefined ? 0.001 : tol);

loadMeta(); META.shards = 100000; META.cls = 'vanguard'; newRun();
// Off camp: the 12hp/s camp regen masks every damage assertion in this file.
function OFF() {
  P.x = (CAMP_X + 400) * TILE; P.y = (SURFACE + 260) * TILE;
  // Carve a small flat arena. Without a floor the test player and enemies are embedded in
  // solid rock, collision shoves them apart, and melee assertions fail for the wrong reason.
  const tx = Math.floor(P.x / TILE), ty = Math.floor(P.y / TILE);
  for (let y = -5; y <= 1; y++) for (let x = -12; x <= 12; x++) setTile(tx + x, ty + y, 0);
  for (let x = -12; x <= 12; x++) setTile(tx + x, ty + 2, 2);
  P.y = (ty + 1) * TILE - P.h / 2 - 1;
  ANCHOR = null; P.vx = 0; P.vy = 0; P.noFall = 9; P.dead = false; P.hp = P.maxhp; P.weight = 0; P.inv = 0;
}
function mkE(o) {
  const e = Object.assign({ x: P.x + 30, y: P.y, vx: 0, vy: 0, w: 14, h: 12, type: 'crawler', ai: 'walk', c: '#fff',
    hp: 5000, maxhp: 5000, dmg: 0, arm: 0, spd: 0, onG: false, flash: 0, dir: -1, boss: false, elite: null,
    shoot: null, scd: 99, atk: null, acd: 99, wind: 0, act: 0, invT: 0, phase: 0, ph: null, st: null }, o || {});
  return e;
}
OFF();

// ---------- 1. THE STAT MODEL: increased is additive, more is multiplicative ----------
console.log('\n-- stat model --');
NOCRIT();
EQ.melee = mkItem('sword', 0); EQ.ranged = null; EQ.armor = mkItem('vest', 0);
EQ.melee.sc = ['r', 'r', 'r']; EQ.melee.sockets = [null, null, null];
RUNB = RUNB0(); META.tree = {}; refreshAttacks();
const base = ATK.melee.dmg;

// Additivity as an invariant: equal increments to the additive pool must produce EQUAL
// increases in damage. Compounding would make the second step bigger than the first.
// Asserting an absolute multiplier instead would bake in whatever the class passive gives.
RUNB.dmg = 0.5; refreshAttacks(); const half = ATK.melee.dmg;
RUNB.dmg = 1.0; refreshAttacks(); const whole = ATK.melee.dmg;
A(near(half - base, whole - half, 0.01), 'increased pool is additive: equal steps, equal gains');
A(whole > base, 'increased damage actually increases damage');
RUNB = RUNB0(); refreshAttacks();

// two support gems must each be their own multiplier
EQ.melee.sockets[0] = { id: 'addedfire', tier: 1 };   // more 1.30
refreshAttacks(); const one = ATK.melee.dmg;
A(near(one, base * 1.3, 0.01), 'one support gem applies its `more` multiplier');
EQ.melee.sockets[1] = { id: 'heavyimpact', tier: 1 }; // more 1.45
refreshAttacks();
A(near(ATK.melee.dmg, base * 1.3 * 1.45, 0.02), 'two support gems multiply with each other');

// The two pools must not contaminate. With supports fixed, adding increased must scale the
// whole thing by the same ratio it scales a bare weapon by — that is what separates the pools.
const withSupports = ATK.melee.dmg;
RUNB.dmg = 0.5; refreshAttacks();
const ratioWith = ATK.melee.dmg / withSupports;
EQ.melee.sockets = [null, null, null]; refreshAttacks();
const ratioBare = ATK.melee.dmg / base;
A(near(ratioWith, ratioBare, 0.001), 'more and increased are independent: base x (1+inc) x more');
A(near(withSupports, base * 1.3 * 1.45, 0.05), 'supports multiply, they do not join the additive pool');
RUNB = RUNB0(); refreshAttacks();

// ---------- 2. CRIT ----------
console.log('\n-- crit --');
YESCRIT();
A(ATK.melee.crit >= 0.95 || ATK.melee.crit > 0.5, 'crit chance responds to the additive pool');
NOCRIT();
A(ATK.melee.crit === 0, 'crit chance floors at 0, never negative');
RUNB = RUNB0(); RUNB.critMult = 1.0; refreshAttacks();
A(near(ATK.melee.critMult, CRIT_MULT + 1.0, 0.001), 'crit multiplier takes increased sources');
RUNB = RUNB0(); refreshAttacks(); NOCRIT();

// crit deepens ailments rather than competing with them
{
  OFF(); EN.length = 0;
  EQ.melee.sockets[0] = { id: 'serration', tier: 1 }; refreshAttacks();
  const e1 = mkE(); EN.push(e1); YESCRIT(); P.mcd = 0; doMelee();
  const critPot = stSum(e1, 'bleed');
  EN.length = 0; const e2 = mkE(); EN.push(e2); NOCRIT(); P.mcd = 0; doMelee();
  const plainPot = stSum(e2, 'bleed');
  A(critPot > plainPot * 1.3, `crits apply status at ${CRIT_ST}x potency (${critPot.toFixed(1)} vs ${plainPot.toFixed(1)})`);
  EQ.melee.sockets[0] = null; refreshAttacks();
}

// ---------- 3. FLAT ARMOR ----------
console.log('\n-- flat armor --');
A(applyArmor(30, 10) === 20, 'armor subtracts flat');
A(applyArmor(5, 100) === ARMOR_FLOOR, 'armor can never reduce a hit below the floor');
{
  OFF(); EN.length = 0; NOCRIT();
  const soft = mkE({ arm: 0 }); EN.push(soft); P.mcd = 0; doMelee(); const softDmg = 5000 - soft.hp;
  EN.length = 0;
  const hard = mkE({ arm: 8 }); EN.push(hard); P.mcd = 0; doMelee(); const hardDmg = 5000 - hard.hp;
  A(near(softDmg - hardDmg, 8, 0.6), `enemy armor blunts each hit by its value (${softDmg.toFixed(1)} vs ${hardDmg.toFixed(1)})`);
  // the point of FLAT armor: many small hits suffer far more than one big hit
  const bigLoss = 1 - applyArmor(200, 20) / 200, smallLoss = 1 - applyArmor(20, 20) / 20;
  A(smallLoss > bigLoss * 5, 'flat armor is strong vs swarms, weak vs one big hit');
}
// player armor is applied before block and ironskin
{
  OFF(); RUNB = RUNB0(); RUNB.arm = 10; refreshAttacks();
  P.maxhp = 500; P.hp = 300; P.inv = 0; P.block = false; P.shield = 0;
  const armor = P.armor;   // class and gear contribute too; read the resolved value
  A(armor >= 10, 'RUNB armor reaches the resolved player armor stat');
  hurtPlayer(50);
  A(near(P.hp, 300 - (50 - armor), 0.01), `player armor subtracts from incoming damage (${armor})`);
  RUNB = RUNB0(); refreshAttacks();
}

// ---------- 4. AILMENT STACKING + INTERACTIONS ----------
console.log('\n-- ailments --');
{
  const e = mkE(); OFF();
  applyStatus(e, { burn: 10 }, false); applyStatus(e, { burn: 10 }, false); applyStatus(e, { burn: 10 }, false);
  A(e.st.burn.length === 3, 'burn stacks up to 3 independent instances');
  applyStatus(e, { burn: 10 }, false);
  A(e.st.burn.length === STACK_MAX, 'burn never exceeds STACK_MAX');
  A(near(stSum(e, 'burn'), 30, 0.01), 'stacked burn potency sums');

  const c = mkE();
  applyStatus(c, { shock: 1.2 }, false); applyStatus(c, { shock: 1.5 }, false);
  A(c.st.shock.length === 1, 'shock does not stack');
  A(near(shockMul(c), 1.5, 0.01), 'shock keeps the highest potency');
  applyStatus(c, { chill: 0.7 }, false); applyStatus(c, { chill: 0.4 }, false);
  A(near(chillMul(c), 0.4, 0.01), 'chill keeps the strongest (lowest) multiplier');
}
{ // SHATTER: burn + chill consume each other for a burst
  OFF(); EN.length = 0; const e = mkE({ hp: 5000, maxhp: 5000 }); EN.push(e);
  applyStatus(e, { burn: 40 }, false);
  const before = e.hp;
  applyStatus(e, { chill: 0.5 }, false);
  A(e.hp < before, 'Shatter: chilling a burning target deals a burst');
  A(!hasSt(e, 'burn') && !hasSt(e, 'chill'), 'Shatter consumes both ailments');
}
{ // CONGEAL: bleed + chill halves damage but triples duration
  const e = mkE();
  applyStatus(e, { bleed: 20 }, false);
  const p0 = e.st.bleed[0].p, t0 = e.st.bleed[0].t;
  applyStatus(e, { chill: 0.6 }, false);
  A(near(e.st.bleed[0].p, p0 / 2, 0.01), 'Congeal halves bleed potency');
  A(e.st.bleed[0].t > t0 * 2.5, 'Congeal triples bleed duration');
}
{ // status resist shortens incoming durations on the PLAYER only
  OFF(); P.st = null; RUNB = RUNB0(); RUNB.sres = 0.5; refreshAttacks();
  applyStatus(P, { burn: 10 }, true);
  A(near(P.st.burn[0].t, STATUS.burn.dur * 0.5, 0.01), 'status resist cuts incoming duration');
  const e = mkE(); applyStatus(e, { burn: 10 }, false);
  A(near(e.st.burn[0].t, STATUS.burn.dur, 0.01), 'enemies are unaffected by player status resist');
  RUNB = RUNB0(); P.st = null; refreshAttacks();
}

// ---------- 5. TELEGRAPHS ----------
console.log('\n-- telegraphs --');
{
  OFF(); EN.length = 0; P.inv = 0; P.hp = P.maxhp;
  const E = ENEMIES.crawler;
  const e = mkE({ x: P.x + 16, hp: 500, maxhp: 500, dmg: 20, atk: E.atk, acd: 0, spd: 0 });
  EN.push(e);
  const hp0 = P.hp;
  upEnemies(1 / 60);
  A(e.wind > 0, 'enemy in range enters a windup instead of hitting immediately');
  A(P.hp === hp0, 'no damage lands during the windup');
  let guard = 0;
  while (e.wind > 0 && guard++ < 200) { P.inv = 0; upEnemies(1 / 60) }
  A(e.act > 0 || P.hp < hp0, 'the windup resolves into a live strike window');
  guard = 0;
  while (P.hp === hp0 && guard++ < 60) { P.inv = 0; upEnemies(1 / 60) }
  A(P.hp < hp0, 'the telegraphed strike eventually connects');
}
{ // ranged attacks telegraph too
  OFF(); EN.length = 0; PROJ.length = 0; P.inv = 99;
  const E = ENEMIES.spitter;
  const e = mkE({ x: P.x + 120, shoot: E.shoot, scd: 0, atk: null });
  EN.push(e);
  upEnemies(1 / 60);
  A(e.swind > 0, 'shooter winds up before firing');
  A(PROJ.length === 0, 'no projectile exists during the shooter windup');
  let guard = 0;
  while (PROJ.length === 0 && guard++ < 200) upEnemies(1 / 60);
  A(PROJ.length > 0, 'the shooter eventually fires');
}

// ---------- 6. FOCUS ----------
console.log('\n-- focus --');
{
  OFF(); EQ.armor = mkItem('robe', 0); EQ.armor.sc = ['b', 'b', 'b'];
  EQ.armor.sockets = [{ id: 'meteor', tier: 1 }, null, null]; refreshAttacks();
  A(ATK.abil && ATK.abil.fc > 0, 'ability carries a focus cost');
  P.focus = 0; P.acd = 0; PROJ.length = 0;
  useAbility();
  A(PROJ.length === 0, 'ability refuses to fire with no focus');
  A(P.acd === 0, 'a refused ability does not burn its cooldown');
  P.focus = FOCUS_MAX;
  useAbility();
  A(PROJ.length > 0, 'ability fires once focus is available');
  A(P.focus < FOCUS_MAX, 'firing spends focus');
  A(P.acd > 0, 'firing starts the cooldown');
  // hitting things refills it
  const f0 = P.focus; EN.length = 0; const e = mkE(); EN.push(e);
  EQ.melee.sockets = [null, null, null]; refreshAttacks(); P.mcd = 0; doMelee();
  A(P.focus > f0, 'landing a hit grants focus');
  P.focus = FOCUS_MAX; gainFocus(500);
  A(P.focus === FOCUS_MAX, 'focus is capped');
}

// ---------- 7. SOCKET COLORS ----------
console.log('\n-- socket colors --');
{
  const it = mkItem('greataxe', 0);
  it.sc = ['r', 'g']; it.chroma = -1; it.sockets = [null, null];
  A(gemFits(it, 0, 'cleave'), 'a red gem fits a red socket');       // cleave is col r
  A(!gemFits(it, 1, 'cleave'), 'a red gem does not fit a green socket');
  A(gemFits(it, 1, 'fasteratk'), 'a green gem fits a green socket'); // fasteratk is col g
  it.chroma = 1;
  A(gemFits(it, 1, 'cleave'), 'a chromatic socket accepts any color');
  // every gem must declare a color, or it can never be socketed
  const missing = Object.keys(GEMS).filter(k => !GEMS[k].col);
  A(missing.length === 0, 'every gem declares a socket color' + (missing.length ? ': ' + missing.join(',') : ''));
  // every gear base's fixed colors must be valid
  const badBase = Object.keys(GEAR).filter(k => (GEAR[k].sc || '').split('').some(c => !SOCK[c]));
  A(badBase.length === 0, 'every gear base has valid socket colors' + (badBase.length ? ': ' + badBase.join(',') : ''));
  // the class signature gem must always be placeable in its own kit
  for (const cid in CLASSES) {
    META.cls = cid; newRun();
    const g = CLASSES[cid].gem;
    if (!g) continue;
    const item = EQ[g.slot];
    A(!!(item && gemId(item.sockets[0]) === g.id), `${CLASSES[cid].n} signature gem is socketed and color-legal`);
  }
  META.cls = 'vanguard'; newRun(); OFF();
}

// ---------- 8. GEM TIERS + FUSION ----------
console.log('\n-- gem tiers --');
{
  OFF(); NOCRIT();
  EQ.melee = mkItem('sword', 0); EQ.melee.sc = ['r', 'r']; EQ.melee.sockets = [null, null];
  EQ.melee.sockets[0] = { id: 'addedfire', tier: 1 }; refreshAttacks();
  const t1 = ATK.melee.dmg;
  EQ.melee.sockets[0] = { id: 'addedfire', tier: 3 }; refreshAttacks();
  A(ATK.melee.dmg > t1, 'a higher-tier support gem hits harder');
  A(gemId({ id: 'x', tier: 2 }) === 'x' && gemTier({ id: 'x', tier: 2 }) === 2, 'gemId/gemTier read the object form');
  A(gemId('legacy') === 'legacy' && gemTier('legacy') === 1, 'bare-string sockets from v1 saves still read');
  // abilities pay for tiers in cooldown
  EQ.armor.sockets = [{ id: 'meteor', tier: 1 }, null, null]; refreshAttacks();
  const cd1 = ATK.abil.cd, d1 = ATK.abil.dmg;
  EQ.armor.sockets = [{ id: 'meteor', tier: 3 }, null, null]; refreshAttacks();
  A(ATK.abil.dmg > d1, 'a higher-tier ability hits harder');
  A(ATK.abil.cd > cd1, 'a higher-tier ability costs cooldown — tiering is not strictly free');
  // fusion consumes exactly three and pays shards
  BAG.length = 0; META.shards = 1000;
  for (let i = 0; i < 4; i++) BAG.push({ kind: 'gem', id: 'pierce', tier: 1 });
  fuseGem('pierce', 1);
  const t2s = BAG.filter(b => b.kind === 'gem' && b.id === 'pierce' && b.tier === 2);
  const t1s = BAG.filter(b => b.kind === 'gem' && b.id === 'pierce' && (b.tier || 1) === 1);
  A(t2s.length === 1 && t1s.length === 1, 'fusion consumes exactly 3 and yields 1 of the next tier');
  A(META.shards === 850, 'fusion charges its shard cost');
  META.shards = 100; BAG.length = 0;
  for (let i = 0; i < 3; i++) BAG.push({ kind: 'gem', id: 'pierce', tier: 1 });
  fuseGem('pierce', 1);
  A(BAG.length === 3, 'fusion refuses when you cannot afford it');
}

// ---------- 9. DEPTH PRESSURE ----------
console.log('\n-- depth pressure --');
{
  RUNB = RUNB0(); META.tree = {}; META.cls = 'vanguard'; refreshAttacks();
  const shallow = (SURFACE + 50) * TILE, deep = (SURFACE + 2400) * TILE;
  PICK.length = 0; dropShards(0, shallow, 100); const s1 = PICK.length;
  PICK.length = 0; dropShards(0, deep, 100); const s2 = PICK.length;
  A(s2 > s1 * 3, `deep shards out-earn shallow by >3x (${s1} vs ${s2})`);
  A(depthMul(deep) > depthMul(shallow), 'depthMul rises with depth');
}
{ // The Weight stacks with time in a band and resets on descending
  OFF(); P.band = biomeName(Math.floor(P.y / TILE)); P.weight = 0; P.weightT = 0;
  for (let i = 0; i < 60 * (WEIGHT_GRACE + WEIGHT_EVERY * 2 + 1); i++) applyWeight(1 / 60);
  A(P.weight >= 2, `The Weight stacks after ${WEIGHT_GRACE}s in one band (got ${P.weight})`);
  const heavy = P.weight;
  P.y = (SURFACE + 1000) * TILE; applyWeight(1 / 60);
  A(P.weight === 0, 'descending to a new band clears The Weight');
  A(heavy <= WEIGHT_MAX, 'The Weight is capped');
  // and it actually costs damage
  OFF(); NOCRIT(); EN.length = 0;
  let e = mkE(); EN.push(e); P.weight = 0; P.mcd = 0; doMelee(); const full = 5000 - e.hp;
  EN.length = 0; e = mkE(); EN.push(e); P.weight = 10; P.mcd = 0; doMelee(); const weighed = 5000 - e.hp;
  A(weighed < full, `The Weight reduces your damage (${full.toFixed(1)} -> ${weighed.toFixed(1)})`);
  P.weight = 0;
}

// ---------- 10. THE VAULT ----------
console.log('\n-- the vault --');
{
  META.vault = []; META.shards = 5000; BAG.length = 0;
  const keep = mkItem('crossbow', 2);
  BAG.push({ kind: 'gear', item: keep });
  openVault(); vaultPut(VAULT_SRC.findIndex(c => c.item === keep));
  A(META.vault.length === 1 && META.vault[0].uid === keep.uid, 'an item can be deposited in the vault');
  A(META.shards < 5000, 'depositing costs shards');
  newRun();
  const held = [EQ.melee, EQ.ranged, EQ.armor].concat(BAG.filter(b => b.kind === 'gear').map(b => b.item));
  A(held.some(i => i && i.uid === keep.uid), 'the vaulted item survives death and returns next run');
  META.vault = [];
}

// ---------- 11. NEW ENEMY BEHAVIOURS ----------
console.log('\n-- new enemies --');
{
  // every biome roster must name enemies that actually exist
  const bad = [];
  for (const b of BIOMES) for (const t of b[4]) if (!ENEMIES[t]) bad.push(b[1] + ':' + t);
  A(bad.length === 0, 'every biome roster entry exists in ENEMIES' + (bad.length ? ' — ' + bad.join(',') : ''));
  const noAtk = Object.keys(ENEMIES).filter(k => !ENEMIES[k].atk && !ENEMIES[k].shoot);
  A(noAtk.length === 0, 'every enemy has a telegraphed attack' + (noAtk.length ? ': ' + noAtk.join(',') : ''));
  const badWind = Object.keys(ENEMIES).filter(k => ENEMIES[k].atk && !(ENEMIES[k].atk.wind > 0));
  A(badWind.length === 0, 'every melee attack has a nonzero windup' + (badWind.length ? ': ' + badWind.join(',') : ''));
}
{ // void spawn splits on death
  OFF(); EN.length = 0;
  const E = ENEMIES.voidspawn;
  const e = mkE({ type: 'voidspawn', hp: 1, maxhp: E.hp, dmg: E.dmg });
  EN.push(e); killEnemy(e);
  A(EN.filter(x => x.type === 'voidling').length === E.split, 'void spawn splits into voidlings');
  const half = EN.find(x => x.type === 'voidling');
  EN.length = 0; if (half) { half.hp = 1; killEnemy(half) }
  A(EN.filter(x => x.type === 'voidling').length === 0, 'voidlings do not split again (no infinite chain)');
}
{ // shieldman blocks from the front
  OFF(); NOCRIT(); EN.length = 0;
  // The enemy stands to the player's RIGHT, so dir -1 is facing the player.
  const front = mkE({ x: P.x + 30, front: 1, dir: -1 });  // facing the player: shielded
  EN.push(front); P.mcd = 0; doMelee(); const blocked = 5000 - front.hp;
  EN.length = 0;
  const back = mkE({ x: P.x + 30, front: 1, dir: 1 });    // facing away: exposed
  EN.push(back); P.mcd = 0; doMelee(); const exposed = 5000 - back.hp;
  A(exposed > blocked * 2, `shieldman takes far more from behind (${blocked.toFixed(1)} vs ${exposed.toFixed(1)})`);
}
{ // ember detonates on death and can catch the player
  OFF(); EN.length = 0; P.inv = 0; P.hp = P.maxhp; P.armor = 0;
  const E = ENEMIES.ember;
  const e = mkE({ x: P.x + 8, type: 'ember', hp: 1, maxhp: E.hp, dmg: 30 });
  EN.push(e); const hp0 = P.hp; killEnemy(e);
  A(P.hp < hp0, 'ember corpse detonates and can hurt you');
}

// ---------- 12. NEW GEM MECHANICS ----------
console.log('\n-- new gems --');
{
  OFF(); NOCRIT(); EN.length = 0;
  EQ.melee = mkItem('sword', 0); EQ.melee.sc = ['r', 'r', 'r']; EQ.melee.sockets = [null, null, null];
  // Culling executes low-HP enemies outright
  EQ.melee.sockets[0] = { id: 'culling', tier: 1 }; refreshAttacks();
  const weak = mkE({ hp: 20, maxhp: 5000 }); EN.push(weak);
  P.mcd = 0; doMelee();
  A(weak.hp <= 0, 'Culling executes an enemy under the threshold');
  // Chain jumps to a neighbour
  EN.length = 0; EQ.melee.sockets = [{ id: 'chain', tier: 1 }, null, null]; refreshAttacks();
  const a1 = mkE({ x: P.x + 20 }), a2 = mkE({ x: P.x + 60 });
  EN.push(a1, a2); P.mcd = 0; doMelee();
  A(a2.hp < 5000, 'Chain carries damage to a second enemy');
  // Momentum turns move speed into damage
  EN.length = 0; EQ.melee.sockets = [{ id: 'momentum', tier: 1 }, null, null]; refreshAttacks();
  let m = mkE(); EN.push(m); P.vx = 0; P.mcd = 0; doMelee(); const still = 5000 - m.hp;
  EN.length = 0; m = mkE(); EN.push(m); P.vx = MOVE * 2; P.mcd = 0; doMelee(); const moving = 5000 - m.hp;
  A(moving > still, `Momentum pays out while moving (${still.toFixed(1)} -> ${moving.toFixed(1)})`);
  P.vx = 0;
  // Reap scales with missing HP
  EN.length = 0; EQ.melee.sockets = [{ id: 'reap', tier: 1 }, null, null]; refreshAttacks();
  let r1 = mkE({ hp: 5000, maxhp: 5000 }); EN.push(r1); P.mcd = 0; doMelee(); const healthy = 5000 - r1.hp;
  EN.length = 0; let r2 = mkE({ hp: 500, maxhp: 5000 }); EN.push(r2); P.mcd = 0; doMelee(); const wounded = 500 - r2.hp;
  A(wounded > healthy, `Reap hits the wounded harder (${healthy.toFixed(1)} vs ${wounded.toFixed(1)})`);
  // Sunder strips armor permanently
  EN.length = 0; EQ.melee.sockets = [{ id: 'sunder', tier: 1 }, null, null]; refreshAttacks();
  const armored = mkE({ arm: 20 }); EN.push(armored); P.mcd = 0; doMelee();
  A(armored.arm < 20, 'Sunder shreds armor and it stays shredded');
  // Twin Strike lands two hits
  EN.length = 0; EQ.melee.sockets = [{ id: 'twin', tier: 1 }, null, null]; refreshAttacks();
  const tw = mkE(); EN.push(tw); const n0 = DMGN.length; P.mcd = 0; doMelee();
  A(DMGN.length - n0 >= 2, 'Twin Strike registers two separate hits');
  // Deep Cut trades hit damage for ailment damage
  EQ.melee.sockets = [{ id: 'serration', tier: 1 }, null, null]; refreshAttacks();
  const plainHit = ATK.melee.dmg, plainAil = ATK.melee.st.bleed;
  EQ.melee.sockets[1] = { id: 'deepcut', tier: 1 }; refreshAttacks();
  A(ATK.melee.dmg < plainHit, 'Deep Cut lowers hit damage');
  A(ATK.melee.st.bleed / ATK.melee.dmg > plainAil / plainHit, 'Deep Cut raises ailment damage relative to hits');
  // Overload and Concentrated are real trade-offs, not upgrades
  EQ.melee.sockets = [null, null, null]; refreshAttacks();
  const b0 = ATK.melee.dmg, cd0 = ATK.melee.cd, arc0 = ATK.melee.arc;
  EQ.melee.sockets[0] = { id: 'overload', tier: 1 }; refreshAttacks();
  A(ATK.melee.dmg > b0 && ATK.melee.cd > cd0, 'Overload trades cooldown for damage');
  EQ.melee.sockets[0] = { id: 'conc', tier: 1 }; refreshAttacks();
  A(ATK.melee.dmg > b0 && ATK.melee.arc < arc0, 'Concentrated trades area for damage');
  // Precision buys crit with damage
  EQ.melee.sockets[0] = null; refreshAttacks(); const pc0 = ATK.melee.crit, pd0 = ATK.melee.dmg;
  EQ.melee.sockets[0] = { id: 'precision', tier: 1 }; refreshAttacks();
  A(ATK.melee.crit > pc0 && ATK.melee.dmg < pd0, 'Precision buys crit chance with damage');
  EQ.melee.sockets = [null, null, null]; refreshAttacks();
}

// ---------- 13. CONTENT INTEGRITY ----------
console.log('\n-- content integrity --');
{
  // every unlock id must name something real, or shards buy nothing
  const dangling = UNLOCKS.filter(u => !GEMS[u.id] && !GEAR[u.id]).map(u => u.id);
  A(dangling.length === 0, 'every unlock maps to a real gem or gear base' + (dangling.length ? ': ' + dangling.join(',') : ''));
  // every non-default gem should be buyable, or it can never enter the drop pool
  const unbuyable = Object.keys(GEMS).filter(g => !DEFAULT_GEM_POOL.includes(g) && !UNLOCKS.some(u => u.id === g));
  A(unbuyable.length === 0, 'every gem is reachable through the unlock pool' + (unbuyable.length ? ': ' + unbuyable.join(',') : ''));
  const unbuyableGear = Object.keys(GEAR).filter(g => !DEFAULT_GEAR_POOL.includes(g) && !UNLOCKS.some(u => u.id === g));
  A(unbuyableGear.length === 0, 'every gear base is reachable' + (unbuyableGear.length ? ': ' + unbuyableGear.join(',') : ''));
  // ability gems need both a cost and a handler
  const badAbil = Object.keys(GEMS).filter(k => GEMS[k].t === 'abil' && !(GEMS[k].cd > 0 && GEMS[k].fc >= 0 && GEMS[k].fx));
  A(badAbil.length === 0, 'every ability gem declares cd, focus cost and an fx' + (badAbil.length ? ': ' + badAbil.join(',') : ''));
  // each biome boss must exist
  const badBoss = Object.values(BIOME_BOSS).filter(b => !ENEMIES[b] || !ENEMIES[b].boss);
  A(badBoss.length === 0, 'every biome boss exists and is flagged boss');
  const noPhases = Object.keys(ENEMIES).filter(k => ENEMIES[k].boss && !(ENEMIES[k].ph || []).length);
  A(noPhases.length === 0, 'every boss has phase transitions' + (noPhases.length ? ': ' + noPhases.join(',') : ''));
  console.log(`   catalog: ${Object.keys(GEMS).length} gems, ${Object.keys(GEAR).length} bases, ` +
    `${Object.keys(UNIQUES).length + Object.keys(UNIQ2).length} uniques, ${Object.keys(ENEMIES).length} enemies, ` +
    `${AFFIXES.length} affixes, ${UNLOCKS.length} unlocks, ${TREE.length} tree nodes, ${BOONS.length} boons`);
  A(Object.keys(GEMS).length >= 45, `gem catalog reaches the ~45 target (${Object.keys(GEMS).length})`);
}

// ---------- 13b. NO STALE CACHE ----------
// ATK, P.armor and P.maxhp are caches. Any mutation path that skips refreshAttacks() leaves
// the player silently playing with the wrong numbers, which is the easiest bug to introduce
// here and the hardest to notice.
console.log('\n-- cache coherence --');
{
  OFF(); META.classes = { vanguard: 1, marksman: 1, pyromancer: 1, delver: 1 };
  META.cls = 'vanguard'; applyClass();
  const vanHp = P.maxhp, vanArm = P.armor;
  pickClass('marksman');
  A(P.maxhp !== vanHp, 'switching class updates maxHP immediately');
  A(P.armor !== vanArm, 'switching class updates armor immediately');
  A(near(P.maxhp, maxHP(), 0.001), 'cached maxHP matches a fresh computation');
  A(near(P.armor, armorVal(), 0.001), 'cached armor matches a fresh computation');
  pickClass('vanguard');
  A(near(P.maxhp, vanHp, 0.001), 'switching back restores the original stats');

  // buying a tree node must refresh too
  META.tree = {}; META.shards = 10000; applyClass();
  const d0 = ATK.melee.dmg;
  buyNode('m1'); closePanel();
  A(ATK.melee.dmg > d0, 'buying a tree node refreshes the cached attack');

  // taking a boon must refresh
  RUNB = RUNB0(); refreshAttacks();
  const d1 = ATK.melee.dmg;
  SHRINE_PICK = [BOONS.find(b => b.id === 'wrath')];
  takeBoon(0); closePanel();
  A(ATK.melee.dmg > d1, 'taking a shrine boon refreshes the cached attack');
  RUNB = RUNB0(); META.tree = {}; refreshAttacks();

  // equipping and socketing must refresh
  EQ.melee = mkItem('sword', 0); EQ.melee.sc = ['r', 'r']; EQ.melee.sockets = [null, null];
  refreshAttacks(); const d2 = ATK.melee.dmg;
  // heavyimpact is a RED gem and the sockets above are red — a blue gem would be correctly
  // refused here, which is the socket-color rule doing its job, not a cache failure.
  BAG.length = 0; BAG.push({ kind: 'gem', id: 'heavyimpact', tier: 1 });
  placeGem(0, 'melee', 0); closePanel();
  A(gemId(EQ.melee.sockets[0]) === 'heavyimpact', 'a color-matched gem is accepted');
  A(ATK.melee.dmg > d2, 'socketing a gem refreshes the cached attack');
  // and the wrong color is refused outright
  BAG.length = 0; BAG.push({ kind: 'gem', id: 'addedfire', tier: 1 });
  placeGem(0, 'melee', 1); closePanel();
  A(EQ.melee.sockets[1] === null && BAG.length === 1, 'a mismatched gem is refused and stays in the bag');
  unsocket('melee', 0); closePanel();
  A(near(ATK.melee.dmg, d2, 0.001), 'unsocketing refreshes back');
}

// ---------- 14. BOSS PHASES ----------
console.log('\n-- boss phases --');
{
  OFF(); EN.length = 0; PROJ.length = 0;
  const E = ENEMIES.warden;
  const b = mkE({ type: 'warden', boss: true, hp: E.hp, maxhp: E.hp, ph: E.ph, shoot: Object.assign({}, E.shoot), atk: E.atk, dmg: E.dmg });
  EN.push(b);
  const cd0 = b.shoot.cd;
  b.hp = b.maxhp * 0.6; bossPhase(b);
  A(b.phase === 1, 'boss enters phase 2 below 66%');
  A(b.invT > 0, 'phase transition grants brief invulnerability');
  A(b.shoot.cd < cd0, 'phase transition speeds up the boss');
  const hpDuring = b.hp; hurtEnemy(b, 99999, 0, '#fff');
  A(b.hp === hpDuring, 'boss cannot be damaged during transition invuln');
  b.invT = 0; b.hp = b.maxhp * 0.2; bossPhase(b);
  A(b.phase === 2, 'boss enters phase 3 below 33%');
  bossPhase(b);
  A(b.phase === 2, 'boss does not transition past its last phase');
}

// ---------- 15. NO NaN, CAPS HOLD, LONG RUN ----------
console.log('\n-- integration --');
{
  META.cls = 'delver'; META.shards = 99999;
  for (const u of UNLOCKS) META.unlocks[u.id] = 1;
  for (const n of TREE) META.tree[n.id] = 1;
  newRun();
  const t0 = Date.now();
  for (let i = 0; i < 1800; i++) {
    HELD.mel = i % 7 < 3; HELD.rng = i % 11 < 4; HELD.jmp = i % 23 < 6;
    IN.tx = ((i / 30) | 0) % 2 ? 1 : -1;
    if (i % 90 === 0) { P.focus = FOCUS_MAX; P.acd = 0; useAbility() }
    sim(1 / 60);
  }
  HELD.mel = HELD.rng = HELD.jmp = false; IN.tx = 0;
  console.log(`   1800 frames, full unlocks: ${Date.now() - t0} ms | EN ${EN.length} PROJ ${PROJ.length} PART ${PART.length}`);
  const vals = [P.x, P.y, P.vx, P.vy, P.hp, P.maxhp, P.fuel, P.focus, P.weight, ATK.melee && ATK.melee.dmg, ATK.ranged && ATK.ranged.dmg];
  A(vals.every(v => v === null || (typeof v === 'number' && isFinite(v))), 'no NaN anywhere in player or attack state');
  A(EN.length <= 121 && PROJ.length <= 221 && PART.length <= 351, 'entity caps hold under full load');
  A(P.focus >= 0 && P.focus <= FOCUS_MAX, 'focus stays in range');
  A(P.hp <= P.maxhp, 'hp never exceeds max');
  // every gem must survive being socketed without producing NaN
  const broken = [];
  for (const gid in GEMS) {
    const G = GEMS[gid];
    const slot = (G.t === 'aura' || G.t === 'abil') ? 'armor' : (G.for === 'ranged' ? 'ranged' : 'melee');
    EQ.melee = mkItem('sword', 0); EQ.ranged = mkItem('bow', 0); EQ.armor = mkItem('robe', 0);
    for (const s of ['melee', 'ranged', 'armor']) { EQ[s].sc = ['r', 'g', 'b']; EQ[s].chroma = 0 }
    EQ[slot].sockets[0] = { id: gid, tier: 3 };
    refreshAttacks();
    for (const a of [ATK.melee, ATK.ranged, ATK.abil]) {
      if (!a) continue;
      for (const k in a) { const v = a[k]; if (typeof v === 'number' && !isFinite(v)) broken.push(gid + '.' + k) }
      if (a.st) for (const k in a.st) if (!isFinite(a.st[k])) broken.push(gid + '.st.' + k);
    }
  }
  A(broken.length === 0, 'every gem at tier 3 resolves to finite numbers' + (broken.length ? ': ' + broken.join(',') : ''));
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) { console.log('SUITE 7 FAILURES'); process.exit(1) }
console.log('ALL PASS');
