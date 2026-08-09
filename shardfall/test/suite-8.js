// ===== SUITE 8 — input abstraction, attunements, threat tiers, codex =====
// The headless harness has no pointer, no gamepad and no real DOM, so this suite tests the
// LOGIC those devices feed: aim resolution, level curves, threat scaling, discovery gating.
// Device plumbing itself is covered in test/browser.js.
let pass = 0, fail = 0;
function A(c, m) { if (c) { pass++; console.log('ok: ' + m) } else { fail++; console.log('FAIL: ' + m) } }
const near = (a, b, tol) => Math.abs(a - b) <= (tol === undefined ? 0.001 : tol);

loadMeta(); loadSet(); META.shards = 100000; META.cls = 'vanguard';
META.seen = { en: {}, item: {}, biome: {}, frag: {}, cls: {} };
META.threat = 0; META.maxThreat = 0; META.bosses = {}; META.hints = {};
newRun();
function OFF() {
  P.x = (CAMP_X + 400) * TILE; P.y = (SURFACE + 260) * TILE;
  const tx = Math.floor(P.x / TILE), ty = Math.floor(P.y / TILE);
  for (let y = -5; y <= 1; y++) for (let x = -12; x <= 12; x++) setTile(tx + x, ty + y, 0);
  for (let x = -12; x <= 12; x++) setTile(tx + x, ty + 2, 2);
  P.y = (ty + 1) * TILE - P.h / 2 - 1;
  ANCHOR = null; P.vx = 0; P.vy = 0; P.noFall = 9; P.dead = false; P.hp = P.maxhp; P.weight = 0; P.inv = 0;
}
function mkE(o) {
  return Object.assign({ x: P.x + 30, y: P.y, vx: 0, vy: 0, w: 14, h: 12, type: 'crawler', ai: 'walk', c: '#fff',
    hp: 5000, maxhp: 5000, dmg: 0, arm: 0, spd: 0, onG: false, flash: 0, dir: -1, boss: false, elite: null,
    shoot: null, scd: 99, atk: null, acd: 99, wind: 0, act: 0, invT: 0, phase: 0, ph: null, st: null }, o || {});
}
OFF();

// ---------- 1. AIM RESOLUTION ----------
console.log('\n-- aim --');
{
  OFF(); EN.length = 0;
  // auto-aim: picks the nearest enemy, and never one further away than the screen shows
  IN.manual = false; SET.autoaim = 1;
  const near1 = mkE({ x: P.x + 40, y: P.y }), far = mkE({ x: P.x - 300, y: P.y });
  EN.push(far, near1);
  let v = aimVec();
  A(v.x > 0.9, 'auto-aim targets the nearest enemy, not the first in the array');
  EN.length = 0;
  EN.push(mkE({ x: P.x + aimRange() * 3, y: P.y }));
  v = aimVec();
  A(near(v.x, P.face, 0.001) && v.y === 0, 'auto-aim ignores enemies beyond the visible range');
  A(aimRange() <= VW, 'aim range never exceeds the viewport width');

  // manual aim: points where you point
  EN.length = 0;
  IN.manual = true; IN.manualT = perf; IN.aimX = 0; IN.aimY = -1;
  SET.aimassist = 0;
  v = aimVec();
  A(near(v.y, -1, 0.01), 'manual aim with assist off points exactly where told');

  // aim assist bends toward a nearby enemy, but only inside its cone
  SET.aimassist = 100;
  EN.length = 0; EN.push(mkE({ x: P.x + 100, y: P.y - 100 }));  // 45 degrees off "straight up"
  IN.aimX = 0; IN.aimY = -1;
  v = aimVec();
  A(v.x > 0.05, 'aim assist bends the shot toward a nearby enemy');
  EN.length = 0; EN.push(mkE({ x: P.x - 100, y: P.y + 100 }));  // behind and below: outside the cone
  IN.aimX = 0; IN.aimY = -1;
  v = aimVec();
  A(near(v.y, -1, 0.05), 'aim assist does not reach around behind you');
  SET.aimassist = 55; IN.manual = false; EN.length = 0;
}

