// ===== SUITE 17 — THE GAITS: movement track, tips, dig feedback, the collection =====
// Playtest findings 1-4. Six deed-earned permanent movement upgrades (MOVES — never sold,
// never in UNLOCKS), the grap edge action, dodge feel (roll-cancel 0.22 per R8, perfect
// dodge per R10), the TIPS queue with boss-deferral, the blocked-carve report
// (CARVE_BLOCK/BED/VAULT per R6), digOf() honesty, and the UNIQ3-aware collection (R12).
let pass = 0, fail = 0;
function A(c, m) { if (c) { pass++; console.log('ok: ' + m) } else { fail++; console.log('FAIL: ' + m) } }
const near = (a, b, tol) => Math.abs(a - b) <= (tol === undefined ? 0.001 : tol);

loadMeta(); META.shards = 100000; META.cls = 'vanguard'; newRun();
function OFF(depthM) {
  P.x = (CAMP_X + 400) * TILE; P.y = (SURFACE + (depthM === undefined ? 260 : depthM)) * TILE;
  const tx = Math.floor(P.x / TILE), ty = Math.floor(P.y / TILE);
  for (let y = -6; y <= 1; y++) for (let x = -20; x <= 20; x++) setTile(tx + x, ty + y, 0);
  for (let x = -20; x <= 20; x++) setTile(tx + x, ty + 2, 2);
  P.y = (ty + 1) * TILE - P.h / 2 - 1;
  ANCHOR = null; P.vx = 0; P.vy = 0; P.noFall = 9; P.dead = false; P.hp = P.maxhp; P.weight = 0; P.inv = 0;
  P.mcd = 0; P.rcd = 0; P.face = 1; P.block = false; P.dodgeT = 0; P.dodgeCd = 0; P.jbuf = 0; P.coyote = 0;
  EN.length = 0; PROJ.length = 0; HAZ.length = 0; PART.length = 0; CHESTS.length = 0;
  // suite hygiene: upPlayer at depth would open the descent-bonus shrine (a modal) and the
  // 25m watermark would grant depth deeds mid-block — both are tested explicitly, not here.
  RUNBANDS.caves = 1; RUNBANDS.surface = 1; MOVE_CK = 1e9; closePanel(true); paused = false;
}
OFF(); IN.manual = false; IN.x = 0; SET.aimassist = 55; SET.hints = 1;

// ---------- A. THE MOVES TABLE ----------
console.log('\n-- MOVES integrity --');
A(MOVES.length === 6, 'six gaits');
const mids = MOVES.map(m => m.id);
A(new Set(mids).size === 6, 'ids unique');
for (const id of mids) A(!GEMS[id] && !GEAR[id], 'id shadows no gem/gear: ' + id);
{
  const other = [].concat(UNLOCKS.map(u => u.id), ATTUNE.map(a => a.id), BOONS.map(b => b.id), TREE.map(t => t.id));
  for (const id of mids) A(other.indexOf(id) < 0, 'id free of UNLOCKS/ATTUNE/BOONS/TREE: ' + id);
}
A(!UNLOCKS.some(u => mids.indexOf(u.id) >= 0), 'gaits NEVER enter UNLOCKS — the deed is the price');
for (const M of MOVES) {
  A(!!M.n && !!M.deed && typeof M.ck === 'function' && typeof M.d === 'function', M.id + ' carries n/deed/ck/d');
  if (M.fx) for (const k in M.fx) A(k === 'fuel' || k === 'drain', M.id + ' fx key legal: ' + k);
}
A(!!SFX.thunk && !!SFX.dash, 'the two new sounds exist (thunk, dash)');

