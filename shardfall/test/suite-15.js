// ===== SUITE 15 — the long tail, and how a hit feels =====
// Two things the game did not have: a reason to start run N+1 once everything was unlocked, and
// any weight at the moment of impact. Threat stopped at five bosses and hitstop was a hard freeze
// with nothing at all for TAKING damage — which is the one moment that has to feel like it cost
// you something.
let pass = 0, fail = 0;
function A(c, m) { if (c) { pass++; console.log('ok: ' + m) } else { fail++; console.log('FAIL: ' + m) } }
const near = (a, b, tol) => Math.abs(a - b) <= (tol === undefined ? 0.001 : tol);

loadMeta(); META.shards = 1e6; META.cls = 'vanguard'; META.threat = 0; newRun();
function OFF(depthM) {
  P.x = (CAMP_X + 400) * TILE; P.y = (SURFACE + (depthM || 400)) * TILE;
  const tx = Math.floor(P.x / TILE), ty = Math.floor(P.y / TILE);
  for (let y = -8; y <= 1; y++) for (let x = -14; x <= 14; x++) setTile(tx + x, ty + y, 0);
  for (let x = -14; x <= 14; x++) setTile(tx + x, ty + 2, 2);
  P.y = (ty + 1) * TILE - P.h / 2 - 1;
  ANCHOR = null; P.vx = 0; P.vy = 0; P.noFall = 9; P.dead = false; P.hp = P.maxhp; P.inv = 0;
  EN.length = 0; PROJ.length = 0; HAZ.length = 0; DMGN.length = 0;
}

// ---------- 1. THE LADDER HAS NO TOP ----------
console.log('\n-- echoes --');
{
  META.echoLv = 0; refreshEcho();
  A(Object.keys(ECHO).length === 0, 'Echo 0 changes nothing at all');
  A(echoList().length === 0, 'and names nothing');
  for (const n of [1, 3, ECHOES.length, ECHOES.length + 3, 40]) {
    META.echoLv = n; refreshEcho();
    A(Object.keys(ECHO).length > 0, 'Echo x' + n + ' is a real rule set');
    for (const k in ECHO) A(isFinite(ECHO[k]), 'Echo x' + n + ': ' + k + ' is finite');
  }
  META.echoLv = ECHOES.length + 2; refreshEcho();
  const wrapped = echoList().join(' ');
  A(/x2/.test(wrapped), 'past the end of the list the rules stack with themselves (' + wrapped.slice(0, 60) + ')');
  // and it keeps mattering: each rung has to be measurably worse than the one below
  let lastHp = 0, lastDmg = 0, mono = true;
  for (let n = 0; n <= 24; n++) {
    META.echoLv = n; refreshEcho();
    const hp = ECHO.hp || 1, dmg = ECHO.dmg || 1;
    if (hp < lastHp || dmg < lastDmg) mono = false;
    lastHp = hp; lastDmg = dmg;
  }
  A(mono, 'every rung is at least as hard as the one below it');
  // Health alone understates it: at Echo 24 every rule has stacked two or three times over, so
  // the honest measure is the combined pressure — tougher AND more of them AND you smaller.
  META.echoLv = 24; refreshEcho();
  const pressure = (ECHO.hp || 1) * (ECHO.dens || 1) / (ECHO.php || 1);
  A(pressure > 6, 'and by Echo 24 the world is genuinely another game (' + pressure.toFixed(1) +
    'x combined pressure: ' + (ECHO.hp || 1).toFixed(1) + 'x health, ' + (ECHO.dens || 1).toFixed(1) +
    'x density, you at ' + ((ECHO.php || 1) * 100).toFixed(0) + '%)');
}
{ // the rules must actually reach the world
  META.echoLv = 0; refreshEcho(); newRun(); OFF(1200);
  const plain = mkEnemy('brute', P.x + 40, P.y, null, threat(), null);
  const plainHP = maxHP();
  // Echo 8 rather than 6: Swift is the seventh rule, and a test that stops short of it is
  // asserting a rule the ladder has not handed out yet.
  META.echoLv = 8; refreshEcho(); newRun(); OFF(1200);
  const hard = mkEnemy('brute', P.x + 40, P.y, null, threat(), null);
  console.log('   brute at 1200m: Echo 0 -> ' + plain.hp.toFixed(0) + 'hp/' + plain.dmg.toFixed(0) + 'dmg, ' +
    'Echo 8 -> ' + hard.hp.toFixed(0) + 'hp/' + hard.dmg.toFixed(0) + 'dmg');
  A(hard.hp > plain.hp, 'an Echo makes enemies tougher');
  A(hard.dmg > plain.dmg, 'and harder-hitting');
  A(hard.arm > plain.arm, 'and better armoured');
  A(hard.spd > plain.spd, 'and faster');
  A(maxHP() < plainHP, 'and you smaller (' + plainHP + ' -> ' + maxHP() + ')');
  A(maxHP() >= 20, 'but never small enough to be a joke');
  // shards and rarity have to pay for it, or nobody climbs
  META.echoLv = 0; refreshEcho();
  let r0 = 0; for (let i = 0; i < 3000; i++) if (rollRarity(1500, 1) >= 2) r0++;
  META.echoLv = 10; refreshEcho();
  let r1 = 0; for (let i = 0; i < 3000; i++) if (rollRarity(1500, 1) >= 2) r1++;
  A(r1 > r0, 'and the ladder pays better in rarity (' + (r0 / 30).toFixed(1) + '% -> ' + (r1 / 30).toFixed(1) + '%)');
  A((ECHO.shard || 1) > 1, 'and in shards');
}
{ // Hollow leaves a wound; Silent takes the marker away
  META.echoLv = 8; refreshEcho(); newRun(); OFF(1200);
  A(ECHO.wound === 1, 'Echo 8 includes Hollow');
  HAZ.length = 0;
  const e = mkEnemy('crawler', P.x + 30, P.y, null, threat(), null); EN.push(e);
  e.hp = 0; killEnemy(e);
  A(HAZ.length > 0, 'and something that dies leaves a wound behind');
  META.echoLv = 9; refreshEcho();
  A(ECHO.nomark === 1, 'Echo 9 takes the ground markers away');
  META.echoLv = 0; refreshEcho();
}
{ // you cannot climb a rung you have not earned
  META.maxEcho = 3; setEcho(9);
  A((META.echoLv | 0) === 3, 'the ladder is capped at what you have earned');
  setEcho(-4);
  A((META.echoLv | 0) === 0, 'and cannot go below zero');
  META.maxEcho = 0; setEcho(0); refreshEcho();
}