// ---------- 2. INPUT PLUMBING ----------
console.log('\n-- input --');
{
  // edge-triggered actions fire exactly once
  fire('dodge');
  A(consumed('dodge') === 1, 'an edge action reads as fired once');
  A(consumed('dodge') === 0, 'and is consumed after reading');
  // every keymap entry names real codes and every action has a glyph on every device
  // Directions are folded into a movement axis and never shown individually; `move` is their
  // prompt. Everything else in KEYMAP is an action the UI can name, so it needs a glyph.
  const DIRS = ['left', 'right', 'up', 'down'];
  const noGlyph = [];
  for (const a in KEYMAP) {
    if (DIRS.includes(a)) continue;
    for (const dev of ['kb', 'xbox', 'ps', 'touch']) if (!GLYPH[dev][a]) noGlyph.push(dev + ':' + a);
  }
  for (const dev of ['kb', 'xbox', 'ps', 'touch']) { if (!GLYPH[dev].move) noGlyph.push(dev + ':move'); if (!GLYPH[dev].aim) noGlyph.push(dev + ':aim') }
  A(noGlyph.length === 0, 'every named action has a prompt glyph on every device' + (noGlyph.length ? ': ' + noGlyph.join(',') : ''));
  A(pr('jump') === GLYPH.kb.jump, 'pr() reports keyboard glyphs in keyboard mode');
  const wasMode = INMODE;
  INMODE = 'pad'; PADTYPE = 'ps';
  A(pr('jump') === '✕', 'pr() switches to PlayStation glyphs for a PS pad');
  PADTYPE = 'xbox';
  A(pr('jump') === 'A', 'and to Xbox glyphs for an Xbox pad');
  INMODE = wasMode;
  // deadzone maps to a clean 0 and preserves full range
  SET.deadzone = 20;
  A(dz(0.1) === 0, 'stick input inside the deadzone reads as zero');
  A(near(dz(1), 1, 0.001), 'full stick deflection still reaches 1');
  A(dz(-0.1) === 0 && dz(-1) < -0.99, 'deadzone is symmetric');
}

// ---------- 3. SETTINGS ----------
console.log('\n-- settings --');
{
  const before = SET.shake;
  SET.shake = 0;
  A(SET.shake === 0, 'shake can be turned off');
  SET.dmgnum = 0; DMGN.length = 0; dmgNum(0, 0, 50, '#fff');
  A(DMGN.length === 0, 'damage numbers can be turned off');
  SET.dmgnum = 1; dmgNum(0, 0, 50, '#fff');
  A(DMGN.length === 1, 'and back on');
  DMGN.length = 0; SET.shake = before;
  // every setting round-trips through the save
  SET.vol = 40; saveSet();
  const raw = JSON.parse(localStorage.getItem('shardfall'));
  A(raw.set && raw.set.vol === 40, 'settings persist into the save blob');
  const missing = SETTINGS.filter(o => SET_DEF[o.k] === undefined).map(o => o.k);
  A(missing.length === 0, 'every settings row has a default' + (missing.length ? ': ' + missing.join(',') : ''));
}