// ---------- B. GRANTS ----------
console.log('\n-- grants --');
{
  META.moves = {}; META.bestDepth = 0; META.bosses = {}; META.maxEcho = 0; runDepth = 0;
  checkMoves(1);
  A(Object.keys(META.moves).length === 0, 'a fresh save earns nothing');
  META.bestDepth = 340; checkMoves(1);
  A(META.moves.draught === 1 && META.moves.airdash === 1 && !META.moves.glide, '340m: draught + airdash, not glide');
  META.bestDepth = 1540; checkMoves(1);
  A(META.moves.glide === 1, '1540m adds glide');
  META.bosses = { a: 1, b: 1, c: 1 }; checkMoves(1);
  A(META.moves.wallkick === 1 && META.moves.longarm === 1, 'three knots: wallkick + longarm');
  META.maxEcho = 2; checkMoves(1);
  A(META.moves.seamstep === 1, 'two escapes: seamstep');
  const snap = JSON.stringify(META.moves); checkMoves(1); checkMoves();
  A(JSON.stringify(META.moves) === snap, 'checkMoves is idempotent, loud or quiet');
  // live runDepth folds into the deed snapshot (bestDepth only updates at die())
  META.moves = {}; META.bestDepth = 0; runDepth = 200; checkMoves(1);
  A(META.moves.draught === 1, 'a deed reached mid-run grants mid-run (live runDepth)');
  runDepth = 0;
  // the celebration writes the death-screen line exactly once per gait
  META.moves = {}; META.bestDepth = 150; META.bosses = {}; META.maxEcho = 0; UNLOCK_MSG.length = 0;
  checkMoves();
  A(UNLOCK_MSG.filter(m => m === 'gait: Long Draught').length === 1, 'celebration writes UNLOCK_MSG once');
  checkMoves();
  A(UNLOCK_MSG.length === 1, 'and never a second time');
  META.bestDepth = 0; META.moves = {};
}

// ---------- C. FUEL ----------
console.log('\n-- fuel 45/65 + glide --');
{
  META.moves = {}; EQ.armor = null; RUNB = RUNB0(); refreshAttacks();
  A(maxFuel() === 45, 'bare tank is 45');
  META.moves.draught = 1; A(maxFuel() === 65, 'draught holds 65 — a veteran is never under the old 60');
  const hover = (glide) => {           // net fuel burned across 0.5s of airborne thrust
    META.moves = glide ? { glide: 1 } : {};
    OFF(); const y0 = P.y - 40; P.y = y0; P.onG = false; P.coyote = 0; P.dodgeT = 0;
    P.maxfuel = maxFuel(); P.fuel = P.maxfuel; HELD.jmp = true;
    for (let i = 0; i < 30; i++) { P.onG = false; upPlayer(DT); P.y = y0; P.vy = 0 }
    HELD.jmp = false; return P.maxfuel - P.fuel;
  };
  const d0 = hover(false), d1 = hover(true);
  // measure fuel deltas, never wall time (Date.now is pinned); regen (+8/s air) rides both
  A(near(d0, (FLY_DRAIN - FLY_REGEN_AIR) * 0.5, 0.8), 'baseline net drain matches the table (' + d0.toFixed(1) + ')');
  A(near(d1, (FLY_DRAIN * 0.68 - FLY_REGEN_AIR) * 0.5, 0.8), 'glide multiplies the DRAIN by 0.68, not the thrust (' + d1.toFixed(1) + ')');
  META.moves = {};
}

// ---------- D. AIRDASH ----------
console.log('\n-- airdash --');
{
  OFF(); META.moves = {};
  P.onG = true; dodge();
  A(P.dodgeT > 0 && P.dodgeAir === 0, 'the grounded dodge needs no gait');
  P.dodgeT = 0; P.dodgeCd = 0; P.onG = false; P.coyote = 0; dodge();
  A(P.dodgeT === 0, 'the airborne dodge refuses without the gait');
  META.moves.airdash = 1; P.airDash = 1; dodge();
  A(P.dodgeT > 0 && P.dodgeAir === 1, 'with the gait it fires');
  A(P.airDash === 0, 'and consumes the one charge');
  P.vy = 250; P.onG = false; upPlayer(DT);
  A(P.vy <= 0, 'vy clamped to <= 0 during the air dodge');
  A(near(Math.abs(P.vx), moveSpd() * 3.1, 2), 'air dash moves at 3.1x (ground roll stays 2.4x)');
  P.dodgeT = 0; P.dodgeCd = 0; P.onG = false; P.coyote = 0; dodge();
  A(P.dodgeT === 0, 'a second airborne dodge refuses until landing');
  P.onG = true; upPlayer(DT);
  A(P.airDash === 1, 'landing hands the charge back');
  shake = 0; P.dodgeT = 0; P.dodgeCd = 0; P.onG = true; dodge();
  A(shake === 0, 'no dodge ever shakes the screen');
  P.dodgeT = 0; P.dodgeCd = 0; P.inv = 0; P.onG = true; dodge();
  A(near(P.inv, 0.30 * (1 + inc('iframes'))), 'i-frames are 0.30 x (1 + inc(iframes))');
  META.moves = {};
}

