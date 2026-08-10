// ===== SUITE 16 — THE DANCE: melee reach, soft-aim, step-in, the cashable punish =====
// The first real playtest said combat was "run at enemies and swing fast". The diagnosis was
// numeric: a 33px sword against enemies that commit from 53-71px. This suite locks the fix:
// reach that makes the punish window cashable, a spacing law that keeps every melee envelope
// SHORT of every band-definer's engage distance (you still cannot trade toe-to-toe), swing-time
// aim that bends but never overrides, a root-motion step-in that is not the Lunge gem, and a
// hold-at-range neutral where the dance actually happens.
let pass = 0, fail = 0;
function A(c, m) { if (c) { pass++; console.log('ok: ' + m) } else { fail++; console.log('FAIL: ' + m) } }
const near = (a, b, tol) => Math.abs(a - b) <= (tol === undefined ? 0.001 : tol);

loadMeta(); META.shards = 100000; META.cls = 'vanguard'; newRun();
// Movement wave: the AIR dodge is now gated behind the airdash gait, so any section that
// calls dodge() directly must be grounded (P.onG=true) and the gait table must start empty.
META.moves = {};
function OFF(depthM) {
  P.x = (CAMP_X + 400) * TILE; P.y = (SURFACE + (depthM === undefined ? 260 : depthM)) * TILE;
  const tx = Math.floor(P.x / TILE), ty = Math.floor(P.y / TILE);
  for (let y = -6; y <= 1; y++) for (let x = -20; x <= 20; x++) setTile(tx + x, ty + y, 0);
  for (let x = -20; x <= 20; x++) setTile(tx + x, ty + 2, 2);
  P.y = (ty + 1) * TILE - P.h / 2 - 1;
  ANCHOR = null; P.vx = 0; P.vy = 0; P.noFall = 9; P.dead = false; P.hp = P.maxhp; P.weight = 0; P.inv = 0;
  P.mcd = 0; P.rcd = 0; P.face = 1; P.block = false; P.dodgeT = 0; P.dodgeCd = 0;
  EN.length = 0; PROJ.length = 0; HAZ.length = 0; PART.length = 0;
}
function mkE(o) {
  return Object.assign({ x: P.x + 30, y: P.y, vx: 0, vy: 0, w: 14, h: 12, type: 'crawler', ai: 'walk', c: '#fff',
    hp: 5000, maxhp: 5000, dmg: 0, arm: 0, spd: 0, onG: false, flash: 0, dir: -1, boss: false, elite: null,
    shoot: null, scd: 99, atk: null, acd: 99, wind: 0, act: 0, rec: 0, invT: 0, phase: 0, ph: null, st: null }, o || {});
}
// A plain white sword and nothing else in the hand: arc 100, no gem surprises.
function plainSword() { EQ.melee = mkItem('sword', 0, 1); refreshAttacks(); P.mcd = 0 }
OFF(); IN.manual = false; IN.x = 0; SET.aimassist = 55;