// ---------- 2. BOUNTIES ----------
console.log('\n-- bounties --');
{
  META.echoLv = 0; refreshEcho(); newRun();
  A(BOUNTY.length === 3, 'three bounties a run');
  A(new Set(BOUNTY.map(b => b.id)).size === 3, 'and never the same one twice');
  A(BOUNTY.every(b => bDone(b) === false || b.test), 'none of them starts complete');
  A(bountyPayout() >= 0, 'the payout is a number before anything happens');
  // counters tick from the real hooks
  rollBounties(); BOUNTY = [BOUNTIES.find(b => b.id === 'swarm'), BOUNTIES.find(b => b.id === 'elites'),
    BOUNTIES.find(b => b.id === 'chests')];
  BSTATE = { hurt: 0, shrine: 0, swarm: 0, elites: 0, chests: 0 };
  OFF(600);
  for (let i = 0; i < 5; i++) { const e = mkEnemy('crawler', P.x + 30, P.y, null, threat(), null); EN.push(e); e.hp = 0; killEnemy(e) }
  A(BSTATE.swarm === 5, 'killing things counts kills');
  const el = mkEnemy('crawler', P.x + 30, P.y, ELITES[0], threat(), null); EN.push(el); el.hp = 0; killEnemy(el);
  A(BSTATE.elites === 1, 'and an elite counts as an elite');
  const ch = { x: P.x, y: P.y, opened: false }; CHESTS.push(ch); openChest(ch);
  A(BSTATE.chests === 1, 'and a chest counts as a chest');
  // payout only pays for what is finished
  BSTATE.swarm = 60;
  const pay = bountyPayout();
  A(pay === BOUNTIES.find(b => b.id === 'swarm').pay, 'the payout is exactly the finished bounties (' + pay + ')');
  A(!bDone(BOUNTY[1]), 'an unfinished bounty pays nothing');
}
{ // the no-hit and no-shrine bounties must notice
  BOUNTY = [BOUNTIES.find(b => b.id === 'nohit')];
  BSTATE = { hurt: 0 }; runDepth = 700;
  A(bDone(BOUNTY[0]), 'reaching depth untouched completes the flawless bounty');
  BSTATE.hurt = 1;
  A(!bDone(BOUNTY[0]), 'and taking a single hit ends it');
  runDepth = 0;
}
{ // a new run draws fresh ones and clears the board
  newRun();
  A(BOUNTY.length === 3, 'a new descent draws three more');
  A(Object.keys(BSTATE).filter(k => BSTATE[k] > 0).length === 0, 'and starts them all at zero');
}