// ---------- E. WALLKICK ----------
console.log('\n-- wallkick --');
{
  OFF(); META.moves = { wallkick: 1 }; IN.x = 0; HELD.jmp = false;
  const r0 = Math.floor((P.y - 6) / TILE), r1 = Math.floor(P.y / TILE);
  const wx = Math.floor((P.x + P.w / 2 + 3) / TILE) + 1;
  P.x = wx * TILE - 8;                    // probe (x + w/2 + 3) lands inside column wx
  setTile(wx, r0, 2); setTile(wx, r1, 2);
  P.onG = false; P.coyote = 0; P.jbuf = 0.12; P.vy = 50; P.face = 1;
  P.maxfuel = maxFuel(); P.fuel = P.maxfuel; const f0 = P.fuel;
  upPlayer(DT);
  A(P.vy === -JUMPV * 0.92, 'kick vy is exactly -JUMPV*0.92 (' + P.vy.toFixed(1) + ')');
  A(P.vx < 0, 'pushed AWAY from the wall');
  A(P.face === -1, 'face flips off the wall');
  A(P.fuel === f0, 'the kick is fuel-free');
  A(P.airDash === 1, 'and refreshes the air dash');
  A(P.jbuf === 0, 'jump buffer consumed');
  // SAME-WALL LOCKOUT: a second kick off the same wall is refused until landing or the
  // opposite wall — one wall must never be an infinite fuel-free ladder
  P.jbuf = 0.12; P.vy = 50; P.onG = false; P.coyote = 0;
  upPlayer(DT);
  A(P.vy > 0, 'same wall again: no kick (lockout holds)');
  const ox = Math.floor((P.x - P.w / 2 - 3) / TILE) - 1;
  setTile(ox, Math.floor((P.y - 6) / TILE), 2); setTile(ox, Math.floor(P.y / TILE), 2);
  P.x = (ox + 1) * TILE + 8; P.jbuf = 0.12; P.vy = 50; P.onG = false; P.coyote = 0; P.face = -1;
  upPlayer(DT);
  A(P.vy === -JUMPV * 0.92, 'the OPPOSITE wall kicks — two-wall chains stay the skill route');
  P.onG = true; upPlayer(DT);
  A(P.kickW === 0, 'landing hands the kick back');
  // no wall -> no kick
  setTile(wx, r0, 0); setTile(wx, r1, 0);
  P.onG = false; P.coyote = 0; P.jbuf = 0.12; P.vy = 50; upPlayer(DT);
  A(P.vy > 0, 'no wall, no kick');
  // no gait -> no kick
  META.moves = {}; setTile(wx, r0, 2); setTile(wx, r1, 2);
  P.x = wx * TILE - 8; P.onG = false; P.coyote = 0; P.jbuf = 0.12; P.vy = 50; upPlayer(DT);
  A(P.vy > 0, 'no gait, no kick');
  setTile(wx, r0, 0); setTile(wx, r1, 0);
}