// ---------- A. REACH & THE SPACING LAW ----------
console.log('\n-- reach & spacing law --');
A(GEAR.sword.range >= 34 && GEAR.sword.range <= 38, 'sword range in the cashable-punish band [34,38]');
A(typeof MELEE_STEP === 'number' && MELEE_STEP > 0 && MELEE_STEP <= 12, 'MELEE_STEP exists and is small');
// Per-biome max engage reach over rostered, armed, non-boss grunts. The surface rim is excluded:
// its roster is the tutorial crawler and greataxe-class gear (ilvl 900) cannot drop there.
const bandMax = {};
for (let i = 1; i < BIOMES.length; i++) {
  const name = BIOMES[i][1], roster = BIOMES[i][4] || [];
  let mx = 0;
  for (const t of roster) { const E = ENEMIES[t]; if (E && E.atk && !E.boss) mx = Math.max(mx, atkReach(E.atk)) }
  if (mx > 0) bandMax[name] = mx;
}
console.log('   band max engage reach: ' + Object.keys(bandMax).map(k => k + ' ' + bandMax[k].toFixed(0)).join(', '));
for (const m of ['sword', 'axe', 'greataxe']) {
  const env = GEAR[m].range + MELEE_STEP + 7;
  for (const b in bandMax) A(env < bandMax[b], m + ' envelope ' + env + 'px < ' + b + ' max engage ' + bandMax[b].toFixed(0) + 'px');
}
// the melee-slot bash takes no step (shield identity), but assert the stricter envelope anyway
for (const b in bandMax) A(GEAR.shield.range + MELEE_STEP + 7 < bandMax[b], 'shield bash envelope < ' + b + ' max engage');
// The starter sword out-ranges NOTHING that defines a band.
for (const t of ['crawler', 'rockling', 'brute', 'shieldman', 'smith', 'hollowed', 'bloomback', 'wraith']) {
  A(GEAR.sword.range + MELEE_STEP + 7 < atkReach(ENEMIES[t].atk), 'sword envelope < ' + t + ' reach');
}

// ---------- B. SOFT-AIM ----------
console.log('\n-- soft-aim --');
plainSword(); NOCRIT();
{ // B1 flyer overhead, neutral input, assist on: the cone tilts and the bat is hittable
  OFF(); plainSword(); SET.aimassist = 55; IN.manual = false; IN.x = 0;
  const bat = mkE({ type: 'bat', ai: 'fly', w: 12, h: 10, x: P.x, y: P.y - 28 });
  EN.push(bat); const h0 = bat.hp; doMelee();
  A(bat.hp < h0, 'flyer straight overhead is hittable on neutral input (was 90 degrees off a 50 degree half-arc)');
}
{ // B2 overlap forgiveness is unconditional — assist OFF
  OFF(); plainSword(); SET.aimassist = 0; IN.manual = false; IN.x = 0;
  const bat = mkE({ type: 'bat', ai: 'fly', w: 12, h: 10, x: P.x + 2, y: P.y - 14 });
  EN.push(bat); const h0 = bat.hp; doMelee();
  A(bat.hp < h0, 'an enemy overlapping your body is hit by any swing, assist off');
  SET.aimassist = 55;
}
{ // B3 held direction is law: enemy behind, input held forward — no spin, no hit
  OFF(); plainSword(); IN.x = 1; P.face = 1;
  const e = mkE({ x: P.x - 40, y: P.y }); EN.push(e); const h0 = e.hp; doMelee();
  A(e.hp === h0 && P.face === 1, 'held direction is never overridden — enemy behind stays unhit, face unchanged');
}
{ // B4 neutral snap: same enemy, neutral input — face the bite and hit it
  OFF(); plainSword(); IN.x = 0; P.face = 1;
  const e = mkE({ x: P.x - 40, y: P.y }); EN.push(e); const h0 = e.hp; doMelee();
  A(e.hp < h0 && P.face === -1, 'neutral input snaps the face to the nearest bite and lands');
}
{ // B5 manual aim owns the swing even while moving
  OFF(); plainSword(); IN.manual = true; IN.aimX = 0.05; IN.aimY = -1; IN.x = 1; P.face = 1;
  const e = mkE({ x: P.x, y: P.y - 30 }); EN.push(e); const h0 = e.hp; doMelee();
  A(e.hp < h0, 'cursor owns the swing: flyer above hit while running, manual aim');
  IN.manual = false; IN.x = 0;
}
{ // B5b a mid-dodge swing NEVER reverses the roll: the swing aims, the body keeps its line
  OFF(); plainSword(); IN.manual = false; IN.x = 0; SET.aimassist = 55;
  const e = mkE({ x: P.x - 40, y: P.y }); EN.push(e);
  P.face = 1; P.dodgeCd = 0; P.onG = true; dodge();   // grounded: the air dodge is earned, not free
  A(P.dodgeT > 0, 'rolling');
  P.mcd = 0; doMelee();
  A(P.face === 1, 'swinging mid-roll leaves the roll direction alone (a flip reversed the dodge and exited you on the enemy)');
}
{ // B6 assist off = exactly the old behavior
  OFF(); plainSword(); SET.aimassist = 0; IN.manual = false; IN.x = 0; P.face = 1;
  const e = mkE({ x: P.x - 40, y: P.y }); EN.push(e); const h0 = e.hp; doMelee();
  A(e.hp === h0 && P.face === 1, 'aimassist 0: no auto path at all — old behavior preserved');
  SET.aimassist = 55;
}