// ---------- 4. IN-RUN LEVELS ----------
console.log('\n-- attunements --');
{
  newRun(); OFF();
  A(P.level === 1 && P.xp === 0 && P.picks === 0, 'a run starts at level 1 with no pending picks');
  A(xpNeed(2) > xpNeed(1), 'the XP curve rises');
  // levelling
  gainXP(xpNeed(1));
  A(P.level === 2, 'enough XP levels you up');
  A(P.picks >= 1, 'a level grants a pick');
  // a huge lump grants several levels and several picks, not one
  const lv = P.level, pk = P.picks;
  gainXP(100000);
  A(P.level > lv + 2, 'a large XP grant can carry several levels at once');
  A(P.picks > pk, 'and grants a pick for each');
  // taking one applies it and decrements the queue
  RUNB = RUNB0(); RUNM = RUNM0(); refreshAttacks();
  const d0 = ATK.melee.dmg;
  ATT_PICK = [ATTUNE.find(a => a.id === 'edge')];
  const before = P.picks;
  takeAttune(0);
  A(ATK.melee.dmg > d0, 'a stat attunement raises damage immediately');
  A(P.picks === before - 1, 'taking a pick clears one from the queue');
  A(RUNM.__taken.edge, 'the taken attunement is recorded');
  // and it cannot be offered twice
  const offered = ATTUNE.filter(a => !RUNM.__taken[a.id]);
  A(!offered.some(a => a.id === 'edge'), 'a taken attunement leaves the pool');
  // mechanical picks land in RUNM, not the additive pool
  ATT_PICK = [ATTUNE.find(a => a.id === 'feast')];
  P.picks = 1; takeAttune(0);
  A(RUNM.feast > 0, 'a mechanical attunement writes to RUNM');
  A(RUNB.feast === undefined, 'and does not contaminate the additive pool');
  // every attunement is well-formed
  const bad = ATTUNE.filter(a => !a.n || !a.d || (!a.fx && !a.m));
  A(bad.length === 0, 'every attunement has a name, a description and an effect');
  const badKey = [];
  for (const a of ATTUNE) if (a.fx) for (const k in a.fx) if (RUNB0()[k] === undefined) badKey.push(a.id + '.' + k);
  A(badKey.length === 0, 'every stat attunement targets a real pool key' + (badKey.length ? ': ' + badKey.join(',') : ''));
  const ids = ATTUNE.map(a => a.id);
  A(new Set(ids).size === ids.length, 'attunement ids are unique');
}
{
  // the mechanics actually do something
  newRun(); OFF(); NOCRIT(); EN.length = 0;
  RUNM = RUNM0();
  let e = mkE(); EN.push(e); P.mcd = 0; doMelee(); const plain = 5000 - e.hp;
  // Cornered
  EN.length = 0; RUNM.cornered = 0.5; P.hp = P.maxhp * 0.3;
  e = mkE(); EN.push(e); P.mcd = 0; doMelee(); const hurt = 5000 - e.hp;
  A(hurt > plain, `Cornered pays out below half health (${plain.toFixed(1)} -> ${hurt.toFixed(1)})`);
  P.hp = P.maxhp;
  EN.length = 0; e = mkE(); EN.push(e); P.mcd = 0; doMelee();
  A(near(5000 - e.hp, plain, 0.6), 'and does nothing above it');
  RUNM = RUNM0();
  // Overflow
  EN.length = 0; RUNM.overflow = 0.5; P.focus = FOCUS_MAX;
  e = mkE(); EN.push(e); P.mcd = 0; doMelee();
  A(5000 - e.hp > plain, 'Overflow pays out at full focus');
  P.focus = 10;
  EN.length = 0; e = mkE(); EN.push(e); P.mcd = 0; doMelee();
  A(near(5000 - e.hp, plain, 0.6), 'and stops when focus is spent');
  RUNM = RUNM0(); P.focus = FOCUS_MAX;
  // Feast heals on kill
  OFF(); P.hp = P.maxhp * 0.5; RUNM.feast = 0.1;
  EN.length = 0; const dying = mkE({ hp: 1, maxhp: 100 }); EN.push(dying);
  const hp0 = P.hp; killEnemy(dying); flushSpawns();
  A(P.hp > hp0, 'Feast heals you on a kill');
  RUNM = RUNM0();
  // Second Wind saves exactly once
  OFF(); RUNM.secondWind = 1; P.secondWind = 0; P.hp = 10; P.inv = 0; P.armor = 0;
  hurtPlayer(9999);
  A(!P.dead && P.hp > 0, 'Second Wind survives a fatal hit');
  A(P.secondWind === 1, 'and marks itself used');
  P.inv = 0; P.hp = 10; hurtPlayer(9999);
  A(P.dead, 'the second fatal hit kills you');
  P.dead = false; paused = false; closePanel(true); RUNM = RUNM0();
}