// ---------- F. LONGARM (the 8-place edge action) ----------
console.log('\n-- longarm / grap --');
A('grap' in EDGE, 'EDGE carries grap');
A(!!GLYPH.kb.grap && !!GLYPH.xbox.grap && !!GLYPH.ps.grap && !!GLYPH.touch.grap, 'GLYPH carries grap on all four devices');
A(Array.isArray(KEYMAP.grap) && KEYMAP.grap.length > 0, 'KEYMAP binds grap');
A(!KEYMAP.abil.includes('KeyQ'), 'KeyQ no longer shadows abil (moved to grap)');
{
  OFF(); META.moves = {}; EN.length = 0; P.face = 1; P.vx = 0; P.vy = 0; P.grapCd = 0;
  IN.manual = false; SET.autoaim = 1;
  fire('grap'); readInput();
  A(P.vx === 0 && P.grapCd === 0 && EDGE.grap === 0, 'an unearned press is consumed and does nothing');
  META.moves.longarm = 1;
  const gx = Math.floor((P.x + 90) / TILE), gy = Math.floor(P.y / TILE);
  setTile(gx, gy, 2); setTile(gx, gy - 1, 2); setTile(gx, gy + 1, 2);
  const f0 = P.focus;
  fire('grap'); readInput();
  A(P.vx > 200, 'the line anchors to terrain and yanks (' + P.vx.toFixed(0) + ')');
  A(P.noFall > 0, 'with fall protection');
  A(P.grapCd === 3.5, 'on its own 3.5s cooldown');
  A(P.focus === f0, 'and it costs NO focus — the gem keeps the combat edge');
  P.vx = 0; fire('grap'); readInput();
  A(P.vx === 0 && near(P.grapCd, 3.5, 0.001), 'cooldown blocks reuse');
  upPlayer(DT);
  A(P.grapCd < 3.5, 'the cooldown decays with the others');
  // menuInput drains a press made behind a panel
  P.grapCd = 0; P.vx = 0; P.vy = 0; paused = true;
  fire('grap'); readInput();
  paused = false; readInput();
  A(P.vx === 0 && P.grapCd === 0, 'a press in a menu never fires on close (menuInput drains it)');
  // a miss is a short deny, not the full cooldown. Aim is pinned manually: the auto fallback
  // now reaches up-forward (a traversal hook wants ceilings), which would find the cave roof.
  setTile(gx, gy, 0); setTile(gx, gy - 1, 0); setTile(gx, gy + 1, 0);
  IN.manual = true; IN.aimX = 1; IN.aimY = 0;
  P.grapCd = 0; fire('grap'); readInput();
  A(P.grapCd === 0.5 && P.vx === 0, 'a miss denies at 0.5s');
  IN.manual = false;
  // and the terrain ray marches THROUGH enemies — a visible enemy must never occlude the hook
  // into a deny (the touch device has no manual aim at all)
  const occ = { x: P.x + 40, y: P.y - 30, vx: 0, vy: 0, w: 30, h: 30, hp: 500, type: 'crawler', ai: 'walk', c: '#fff', dmg: 0, spd: 0, onG: false, flash: 0, dir: 1, invT: 0, wind: 0, act: 0, rec: 0, acd: 99, scd: 99, atk: null, shoot: null, st: null };
  EN.push(occ);
  const cx = Math.floor((P.x + 90) / TILE), cy = Math.floor((P.y - 100) / TILE);
  setTile(cx, cy, 2);
  P.grapCd = 0; fire('grap'); readInput();
  A(P.grapCd === 3.5, 'an enemy in the line does not deny the terrain hook');
  EN.length = 0; setTile(cx, cy, 0);
  META.moves = {};
}

// ---------- G. SEAMSTEP ----------
console.log('\n-- seamstep --');
{
  const wall = (w, tile) => {  // stand left of a w-wide wall, dodge right into it
    OFF(); META.moves = { seamstep: 1 }; IN.x = 0; P.jbuf = 0;
    const r0 = Math.floor((P.y - 6) / TILE), r1 = Math.floor((P.y + 6) / TILE);
    const wx = Math.floor(P.x / TILE) + 2;
    for (let i = 0; i < w; i++) { setTile(wx + i, r0, tile); setTile(wx + i, r1, tile) }
    P.onG = true; P.dodgeT = 0; P.dodgeCd = 0; P.face = 1; dodge();
    for (let i = 0; i < 14; i++) upPlayer(DT);
    return { wx, r0, r1, crossed: P.x > (wx + w - 1) * TILE + TILE };
  };
  const one = wall(1, 2);
  A(one.crossed, 'the dodge passes through ONE tile of stone');
  A(getTile(one.wx, one.r0) === 2 && getTile(one.wx, one.r1) === 2, 'phasing, not carving — the wall survives');
  A(!wall(2, 2).crossed, 'a two-tile wall blocks');
  A(!wall(1, 3).crossed, 'bedrock always blocks');
  META.moves = {};
}