// ---------- C. STEP-IN ----------
console.log('\n-- step-in --');
{ // C1 committed swing steps MELEE_STEP forward on open floor
  OFF(); plainSword(); IN.x = 0; P.face = 1;
  const x0 = P.x; doMelee();
  A(near(P.x - x0, MELEE_STEP, 0.6), 'a committed swing steps ' + MELEE_STEP + 'px (got ' + (P.x - x0).toFixed(1) + ')');
}
{ // C2 the Lunge gem is excluded: it stays the BIG dash with its own i-frames
  OFF(); EQ.melee = mkItem('sword', 0, 1); EQ.melee.sockets[0] = { id: 'lunge', tier: 1 }; refreshAttacks(); P.mcd = 0;
  A((ATK.melee.lunge || 0) > 100, 'lunge gem socketed: attack carries a real dash');
  IN.x = 0; P.face = 1; const x0 = P.x, l = ATK.melee.lunge; doMelee();
  A(P.x === x0, 'no step-in on the Lunge gem swing (the dash is the movement)');
  A(P.vx === P.face * l, 'lunge dash velocity applied');
  A(P.inv >= 0.12, 'lunge i-frames intact');
}
{ // C3 swinging while retreating drifts along the retreat, never toward the enemy
  OFF(); plainSword(); const e = mkE({ x: P.x - 40, y: P.y }); EN.push(e);
  IN.x = 1; P.face = 1; const x0 = P.x; doMelee();
  A(P.x - x0 > 0, 'retreat-swing momentum goes with the retreat, not toward the enemy');
  IN.x = 0;
}
{ // C4 the step respects walls
  OFF(); plainSword(); const tx = Math.floor(P.x / TILE), ty = Math.floor(P.y / TILE);
  for (let y = -3; y <= 2; y++) setTile(tx + 1, ty + y, 2);
  IN.x = 0; P.face = 1; doMelee();
  A(!solidAt(P.x, P.y), 'step-in never embeds the player in a wall');
}