// ---------- 3. IMPACT ----------
console.log('\n-- hitstop is a time scale, not a stop --');
{
  SET.hitstop = 100;
  HS = { t: 0, dur: 0, frac: 1, pre: 0 };
  hitStop(0.15, 0.02, 0.02);
  A(HS.t > 0, 'a stop can be requested');
  A(HS.frac > 0, 'and it is never a hard zero — time crawls, it does not stop');
  A(HS.pre > 0, 'and the impact frame plays at full speed first');
  const heavy = HS.t;
  hitStop(0.05, 0.3, 0.01);
  A(HS.t === heavy, 'a lighter stop never shortens a heavier one already running');
  SET.hitstop = 0; HS = { t: 0, dur: 0, frac: 1, pre: 0 };
  hitStop(0.15, 0.02, 0.02);
  A(HS.t === 0, 'and the slider genuinely turns it off');
  SET.hitstop = 100;
}
{ // taking damage is what earns it
  newRun(); OFF(600); NOCRIT();
  HS = { t: 0, dur: 0, frac: 1, pre: 0 }; P.inv = 0; HURT = null;
  hurtPlayer(12, false, P.x + 200);
  A(HS.t > 0.08, 'taking a hit distorts time (' + (HS.t * 1000).toFixed(0) + 'ms)');
  A(HS.frac < 0.1, 'and does it hard — this is the moment that has to land');
  A(HURT && HURT.x > 0, 'and a flare marks the side it came from');
  P.inv = 0; HURT = null;
  hurtPlayer(12, false, P.x - 200);
  A(HURT && HURT.x < 0, 'from the other side too');
}
{ // dealing damage is lighter than taking it — otherwise every swing is a stutter
  newRun(); OFF(600);
  HS = { t: 0, dur: 0, frac: 1, pre: 0 };
  const e = mkEnemy('crawler', P.x + 16, P.y, null, threat(), null); EN.length = 0; EN.push(e);
  P.mcd = 0; doMelee();
  const dealt = HS.t;
  HS = { t: 0, dur: 0, frac: 1, pre: 0 }; P.inv = 0;
  hurtPlayer(12, false, P.x + 50);
  A(HS.t > dealt, 'taking a hit stops harder than landing one (' +
    (dealt * 1000).toFixed(0) + 'ms vs ' + (HS.t * 1000).toFixed(0) + 'ms)');
  A(dealt > 0, 'but landing one still has weight');
}

// ---------- 4. SCREENSHAKE IS CAPPED AND SHAPED ----------
console.log('\n-- screenshake --');
{
  newRun(); OFF(600);
  shake = 0; addShake(999);
  A(shake === SHAKE_MAX, 'shake can never exceed ' + SHAKE_MAX + 'px (it used to reach 16)');
  A(SHAKE_MAX / 272 < 0.035, 'which is under 3.5% of a 272px view');
  shake = 0; addShake(8, P.x + 2000, P.y);
  A(shake === 0, 'something a long way off does not shake the screen at all');
  shake = 0; addShake(8, P.x + 210, P.y);
  const half = shake;
  shake = 0; addShake(8, P.x, P.y);
  A(shake > half && half > 0, 'and distance falls off smoothly (' + half.toFixed(1) + ' vs ' + shake.toFixed(1) + ')');
  // an ordinary swing must not shake at all
  shake = 0;
  const e = mkEnemy('crawler', P.x + 16, P.y, null, threat(), null); EN.length = 0; EN.push(e);
  e.hp = 9e9; e.maxhp = 9e9;
  P.mcd = 0; doMelee();
  A(shake === 0, 'an ordinary hit does not shake the screen — only hitstop and a flash');
}