// ---------- H. DODGE FEEL ----------
console.log('\n-- dodge feel --');
{
  OFF(); P.onG = true;
  P.mcd = 2; P.rcd = 2; P.dodgeT = 0; P.dodgeCd = 0; dodge();
  A(P.mcd === 0.22 && P.rcd === 0.22, 'roll-cancel clamps recovery to 0.22 (R8 — slipstream stays better)');
  P.dodgeT = 0; P.dodgeCd = 0; P.mcd = 0.1; dodge();
  A(near(P.mcd, 0.1), 'a shorter recovery is never lengthened');
  // perfect dodge: the roll's own i-frames swallow a hit and pay 8 Focus, once per roll
  OFF(); P.onG = true; P.dodgeT = 0; P.dodgeCd = 0; P.focus = 10; dodge();
  const hp0 = P.hp; HS = { t: 0, dur: 0, frac: 1, pre: 0 };
  hurtPlayer(50, false, P.x + 40);
  A(P.hp === hp0, 'the swallowed hit deals nothing');
  A(near(P.focus, 10 + 8 * focusGainMul(), 0.01), 'and pays 8 Focus');
  const hs1 = HS.t; A(hs1 > 0, 'with a felt beat of hitstop');
  hurtPlayer(50, false, P.x + 40);
  A(near(P.focus, 10 + 8 * focusGainMul(), 0.01), 'once per roll only');
  A(P.hp === hp0, 'i-frames still hold');
  // a real hit stops HARDER than a perfect dodge (suite-15's ordering extends downward)
  P.dodgeT = 0; P.inv = 0; P.hp = P.maxhp; HS = { t: 0, dur: 0, frac: 1, pre: 0 };
  hurtPlayer(50, false, P.x + 40);
  A(HS.t > hs1, 'taking a real hit stops harder than a perfect dodge');
  A(P.hp < P.maxhp, 'and actually lands');
  // pd re-arms on the next roll
  P.inv = 0; P.dodgeT = 0; P.dodgeCd = 0; P.focus = 10; dodge();
  hurtPlayer(50, false, P.x + 40);
  A(near(P.focus, 10 + 8 * focusGainMul(), 0.01), 'the NEXT roll can perfect-dodge again');
}

// ---------- I. TIPS MACHINERY ----------
console.log('\n-- tips --');
{
  const tids = TIPS.map(t => t.id);
  A(new Set(tids).size === tids.length, 'tip ids unique');
  for (const T of TIPS) A(typeof T.msg === 'function' && !!T.ev, T.id + ' has ev + deferred msg');
  A(tids.indexOf('vaultdig') < tids.indexOf('dig'), 'vaultdig outranks dig at the shared hook (R5)');
  OFF(); META.tips = {}; TIPQ.length = 0; TIP = null;
  SET.hints = 0; tipEv('near');
  A(TIPQ.length === 0, 'SET.hints=0 kills the system at the source');
  SET.hints = 1; tipEv('near');
  A(TIPQ.length === 1 && TIPQ[0] === 'fight' && !META.tips.fight, 'a trigger queues; the flag waits for SHOW time');
  upTips(DT);
  A(META.tips.fight === 1 && TIP && TIP.id === 'fight' && TIPQ.length === 0, 'upTips shows one tip and flags it');
  TIP = null; tipEv('near');
  A(TIPQ.length === 0, 'a shown tip never re-queues');
  // boss deferral: queued, unflagged, held — shown once the arena is done
  EN.push({ boss: true, hp: 100, x: P.x + 400, y: P.y, w: 20, h: 20 });
  tipEv('spent'); upTips(DT);
  A(!META.tips.punish && TIPQ.length === 1, 'a live boss at 400px defers the queue');
  EN.length = 0; upTips(DT);
  A(META.tips.punish === 1, 'the tip lands when the arena is done');
  // dismissal: any edge press clears the held toast; plain movement does not
  A(!!TIP, 'a tip is up');
  IN.x = 1; readInput(); IN.x = 0;
  A(!!TIP, 'walking does not dismiss');
  fire('dodge'); readInput();
  A(TIP === null, 'an edge press dismisses');
  // expiry
  TIP = { id: 'x', t: 0.01 }; upTips(DT);
  A(TIP === null, 'a tip expires on its own 7s clock');
  META.tips = {}; TIPQ.length = 0; TIP = null;
}

