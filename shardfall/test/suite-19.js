// ===== SUITE 19 — STORM & BLOOD: the wave-4 machinery nothing else catches =====
// Dead skills and supports are caught by suite-13; dead AURAS and missing ABIL branches are
// caught by nothing — a table entry without a consumer passes every other suite and does
// nothing. Each block here drives the actual consumer.
let pass = 0, fail = 0;
function A(c, m) { if (c) { pass++; console.log('ok: ' + m) } else { fail++; console.log('FAIL: ' + m) } }
const near = (a, b, tol) => Math.abs(a - b) <= (tol === undefined ? 0.001 : tol);

loadMeta(); META.shards = 100000; META.cls = 'vanguard'; MOVE_CK = 1e9; newRun();
function OFF(depthM) {
  P.x = (CAMP_X + 400) * TILE; P.y = (SURFACE + (depthM === undefined ? 260 : depthM)) * TILE;
  const tx = Math.floor(P.x / TILE), ty = Math.floor(P.y / TILE);
  for (let y = -6; y <= 1; y++) for (let x = -20; x <= 20; x++) setTile(tx + x, ty + y, 0);
  for (let x = -20; x <= 20; x++) setTile(tx + x, ty + 2, 2);
  P.y = (ty + 1) * TILE - P.h / 2 - 1;
  ANCHOR = null; P.vx = 0; P.vy = 0; P.noFall = 9; P.dead = false; P.hp = P.maxhp; P.weight = 0; P.inv = 0;
  P.mcd = 0; P.rcd = 0; P.acd = 0; P.face = 1; P.block = false; P.focus = FOCUS_MAX;
  P.dodgeT = 0; P.dodgeCd = 0;   // a leftover roll clamps vy to 0 and eats any fall-based test
  EN.length = 0; PROJ.length = 0; HAZ.length = 0; PART.length = 0; SENTRY.length = 0; DECOY = null; BUFFS.length = 0;
}
function mkE(o) {
  return Object.assign({ x: P.x + 30, y: P.y, vx: 0, vy: 0, w: 14, h: 12, type: 'crawler', ai: 'walk', c: '#fff',
    hp: 5000, maxhp: 5000, dmg: 0, arm: 0, spd: 0, onG: false, flash: 0, dir: -1, boss: false, elite: null,
    shoot: null, scd: 99, atk: null, acd: 99, wind: 0, act: 0, rec: 0, invT: 0, phase: 0, ph: null, st: null }, o || {});
}
function fitAbil(id) { EQ.armor = mkItem('vest', 0, 1); EQ.armor.sockets = [{ id, tier: 1 }]; EQ.armor.sc = [GEMS[id].col]; refreshAttacks(); TOPUP(); P.acd = 0 }
function fitAura(id) { EQ.armor = mkItem('vest', 0, 1); EQ.armor.sockets = [{ id, tier: 1 }]; EQ.armor.sc = [GEMS[id].col]; refreshAttacks() }
OFF(); NOCRIT();

// ---------- ABILITIES ----------
console.log('\n-- abilities --');
{ // bastion: armor rises for 3s, tickBuffs reverses it
  OFF(); fitAbil('bastion'); const a0 = P.armor;
  useAbility();
  A(P.armor >= a0 + 20, 'bastion raises armor at cast (' + a0 + ' -> ' + P.armor + ')');
  perf += 3.1; tickBuffs();
  A(near(P.armor, a0, 0.5), 'and tickBuffs hands it back after 3s');
}
{ // effigy: spikes bite a landed enemy swing
  OFF(); fitAbil('effigy'); useAbility();
  A(!!DECOY && DECOY.spikes > 0, 'effigy stands with thorns');
  const e = mkE({ atk: mkAtk(ENEMIES.crawler.atk), act: 0.1, dmg: 5, x: DECOY.x + 2, y: DECOY.y });
  EN.push(e); const h0 = e.hp; P.x = DECOY.x + 500;   // decoy owns aggro by proximity
  upEnemies(DT);
  A(e.hp < h0, 'a swing that lands on the effigy costs the swinger blood');
}
{ // lodestone: plant is CHEAP (P.acd 0.8, never a.cd — the cache corruption bug), snap-back returns
  OFF(); fitAbil('lodestone');
  const cd0 = ATK.abil.cd, x0 = P.x;
  useAbility();
  A(!!P.lode, 'planted');
  A(near(P.acd, 0.8, 0.01), 'the plant arm is a short cooldown, set on P.acd directly');
  A(ATK.abil.cd === cd0, 'and the CACHED ability cd is untouched (writing a.cd corrupted every later cast)');
  P.x = x0 + 200; P.acd = 0; TOPUP();
  useAbility();
  A(near(P.x, x0, 1) && !P.lode, 'second tap snaps back to the stone');
  P.acd = 0; TOPUP(); useAbility();
  A(!!P.lode, 'and the anchor can be planted again');
  perf += 8.1; P.acd = 0; TOPUP(); const x1 = P.x; useAbility();
  A(!!P.lode && near(P.lode.x, x1, 1), 'an expired anchor re-plants instead of teleporting');
}
{ // tempest: exactly one FRIENDLY shock hazard that hurts enemies
  OFF(); fitAbil('tempest'); useAbility();
  const hz = HAZ.filter(h => h.kind === 'shock' && h.friendly);
  A(hz.length === 1, 'tempest leaves exactly one friendly shock field');
  const e = mkE({ x: P.x + 20, y: P.y - 10 }); EN.push(e); const h0 = e.hp;
  for (let i = 0; i < 30; i++) upHaz(DT);
  A(e.hp < h0, 'and everything under it pays');
}
{ // transfuse: drinks the room's bleeds, capped
  OFF(); fitAbil('transfuse');
  const e = mkE({ x: P.x + 60, y: P.y }); EN.push(e);
  applyStatus(e, { bleed: 30 }, false);
  P.hp = P.maxhp * 0.3;
  const before = P.hp; useAbility();
  A(P.hp > before, 'transfuse heals from their bleeding');
  A(!e.st.bleed || e.st.bleed.length === 0, 'and the bleeds are GONE — drunk, not copied');
}