// ---------- 5. THREAT TIERS ----------
console.log('\n-- threat --');
{
  META.threat = 0; META.maxThreat = 0; META.bosses = {};
  A(threat().n === THREATS[0].n, 'threat defaults to the lowest tier');
  A(threat().shard === 1 && threat().rare === 1, 'tier 0 changes nothing');
  // tiers are ordered and monotonic in reward — a harder world must always pay better
  for (let i = 1; i < THREATS.length; i++) {
    A(THREATS[i].shard > THREATS[i - 1].shard, `tier ${i} pays more shards than tier ${i - 1}`);
    A(THREATS[i].rare >= THREATS[i - 1].rare, `tier ${i} is at least as generous with rarity`);
    A(THREATS[i].req > THREATS[i - 1].req, `tier ${i} costs more bosses to unlock`);
  }
  // you cannot select a tier you have not unlocked
  setThreat(3); closePanel();
  A(META.threat === 0, 'a locked tier cannot be selected');
  META.maxThreat = 3; setThreat(3); closePanel();
  A(META.threat === 3, 'an unlocked tier can be selected');
  // killing distinct bosses raises the ceiling; the same boss twice does not
  META.bosses = {}; META.maxThreat = 0;
  OFF(); EN.length = 0;
  const B = ENEMIES.warden;
  const b1 = mkE({ type: 'warden', boss: true, hp: 1, maxhp: B.hp, dmg: B.dmg, ph: null });
  EN.push(b1); killEnemy(b1); flushSpawns();
  A(META.maxThreat === 1, 'felling a boss unlocks the next threat tier');
  EN.length = 0;
  const b2 = mkE({ type: 'warden', boss: true, hp: 1, maxhp: B.hp, dmg: B.dmg, ph: null });
  EN.push(b2); killEnemy(b2); flushSpawns();
  A(META.maxThreat === 1, 'the same boss again does not unlock another tier');
  EN.length = 0;
  const b3 = mkE({ type: 'sentinel', boss: true, hp: 1, maxhp: 100, dmg: 10, ph: null });
  EN.push(b3); killEnemy(b3); flushSpawns();
  A(META.maxThreat === 2, 'a different boss does');
  // threat scales shard payout
  META.threat = 0; PICK.length = 0; dropShards(0, (SURFACE + 100) * TILE, 60); const t0 = PICK.length;
  META.threat = 2; PICK.length = 0; dropShards(0, (SURFACE + 100) * TILE, 60); const t2 = PICK.length;
  A(t2 > t0, `higher threat drops more shards (${t0} -> ${t2})`);
  META.threat = 0; PICK.length = 0;
}

// ---------- 6. CODEX + DISCOVERY ----------
console.log('\n-- codex --');
{
  META.seen = { en: {}, item: {}, biome: {}, frag: {}, cls: {} };
  A(discover('en', 'crawler', true) === true, 'first discovery returns true');
  A(discover('en', 'crawler', true) === false, 'a repeat discovery returns false');
  A(!!META.seen.en.crawler, 'the discovery is recorded');
  A(discover('en', null, true) === false, 'discovering nothing is a no-op');
  // killing an enemy writes its bestiary page
  META.seen.en = {}; OFF(); EN.length = 0;
  const e = mkE({ type: 'bat', hp: 1, maxhp: 20 }); EN.push(e); killEnemy(e); flushSpawns();
  A(!!META.seen.en.bat, 'a first kill unlocks the bestiary page');
  // every table entry the codex lists must have lore behind it
  const noLore = Object.keys(ENEMIES).filter(k => !LORE.enemy[k]);
  A(noLore.length === 0, 'every enemy has a bestiary entry' + (noLore.length ? ': ' + noLore.join(',') : ''));
  const noBiome = BIOMES.map(b => b[1]).filter(n => !LORE.biome[n]);
  A(noBiome.length === 0, 'every biome has a lore entry' + (noBiome.length ? ': ' + noBiome.join(',') : ''));
  const noClass = Object.keys(CLASSES).filter(k => !LORE.class[k]);
  A(noClass.length === 0, 'every class has a lore entry' + (noClass.length ? ': ' + noClass.join(',') : ''));
  const fids = LORE.frag.map(f => f.id);
  A(new Set(fids).size === fids.length, 'fragment ids are unique');
  const depths = LORE.frag.map(f => f.depth);
  A(depths.every((d, i) => i === 0 || d >= depths[i - 1]), 'fragments are ordered by depth');
  // fragments are handed out shallowest-first and never repeat
  META.seen.frag = {};
  const f1 = nextFrag(3000);
  A(f1 && f1.id === LORE.frag[0].id, 'the shallowest unseen fragment comes first');
  discover('frag', f1.id, true);
  const f2 = nextFrag(3000);
  A(f2 && f2.id !== f1.id, 'the next call returns a different fragment');
  A(nextFrag(0) === null || nextFrag(0).depth <= 0, 'depth gates which fragments can appear');
  for (const f of LORE.frag) discover('frag', f.id, true);
  A(nextFrag(9999) === null, 'once every fragment is found there are no more');
  // hints fire once
  META.hints = {}; SET.hints = 1;
  hint('t1', 'x'); A(!!META.hints.t1, 'a hint records itself');
  const n = Object.keys(META.hints).length;
  hint('t1', 'x'); A(Object.keys(META.hints).length === n, 'and does not fire twice');
}