// ---------- D. THE PUNISH IS CASHABLE ----------
console.log('\n-- the punish is cashable --');
{ // D1 the headline: one swing from dodge-exit distance cashes the 1.25x
  OFF(); plainSword(); NOCRIT(); IN.x = 0; P.face = 1;
  const e = mkE({ atk: mkAtk(ENEMIES.crawler.atk), rec: 0.30, hp: 100000, maxhp: 100000, x: P.x + 46, y: P.y });
  EN.push(e); const h0 = e.hp; doMelee();
  const dealt = h0 - e.hp, want = ATK.melee.dmg * RECOVER_DMG;
  A(dealt > 0, 'a spent enemy at 46px (dodge-exit separation) is hit by one committed swing');
  A(near(dealt, want, want * 0.02), 'and the hit cashes exactly RECOVER_DMG (' + dealt.toFixed(1) + ' vs ' + want.toFixed(1) + ')');
}
{ // D2 the multiplier came from the window, not the reach
  OFF(); plainSword(); NOCRIT(); IN.x = 0; P.face = 1;
  const e = mkE({ atk: mkAtk(ENEMIES.crawler.atk), rec: 0, hp: 100000, maxhp: 100000, x: P.x + 46, y: P.y });
  EN.push(e); const h0 = e.hp; doMelee();
  const dealt = h0 - e.hp;
  A(near(dealt, ATK.melee.dmg, ATK.melee.dmg * 0.02), 'same distance, not spent: base damage only (' + dealt.toFixed(1) + ')');
}
{ // D3 full loop: tell observed live, then the window is humanly cashable
  OFF(); plainSword(); NOCRIT(); IN.x = 0; P.inv = 999;
  const e = mkE({ atk: mkAtk(ENEMIES.crawler.atk), acd: 0, dmg: 5, spd: 0, x: P.x + 40, y: P.y });
  EN.push(e);
  let sawWind = false;
  for (let i = 0; i < 400 && !(e.rec > 0); i++) { upEnemies(DT); if (e.wind > 0) sawWind = true }
  A(sawWind, 'the tell was observable before the window');
  A(e.rec > 0, 'the enemy is spent after its swing');
  // Keep the player at their own stand height — the crawler's center sits 21px lower on the
  // same floor, and the box-distance rule (not center distance) is what makes this reachable.
  P.x = e.x + 46; P.mcd = 0; P.face = -1; const h0 = e.hp; doMelee();
  A(e.hp < h0, 'and a player at dodge-exit distance lands the punish inside the window');
}
{ // D4 particle budgets: afterimage and stumble dust stay bounded
  OFF(); PART.length = 0; P.dodgeCd = 0; P.onG = true; dodge();   // grounded: air dodge is gated now
  for (let i = 0; i < 14; i++) upPlayer(DT);
  A(PART.length >= 10 && PART.length <= 25, 'dodge afterimage: ' + PART.length + ' particles in [10,25]');
  A(PART.length < 350, 'and under the PART cap');
  OFF(); PART.length = 0;
  const e = mkE({ atk: mkAtk(ENEMIES.crawler.atk), act: 0.01, x: P.x + 60, y: P.y });
  EN.push(e); P.inv = 999;
  for (let i = 0; i < 3 && !(e.rec > 0); i++) upEnemies(DT);
  A(e.rec > 0 && PART.length >= 3, 'spent-entry stumble dust fires the moment the window opens');
}

// ---------- E. HOLD-AT-RANGE ----------
console.log('\n-- hold-at-range --');
{ // E1 an armed walker on cooldown closes to ~70% reach and WAITS
  OFF(); IN.x = 0; P.inv = 999;
  const e = mkE({ atk: mkAtk(ENEMIES.crawler.atk), spd: 42, acd: 1.2, dmg: 5, x: P.x + 120, y: P.y });
  EN.push(e);
  const reach = atkReach(e.atk);
  for (let i = 0; i < 300; i++) { e.acd = Math.max(e.acd, 0.5); upEnemies(DT) }
  const d = Math.abs(e.x - P.x);
  A(d >= reach * 0.5 && d <= reach * 0.85 + e.w / 2, 'walker settles in the standoff band (' + d.toFixed(0) + 'px vs reach ' + reach.toFixed(0) + ')');
  A(Math.abs(e.vx) < 30, 'and WAITS there instead of nuzzling (' + Math.abs(e.vx).toFixed(0) + 'px/s)');
  // E2 release: the cooldown expires and it commits from hold distance immediately
  e.acd = 0; let armed = false;
  for (let i = 0; i < 5 && !armed; i++) { upEnemies(DT); if (e.wind > 0) armed = true }
  A(armed, 'cooldown up: it commits from hold distance within 5 frames (initiate branch untouched)');
}
{ // E3 exclusions: bosses never hold; the burrower still closes
  OFF(); P.inv = 999;
  const b = mkE({ atk: mkAtk(ENEMIES.crawler.atk), spd: 42, acd: 1.2, dmg: 5, boss: true, x: P.x + 120, y: P.y });
  EN.push(b);
  const reach = atkReach(b.atk);
  for (let i = 0; i < 300; i++) { b.acd = Math.max(b.acd, 0.5); upEnemies(DT) }
  A(Math.abs(b.x - P.x) < reach * 0.55, 'a boss never holds — it closes below the standoff band');
  OFF(); P.inv = 999;
  const w = mkEnemy('burrower', P.x + 200, P.y, null, threat(), null); EN.push(w);
  const d0 = Math.hypot(w.x - P.x, w.y - P.y);
  for (let i = 0; i < 240; i++) { w.acd = Math.max(w.acd, 0.5); upEnemies(DT) }
  A(Math.hypot(w.x - P.x, w.y - P.y) < d0 - 60, 'the burrower still closes distance — the wall is not a plan');
}
{ // E4 ambushers (windup <= 0.3s) never hold — a backpedal must not outrun their re-commit
  OFF(); P.inv = 999;
  A(ENEMIES.stalker.atk.wind <= 0.3, 'the stalker is an ambusher by its table');
  const s = mkE({ atk: mkAtk(ENEMIES.stalker.atk), spd: 42, acd: 1.2, dmg: 5, x: P.x + 120, y: P.y });
  EN.push(s);
  const reach = atkReach(s.atk);
  for (let i = 0; i < 300; i++) { s.acd = Math.max(s.acd, 0.5); upEnemies(DT) }
  A(Math.abs(s.x - P.x) < reach * 0.55, 'an ambusher rushes through the standoff band — the rush is its identity');
}