// ---------- J. DIG FEEDBACK ----------
console.log('\n-- dig counters + digOf --');
{
  OFF();
  const dx = Math.floor(P.x / TILE) + 6, dy = Math.floor(P.y / TILE) - 3;
  setTile(dx, dy, 2);
  A(carve(dx * TILE + 8, dy * TILE + 8, 4, 0) === 0 && CARVE_BLOCK > 0 && CARVE_BED === 0 && CARVE_VAULT === 0,
    'stone vs dig 0: refused, CARVE_BLOCK reports it');
  setTile(dx, dy, 1);
  A(carve(dx * TILE + 8, dy * TILE + 8, 4, 0) > 0 && CARVE_BLOCK === 0,
    'dirt carves clean — no false report');
  setTile(dx, dy, 3);
  carve(dx * TILE + 8, dy * TILE + 8, 4, 0);
  A(CARVE_BED > 0 && CARVE_BLOCK === 0 && CARVE_VAULT === 0, 'bedrock reports as BED, never BLOCK');
  setTile(dx, dy, 11);
  carve(dx * TILE + 8, dy * TILE + 8, 4, 0);
  A(CARVE_VAULT > 0 && CARVE_BLOCK === 0, 'vault-seal brick (tile 11) reports as VAULT, not BLOCK (R6)');
  // tile 5 is the RUINS GROUND, not a seal — it must report BLOCK or the once-per-save
  // vaultdig tip burns itself on a plain corridor wall down there
  setTile(dx, dy, 5);
  carve(dx * TILE + 8, dy * TILE + 8, 4, 0);
  A(CARVE_BLOCK > 0 && CARVE_VAULT === 0, 'ruins ground brick reports as BLOCK, never VAULT');
  setTile(dx, dy, 0);
  // a refused sword swing queues the dig tip (the stone floor under OFF() is the refusal)
  META.tips = {}; TIPQ.length = 0; TIP = null; SET.hints = 1; EN.length = 0; CHESTS.length = 0;
  EQ.melee = mkItem('sword', 0, 1); refreshAttacks(); P.mcd = 0; P.thunkT = 0; perf = 100;
  doMelee();
  A(TIPQ.indexOf('dig') >= 0, 'a sword refused by stone queues the dig tip');
  // an axe carves the same floor and never thunks
  META.tips = {}; TIPQ.length = 0;
  EQ.melee = mkItem('axe', 0, 1); refreshAttacks(); P.mcd = 0; P.thunkT = 0;
  doMelee();
  A(TIPQ.indexOf('dig') < 0, 'an axe digs it — no tip, no thunk');
  // vault seal ahead of a sword: vaultdig queues FIRST
  OFF(); META.tips = {}; TIPQ.length = 0; SET.hints = 1;
  EQ.melee = mkItem('sword', 0, 1); refreshAttacks(); P.mcd = 0; P.thunkT = 0;
  const vx = Math.floor((P.x + GEAR.sword.range * 0.8) / TILE), vy = Math.floor(P.y / TILE);
  setTile(vx, vy, 11);
  doMelee();
  A(TIPQ[0] === 'vaultdig', 'a vault seal names itself before the generic dig lesson');
  setTile(vx, vy, 0);
  // digOf: honest against unique mods
  const fix = (base, unique, alt) => ({ base, rarity: unique ? 3 : 0, ilvl: 100, affixes: {}, tiers: {}, mods: {}, sockets: [], sc: [], chroma: -1, unique: unique ? base : null, alt: alt || 0, uid: 9e6 });
  A(digOf(fix('sword')) === 0, 'sword card says dig 0 — the lesson');
  A(digOf(fix('axe')) === 1, 'axe dig 1');
  A(digOf(fix('greataxe')) === 2, 'greataxe dig 2');
  A(digOf(fix('greataxe', 1, 0)) === 3, 'Worldbreaker digs 3 on a dig-2 base');
  A(digOf(fix('shield', 1, 0)) === 1, 'Bulwark digs 1 on a dig-0 shield');
  META.tips = {}; TIPQ.length = 0;
}