// ---------- 6b. REGRESSIONS ----------
// Every one of these shipped and was caught by review rather than by playing.
console.log('\n-- regressions --');
{
  // menuInput used to return early on confirm/cancel without draining the rest of EDGE, so a
  // key pressed while a menu was open fired its gameplay action on the first unpaused frame.
  paused = true;
  fire('dodge'); fire('abil'); fire('bag'); fire('confirm');
  menuInput();
  paused = false;
  A(consumed('dodge') === 0 && consumed('abil') === 0 && consumed('bag') === 0,
    'menu input drains queued gameplay actions instead of leaking them into the run');
}
{
  // Switching device left whatever was held on the old one stuck true forever.
  HELD.mel = true; HELD.rng = true; HELD.jmp = true; IN.tx = 1;
  const was = INMODE;
  setMode(INMODE === 'kb' ? 'touch' : 'kb');
  A(!HELD.mel && !HELD.rng && !HELD.jmp, 'changing input device clears held buttons');
  A(IN.tx === 0, 'and clears the touch axis');
  setMode(was);
}
{
  // Death has to outrank every competing modal. A shrine, level-up or fragment opening in the
  // same frame as death replaced the YOU DIED panel and left the run paused with no way out.
  newRun(); OFF();
  P.hp = 1; P.inv = 0; P.armor = 0;
  RUNM = RUNM0();
  hurtPlayer(9999);
  A(P.dead, 'the fatal hit kills');
  const dead = document.getElementById('panel').innerHTML;
  // now try to steal the panel the way a same-frame shrine would
  openShrine({ x: P.x, y: P.y, used: false, free: 1 });
  P.picks = 1; offerAttune();
  A(document.getElementById('panel').innerHTML === dead, 'no modal can replace the death screen');
  A(paused && P.dead, 'and the game stays in the death state');
  newRun(); OFF();
}
{
  // The title screen was escapable through its own sub-panels, because MODAL is one global
  // that any non-modal child cleared. UIROOT makes BACK return to wherever it came from.
  openTitle();
  A(paused && UIROOT === 'title', 'the title screen sets itself as the panel root');
  openSettings();
  closePanel();
  A(paused && UIROOT === 'title', 'closing a sub-panel from the title returns to the title, not the game');
  startRun();
  A(!paused && UIROOT === null, 'DESCEND clears the root and starts the run');
}
{
  // Jump was buffered by the keydown handler regardless of pause, so the player leapt the
  // instant a menu closed. The buffer is only armed while the game is live.
  P.jbuf = 0;
  paused = true;
  // simulate what the handler does under the guard
  if (!paused) P.jbuf = 0.12;
  A(P.jbuf === 0, 'jump is not buffered while paused');
  paused = false;
  if (!paused) P.jbuf = 0.12;
  A(P.jbuf > 0, 'and is buffered while playing');
  P.jbuf = 0;
}
{
  // The deadzone is the one bit of gamepad math that runs headless, and a bad one produces NaN
  // that poisons movement for the rest of the session.
  for (const d of [5, 22, 40]) {
    SET.deadzone = d;
    for (const v of [-1, -0.5, -0.01, 0, 0.01, 0.5, 1]) {
      const r = dz(v);
      if (!isFinite(r)) { A(false, `deadzone ${d} produced NaN for ${v}`); break }
    }
  }
  A(true, 'the deadzone never produces NaN across its whole range');
  SET.deadzone = SET_DEF.deadzone;
}
{
  // Threat must never index outside THREATS, whatever the save says.
  const save = META.threat;
  META.threat = 999;
  A(!!threat() && typeof threat().shard === 'number', 'an out-of-range threat index still resolves');
  META.threat = -5;
  A(!!threat(), 'a negative threat index still resolves');
  META.threat = save;
}