// ---------- 5. DAMAGE NUMBERS ----------
console.log('\n-- damage numbers --');
{
  newRun(); OFF(600); SET.dmgnum = 1; DMGN.length = 0;
  for (let i = 0; i < 10; i++) dmgNum(P.x, P.y, 7, '#fff');
  A(DMGN.length === 1, 'ten hits in the same place become one number');
  A(DMGN[0].v === 70, 'and it is the running total (' + DMGN[0].v + ')');
  DMGN.length = 0;
  dmgNum(P.x, P.y, 7, '#fff'); dmgNum(P.x + 200, P.y, 7, '#fff');
  A(DMGN.length === 2, 'but two places stay two numbers');
  DMGN.length = 0;
  dmgNum(P.x, P.y, 7, '#fff'); dmgNum(P.x, P.y, 7, '#fff', true);
  A(DMGN.length === 2, 'and a crit never merges into a normal hit');
  DMGN.length = 0;
  for (let i = 0; i < 200; i++) dmgNum(P.x + i * 40, P.y, 3, '#fff');
  A(DMGN.length <= DMGN_MAX, 'and the live count is capped at ' + DMGN_MAX + ' (' + DMGN.length + ')');
  SET.dmgnum = 0; DMGN.length = 0; dmgNum(P.x, P.y, 5, '#fff');
  A(DMGN.length === 0, 'the setting still turns them off');
  SET.dmgnum = 1;
}
{ // damage TAKEN never floats a number
  newRun(); OFF(600); DMGN.length = 0; P.inv = 0;
  hurtPlayer(20, false, P.x + 40);
  A(DMGN.length === 0, 'taking damage floats no number — the flare says it instead');
}

// ---------- 6. INPUT FORGIVENESS RUNS ON REAL TIME ----------
console.log('\n-- forgiveness --');
{
  newRun(); OFF(600);
  // At a tenth speed a fixed-step sim runs a tenth as many steps per real second, so a buffer
  // decayed on sim time would last ten times as long in the player's hand.
  // coyote must be 0 or the buffered jump simply FIRES on the first step and both cases read 0.
  TSCALE = 1; P.jbuf = 0.12; P.coyote = 0; P.onG = false;
  for (let i = 0; i < 6; i++) { P.coyote = 0; upPlayer(DT) }
  const normal = P.jbuf;
  TSCALE = 0.1; P.jbuf = 0.12; P.coyote = 0; P.onG = false;
  for (let i = 0; i < 6; i++) { P.coyote = 0; upPlayer(DT) }
  const slowed = P.jbuf;
  A(slowed < normal, 'the jump buffer decays faster in slow motion, so it lasts the same real time');
  A(slowed <= 0.001, 'and is gone within the same handful of real milliseconds');
  TSCALE = 1;
}

// ---------- 7. ACCESSIBILITY ----------
console.log('\n-- accessibility --');
{
  A(SET_DEF.shake !== undefined && SET_DEF.hitstop !== undefined && SET_DEF.flashes !== undefined,
    'shake, impact freeze and flashes are all separately adjustable');
  const keys = SETTINGS.map(o => o.k);
  for (const k of ['shake', 'hitstop', 'flashes', 'dmgnum', 'aimassist', 'autoaim', 'rumble'])
    A(keys.indexOf(k) >= 0, k + ' is reachable in the settings menu');
  SET.flashes = 0; FLASH = 0; flash(1);
  A(FLASH === 0, 'flashes off means no screen flash at all');
  SET.flashes = 100; FLASH = 0; flash(0.5);
  A(near(FLASH, 0.5), 'and full means full');
}

// ---------- 8. NOTHING LEAKS ON THE LADDER ----------
console.log('\n-- integrity at the top of the ladder --');
{
  META.maxEcho = 30; META.echoLv = 25; refreshEcho();
  META.cls = 'pyromancer'; META.threat = 5; newRun(); OFF(2900);
  EQ.melee = mkItem('greataxe', 2, 3140); EQ.armor = mkItem('plate', 2, 3140); refreshAttacks();
  for (const t of ['hollowed', 'chanter', 'warder', 'mortar', 'bloomback'])
    EN.push(mkEnemy(t, P.x + rr(-140, 140), P.y, null, threat(), null));
  let bad = 0;
  for (let i = 0; i < 60 * 30; i++) {
    upEnemies(DT); upProj(DT); upHaz(DT); upVents(DT); flushSpawns();
    if (!isFinite(P.hp) || !isFinite(P.maxhp)) bad++;
    for (const e of EN) if (!isFinite(e.hp) || !isFinite(e.dmg) || !isFinite(e.x)) bad++;
    if (P.dead) { P.dead = false; P.hp = P.maxhp }
  }
  A(bad === 0, 'Echo 25 at Threat V produces no NaN in 30 seconds');
  A(EN.length <= 125 && HAZ.length <= HAZ_MAX && PROJ.length <= 230, 'and every cap still holds');
  A(maxHP() > 0 && isFinite(maxHP()), 'and you still have a health bar');
  META.echoLv = 0; META.maxEcho = 0; META.threat = 0; refreshEcho();
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
if (fail) process.exit(1);