// ---------- AURAS ----------
console.log('\n-- auras --');
{ // galvanic: player shocks last longer, chains reach further
  OFF(); fitAura('galvanic');
  const e = mkE({}); EN.push(e);
  applyStatus(e, { shock: 1.3 }, false);
  const gDur = e.st.shock[0].t;
  EQ.armor.sockets[0] = null; refreshAttacks();
  const e2 = mkE({ x: P.x - 40 }); EN.push(e2);
  applyStatus(e2, { shock: 1.3 }, false);
  A(gDur > e2.st.shock[0].t * 1.4, 'galvanic shocks outlast plain shocks (' + gDur.toFixed(1) + 's vs ' + e2.st.shock[0].t.toFixed(1) + 's)');
  A(near(STATUS.shock.dur * 1.5, gDur, 0.01), 'by exactly half again');
}
{ // surfeit: overleech becomes shield, capped at 30%
  OFF(); fitAura('surfeit'); P.hp = P.maxhp; P.shield = 0;
  leechHeal(P.maxhp);   // grotesque overheal
  A(P.shield > 0, 'leech past full pools as an overshield');
  A(P.shield <= P.maxhp * 0.3 + 0.01, 'capped at 30% of max');
  EQ.armor.sockets[0] = null; refreshAttacks(); P.shield = 0; P.hp = P.maxhp;
  leechHeal(50);
  A(P.shield === 0, 'no aura, no shield — the spill is wasted as before');
}
{ // foreman: the sentry fires faster
  OFF(); EQ.ranged = mkItem('bow', 0, 1); refreshAttacks();
  SENTRY.push({ x: P.x, y: P.y, t: perf + 30, cd: 0 });
  const e = mkE({ x: P.x + 60 }); EN.push(e);
  PROJ.length = 0; upSentry(DT);
  const plainCd = SENTRY[0].cd;
  fitAura('foreman'); SENTRY[0].cd = 0; PROJ.length = 0; upSentry(DT);
  A(SENTRY[0].cd < plainCd, 'foreman shortens the sentry firing period (' + SENTRY[0].cd.toFixed(2) + ' vs ' + plainCd.toFixed(2) + ')');
}
{ // slipstream: the full reload, strictly better than the 0.22 clamp
  OFF(); fitAura('slipstream'); P.mcd = 2; P.rcd = 2; P.dodgeCd = 0; P.onG = true;
  dodge();
  A(P.mcd === 0 && P.rcd === 0, 'slipstream zeroes both weapons on dodge (the clamp only reaches 0.22)');
}
{ // plumbline: a hard landing detonates
  OFF(); fitAura('plumbline');
  const e = mkE({ x: P.x + 20, y: P.y }); EN.push(e); const h0 = e.hp;
  P.noFall = 0; P.vy = FALL_SAFE + 300; P.onG = false; P.y -= 60;   // a real fall, a real landing
  for (let i = 0; i < 40 && e.hp === h0; i++) upPlayer(DT);
  A(e.hp < h0, 'a past-FALL_SAFE landing hurts what stands beside it');
}