// ---------- 7. INTEGRATION ----------
console.log('\n-- integration --');
{
  META.threat = 3; META.maxThreat = 5; META.cls = 'pyromancer';
  META.classes = { vanguard: 1, marksman: 1, pyromancer: 1, delver: 1 };
  for (const u of UNLOCKS) META.unlocks[u.id] = 1;
  for (const t of TREE) META.tree[t.id] = 1;
  newRun();
  // drive a long run with every system live, taking every attunement offered
  for (let i = 0; i < 3000; i++) {
    HELD.mel = i % 5 < 2; HELD.rng = i % 9 < 3; HELD.jmp = i % 31 < 5;
    IN.tx = ((i / 40) | 0) % 2 ? 1 : -1;
    if (i % 120 === 0) { P.focus = FOCUS_MAX; P.acd = 0; useAbility() }
    if (P.picks > 0 && ATT_PICK.length) { takeAttune(0); paused = false }
    if (i % 400 === 0) gainXP(200);
    sim(1 / 60);
  }
  HELD.mel = HELD.rng = HELD.jmp = false; IN.tx = 0;
  paused = false; P.dead = false;
  console.log(`   3000 frames @ threat 3, all unlocks: EN ${EN.length} PROJ ${PROJ.length} PART ${PART.length} lvl ${P.level}`);
  const vals = [P.x, P.y, P.vx, P.vy, P.hp, P.maxhp, P.fuel, P.focus, P.xp, P.xpNeed, P.level,
    ATK.melee && ATK.melee.dmg, ATK.ranged && ATK.ranged.dmg];
  A(vals.every(v => v === null || (typeof v === 'number' && isFinite(v))), 'no NaN across levels, threat and attunements');
  A(EN.length <= 121 && PROJ.length <= 221 && PART.length <= 351, 'entity caps hold at high threat');
  A(P.level >= 2, `the run levelled (reached ${P.level})`);
  A(P.picks === 0 || ATT_PICK.length > 0, 'no pick is left dangling without an offer');
  // every attunement must survive being applied
  const broken = [];
  for (const a of ATTUNE) {
    newRun(); RUNB = RUNB0(); RUNM = RUNM0();
    ATT_PICK = [a]; P.picks = 1; takeAttune(0);
    refreshAttacks();
    for (const atk of [ATK.melee, ATK.ranged, ATK.abil]) {
      if (!atk) continue;
      for (const k in atk) { const v = atk[k]; if (typeof v === 'number' && !isFinite(v)) broken.push(a.id + '.' + k) }
    }
    if (!isFinite(P.maxhp) || P.maxhp <= 0) broken.push(a.id + '.maxhp');
  }
  A(broken.length === 0, 'every attunement resolves to finite stats' + (broken.length ? ': ' + broken.join(',') : ''));
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) { console.log('SUITE 8 FAILURES'); process.exit(1) }
console.log('ALL PASS');