// ---------- K. THE COLLECTION ----------
console.log('\n-- collection --');
{
  A(typeof META.seen.gem === 'object' && typeof META.seen.uni === 'object', 'the two v3 buckets exist');
  A(uniTables().length === 3, 'uniTables picked up UNIQ3 the moment it landed (R12)');
  const bases = Object.keys(GEAR).filter(id => UNIQUES[id]);
  const expect = bases.length + bases.filter(id => UNIQ2[id]).length + bases.filter(id => UNIQ3[id]).length;
  A(uniTotal() === expect, 'uniques total derived from table presence (' + uniTotal() + ')');
  // gem pickup records the gem
  OFF(); delete META.seen.gem.cleave; PICK.length = 0;
  PICK.push({ x: P.x, y: P.y, kind: 'gem', id: 'cleave', t: 5 });
  upPickups(DT);
  A(META.seen.gem.cleave === 1, 'a picked gem enters seen.gem');
  // unique pickups key base+'#'+(alt+1) AND keep the legacy item write
  const uit = (alt) => ({ base: 'sword', rarity: 3, ilvl: 100, affixes: {}, tiers: {}, mods: {}, sockets: [null], sc: ['r'], chroma: -1, unique: 'sword', alt, uid: 9e6 + alt });
  delete META.seen.uni['sword#1']; delete META.seen.item.sword;
  PICK.length = 0; PICK.push({ x: P.x, y: P.y, kind: 'gear', item: uit(0), t: 5 });
  upPickups(DT);
  A(META.seen.uni['sword#1'] === 1, "a primary unique records as '#1'");
  A(META.seen.item.sword === 1, 'and the legacy base-seen write still happens');
  delete META.seen.uni['sword#2'];
  PICK.length = 0; PICK.push({ x: P.x, y: P.y, kind: 'gear', item: uit(1), t: 5 });
  upPickups(DT);
  A(META.seen.uni['sword#2'] === 1, "the alt records as '#2'");
  A(codexTitle('uni', 'sword#1') === UNIQUES.sword.n && codexTitle('uni', 'sword#2') === UNIQ2.sword.n,
    'codexTitle parses the #N suffix (R12)');
  A(codexTitle('gem', 'cleave') === GEMS.cleave.n, 'codexTitle names gems');
  // newRun marks the kit you spawn holding + the signature gem
  META.seen.item = {}; META.seen.gem = {};
  newRun();
  const C = CLASSES[META.cls], kit = META.useClassKit !== false ? C.kit : META.loadout;
  for (const sl of ['melee', 'ranged', 'armor']) if (kit[sl] && GEAR[kit[sl]])
    A(META.seen.item[kit[sl]] === 1, 'starting ' + sl + ' (' + kit[sl] + ') reads as discovered');
  if (C.gem) A(META.seen.gem[C.gem.id] === 1, 'the socketed signature gem is a known gem');
}

// harness hygiene: later suites inherit META
META.echoLv = 0; META.maxEcho = 0; META.threat = 0; META.moves = {}; META.tips = {};
TIPQ.length = 0; TIP = null; SET.hints = 1; EN.length = 0; PART.length = 0; IN.x = 0;

console.log('\n' + pass + ' passed, ' + fail + ' failed');
if (fail) process.exit(1);