// ---------- THE MINE ----------
console.log('\n-- the mine --');
{
  OFF(); META.cls = 'vanguard'; EQ.ranged = mkItem('crossbow', 0, 1);
  EQ.ranged.sockets = [{ id: 'mine', tier: 1 }]; EQ.ranged.sc = ['r']; refreshAttacks(); NOCRIT();
  P.rcd = 0; IN.manual = true; IN.aimX = 1; IN.aimY = 0;
  doRanged();
  A(PROJ.length === 1 && PROJ[0].mine === 1 && PROJ[0].armed === 0, 'a mine flies unarmed');
  // drive it into the floor: it PLANTS instead of dying
  for (let i = 0; i < 300 && !PROJ[0].armed; i++) upProj(DT);
  A(PROJ.length === 1 && PROJ[0].armed === 1, 'terrain contact plants it');
  A(PROJ[0].vx === 0 && PROJ[0].vy === 0, 'planted means planted');
  const e = mkE({ x: PROJ[0].x + 20, y: PROJ[0].y - 8, hp: 100000, maxhp: 100000 }); EN.push(e);
  const h0 = e.hp, f0 = P.focus = 10;
  upProj(DT);
  A(PROJ.length === 0, 'prey in reach detonates it');
  A(e.hp < h0, 'and it hurts');
  A(P.focus > f0, 'through projStrike — focus paid, riders live (the exploding-shot lesson)');
  IN.manual = false;
}

// ---------- BLOOD AND FOCUS COSTS ----------
console.log('\n-- the price of power --');
{
  OFF(); EQ.melee = mkItem('sword', 0, 1); EQ.melee.sockets = [{ id: 'bloodlet', tier: 1 }]; EQ.melee.sc = ['r'];
  refreshAttacks(); NOCRIT(); P.mcd = 0;
  A((ATK.melee.hpCost || 0) > 0, 'bloodlet costs blood');
  const hp0 = P.hp; doMelee();
  A(P.hp < hp0, 'and the blood is PAID at the swing');
  P.hp = ATK.melee.hpCost; P.mcd = 0; const hp1 = P.hp;
  doMelee();
  A(P.hp === hp1, 'a lethal price is REFUSED — blood magic never suicides you');
  // one volley pays once
  OFF(); EQ.ranged = mkItem('bow', 0, 1); EQ.ranged.sockets = [{ id: 'bloodtithe', tier: 1 }]; EQ.ranged.sc = ['r'];
  refreshAttacks(); P.rcd = 0; NOCRIT();
  RUNM.proj = 2; refreshAttacks(); P.rcd = 0;   // multi-projectile volley
  const hp2 = P.hp; doRanged();
  A(near(hp2 - P.hp, ATK.ranged.hpCost, 0.01), 'a whole volley costs ONE payment, not one per projectile');
  RUNM.proj = 0;
}
{
  OFF(); EQ.melee = mkItem('sword', 0, 1); EQ.melee.sockets = [{ id: 'overdraw', tier: 1 }]; EQ.melee.sc = ['b'];
  refreshAttacks(); NOCRIT(); P.mcd = 0;
  A((ATK.melee.focusCost || 0) >= 5, 'overdraw carries a real focus price');
  P.focus = FOCUS_MAX; doMelee();
  A(P.focus <= FOCUS_MAX - 5, 'paid per swing (' + (FOCUS_MAX - P.focus).toFixed(0) + ' focus)');
  P.focus = 1; P.mcd = 0;
  const e = mkE({}); EN.push(e); const h0 = e.hp;
  doMelee();
  A(e.hp === h0, 'an unpayable swing is refused, not discounted');
}

// ---------- THE CONDUCTOR'S FOCUS ----------
console.log('\n-- foc: shock --');
{
  META.cls = 'conductor'; META.classes.conductor = 1; newRun(); OFF(); NOCRIT();
  EQ.melee = mkItem('sword', 0, 1); refreshAttacks(); P.mcd = 0;
  const e = mkE({ hp: 100000, maxhp: 100000 }); EN.push(e);
  applyStatus(e, { shock: 1.3 }, false);
  P.focus = 0; doMelee();
  const melGain = P.focus;
  A(melGain >= FOCUS_HIT * 2, 'shocked prey pays double focus on melee (' + melGain + ')');
  P.focus = 0; PROJ.length = 0;
  projStrike(e, { dmg: 10, crit: 0, critMult: 1, col: '#fff' });
  A(P.focus >= FOCUS_HIT * 0.6 + FOCUS_HIT - 0.01, 'and on the ranged path');
  const e2 = mkE({ x: P.x - 40, hp: 100000, maxhp: 100000 }); EN.push(e2);
  P.focus = 0; projStrike(e2, { dmg: 10, crit: 0, critMult: 1, col: '#fff' });
  A(near(P.focus, FOCUS_HIT * 0.6, 0.01), 'unshocked prey pays baseline only');
  META.cls = 'vanguard';
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
if (fail) process.exit(1);