// ---------- F. SURFACING ----------
console.log('\n-- surfacing --');
A(GLYPH.kb.mel.indexOf('J') >= 0, 'keyboard melee label carries the key alternative (LMB/J)');
A(GLYPH.kb.rng.indexOf('K') >= 0, 'keyboard ranged label carries the key alternative (RMB/K)');
A(KEYMAP.mel.includes('KeyJ') && KEYMAP.rng.includes('KeyK'), 'the keys the labels promise exist');
{ // the three combat tips fire once each, at the teachable moment. Movement wave: the tips
  // now ride the queue — tipEv() queues at the trigger, upTips() flags at SHOW time — so
  // each trigger is pumped once (no boss present; TIP cleared so the held toast can't block).
  OFF(); META.tips = {}; TIPQ.length = 0; TIP = null; SET.hints = 1; P.inv = 999; IN.x = 0;
  closePanel(true); paused = false;   // D4's upPlayer frames opened the descent-bonus shrine; upTips respects paused
  const e = mkE({ atk: mkAtk(ENEMIES.crawler.atk), acd: 0, dmg: 5, spd: 0, x: P.x + 40, y: P.y });
  EN.push(e); upEnemies(DT); upTips(DT);
  A(META.tips.fight === 1, 'first windup within 240px teaches the buttons (in META.tips, the v3 store)');
  for (let i = 0; i < 400 && !(e.rec > 0); i++) upEnemies(DT);
  TIP = null; upTips(DT);
  A(META.tips.punish === 1, 'first spent enemy within 240px teaches the window');
  OFF(); P.inv = 0; P.hp = P.maxhp;
  const m = mkE({ atk: mkAtk(ENEMIES.crawler.atk), act: 0.1, dmg: 5, x: P.x + 2, y: P.y });
  EN.push(m); upEnemies(DT);
  TIP = null; upTips(DT);
  A(META.tips.dodge === 1, 'first hit taken teaches the dodge');
  // once ever: a second trigger leaves the flags untouched
  META.tips.fight = 1; OFF(); P.inv = 999; TIPQ.length = 0; TIP = null;
  const e2 = mkE({ atk: mkAtk(ENEMIES.crawler.atk), acd: 0, dmg: 5, spd: 0, x: P.x + 40, y: P.y });
  EN.push(e2); upEnemies(DT); upTips(DT);
  A(META.tips.fight === 1 && TIPQ.indexOf('fight') < 0, 'tips fire once per save, ever');
  META.tips = {}; TIPQ.length = 0; TIP = null;
}
// restore knobs other suites assume
SET.aimassist = 55; IN.manual = false; IN.x = 0; EN.length = 0; PART.length = 0;

console.log('\n' + pass + ' passed, ' + fail + ' failed');
if (fail) process.exit(1);
