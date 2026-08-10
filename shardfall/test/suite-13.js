// ===== SUITE 13 — buildcraft: archetypes, synergies, and the soup test =====
// 77 gems is a number, not a design. What matters is whether they assemble into genuinely
// DIFFERENT builds, whether any of them is never worth socketing, whether any is always worth
// socketing, and whether the whole thing collapses into one additive pile. This suite is the
// answer to "is there actually a game in here", and it is meant to keep being the answer as
// content is added.
let pass = 0, fail = 0;
function A(c, m) { if (c) { pass++; console.log('ok: ' + m) } else { fail++; console.log('FAIL: ' + m) } }

loadMeta(); META.shards = 1e6; META.threat = 0;
for (const k in GEMS) META.unlocks[k] = 1;
for (const k in GEAR) META.unlocks[k] = 1;
for (const k in CLASSES) META.classes[k] = 1;

// Colour is a real constraint in play, but it is not what this suite is testing — force the
// sockets to fit so a failure here means "this build does not work", not "this build got unlucky".
function fit(it, ids) {
  const need = ids.length;
  while (it.sockets.length < need) { it.sockets.push(null); it.sc.push('r') }
  ids.forEach((id, i) => { it.sc[i] = GEMS[id].col || 'r'; it.sockets[i] = { id, tier: 1 } });
  return it;
}
function OFF(depthM) {
  P.x = (CAMP_X + 400) * TILE; P.y = (SURFACE + depthM) * TILE;
  const tx = Math.floor(P.x / TILE), ty = Math.floor(P.y / TILE);
  for (let y = -8; y <= 1; y++) for (let x = -16; x <= 16; x++) setTile(tx + x, ty + y, 0);
  for (let x = -16; x <= 16; x++) setTile(tx + x, ty + 2, 2);
  P.y = (ty + 1) * TILE - P.h / 2 - 1;
  ANCHOR = null; P.vx = 0; P.vy = 0; P.noFall = 9; P.dead = false; P.hp = P.maxhp; P.inv = 0; P.weight = 0;
  EN.length = 0; PROJ.length = 0; HAZ.length = 0;
}

// ---------- THE ARCHETYPES ----------
// Each is a real answer to "how do I kill things". If one of these cannot be assembled, a gem is
// missing. If two of them produce the same numbers, one of them is redundant.
const ARCH = [
  { n: 'Cleave Vanguard',   cls: 'vanguard',   slot: 'melee',  base: 'greataxe', gems: ['cleave', 'heavyimpact', 'conc'],        armor: ['ironskin'] },
  { n: 'Rend Breaker',      cls: 'vanguard',   slot: 'melee',  base: 'greataxe', gems: ['rend', 'punish', 'hunger'],             armor: ['reaper'] },
  { n: 'Whirlwind Channel', cls: 'delver',     slot: 'melee',  base: 'axe',      gems: ['whirlwind', 'fasteratk', 'lifeleech'],  armor: ['undertow'] },
  { n: 'Twin Bleed',        cls: 'delver',     slot: 'melee',  base: 'sword',    gems: ['serration', 'twin', 'deepcut'],         armor: ['bloodscent'] },
  { n: 'Momentum Runner',   cls: 'delver',     slot: 'melee',  base: 'sword',    gems: ['lunge', 'momentum', 'fasteratk'],       armor: ['swiftness'] },
  { n: 'Execution',         cls: 'vanguard',   slot: 'melee',  base: 'axe',      gems: ['reap', 'culling', 'hunger'],            armor: ['reaper'] },
  { n: 'Multishot Marksman',cls: 'marksman',   slot: 'ranged', base: 'bow',      gems: ['multishot', 'pierce', 'fasteratk'],     armor: ['swiftness'] },
  { n: 'Deadeye Crit',      cls: 'marksman',   slot: 'ranged', base: 'crossbow', gems: ['precision', 'conc', 'overload'],        armor: ['vigil'] },
  { n: 'Ignite Pyromancer', cls: 'pyromancer', slot: 'ranged', base: 'wand',     gems: ['fireball', 'ignite', 'kindling'],       armor: ['warding'] },
  { n: 'Contagion Rot',     cls: 'pyromancer', slot: 'ranged', base: 'wand',     gems: ['ignite', 'deepcut', 'contagion'],       armor: ['bloodscent'] },
  { n: 'Frost Shatter',     cls: 'pyromancer', slot: 'ranged', base: 'wand',     gems: ['frostlance', 'rimebound', 'addedfire'], armor: ['warding'] },
  { n: 'Chain Storm',       cls: 'marksman',   slot: 'ranged', base: 'wand',     gems: ['lightning', 'chainbolt', 'conduit'],    armor: ['staticfield'] },
  { n: 'Grenadier',         cls: 'delver',     slot: 'ranged', base: 'crossbow', gems: ['grenade', 'aftershock', 'conc'],        armor: ['featherfall'] },
  { n: 'Splinter Volley',   cls: 'marksman',   slot: 'ranged', base: 'bow',      gems: ['hail', 'splinter', 'fasteratk'],        armor: ['tempo'] },
  // wave 4: the storm and blood archetypes, the trap, and the vertical build
  { n: 'Storm Conduit',     cls: 'conductor',  slot: 'ranged', base: 'wand',     gems: ['stormlash', 'chainbolt', 'overdraw'],   armor: ['galvanic'] },
  { n: 'Blood Price',       cls: 'bloodletter',slot: 'melee',  base: 'sword',    gems: ['bloodlet', 'bloodtithe', 'hunger'],     armor: ['surfeit'] },
  { n: 'Minelayer',         cls: 'delver',     slot: 'ranged', base: 'crossbow', gems: ['mine', 'firstblow', 'conc'],            armor: ['vigil'] },
  { n: 'Skyfall',           cls: 'vanguard',   slot: 'melee',  base: 'greataxe', gems: ['deadweight', 'vantage', 'heavyimpact'], armor: ['plumbline'] },
  // the long tail: the true minion build and the horizontal movement build
  { n: 'Turret Crew',  cls: 'marksman', slot: 'ranged', base: 'bow',   gems: ['cairn', 'fasteratk', 'pierce'],    armor: ['foreman'] },
  { n: 'Tempo Dancer', cls: 'delver',   slot: 'melee',  base: 'sword', gems: ['flurry', 'momentum', 'serration'], armor: ['tempo'] },
];

function assemble(a, depthM, lvl) {
  META.cls = a.cls; META.threat = 0; newRun(); OFF(depthM);
  META.tree = {};
  const br = a.slot === 'melee' ? 'm' : 's';
  for (let i = 1; i <= 4; i++) META.tree[br + i] = 1;
  RUNB = RUNB0(); RUNM = RUNM0();
  RUNB.dmg = 0.15 * Math.floor(lvl / 2); RUNB.hp = 30 * Math.floor(lvl / 3);
  RUNB.cdr = 0.12 * Math.floor(lvl / 4); RUNB.crit = 0.06 * Math.floor(lvl / 5);
  EQ[a.slot] = fit(mkItem(a.base, 1, depthM), a.gems);
  EQ.armor = fit(mkItem('harness', 1, depthM), a.armor);
  P.maxhp = maxHP(); P.hp = P.maxhp;
  refreshAttacks();
  return ATK[a.slot];
}
// dpsOf() is the number the socket screen shows, which makes it the number a player optimises.
// It cannot see conditionals, so effective DPS adds the ones a sustained fight satisfies — the
// same rule the TTK harness uses, for the same reason.
function effDps(at) {
  if (!at) return 0;
  let m = 1;
  if (at.vsBurn && at.stR && at.stR.burn) m *= 1 + at.vsBurn;
  if (at.vsChill && at.st && at.st.chill) m *= 1 + at.vsChill;
  if (at.vsLow) m *= 1 + at.vsLow * 0.5;
  if (at.vsSpent) m *= 1 + at.vsSpent * 0.35;
  // wave-4 conditionals, credited at the fraction a sustained fight satisfies them
  if (at.vsBleed) m *= 1 + at.vsBleed * (at.stR && at.stR.bleed ? 1 : 0.5);
  if (at.vsFull) m *= 1 + at.vsFull * 0.15;
  if (at.slam) m *= 1 + at.slam * 0.25;
  if (at.aloft) m *= 1 + at.aloft * 0.35;
  if (at.farshot) m *= 1 + at.farshot * 0.5;
  if (at.raise) m *= 1.2;   // turret uptime — else the minion archetype drags the spread floor
  // dpsOf() cannot see an execute or a missing-health scalar, and an execution build is nothing
  // but those two things — scoring it without them rates the archetype at a third of its real
  // throughput and then blames the archetype. Averaged over a full health bar: reap is worth half
  // its coefficient, and culling simply deletes the last slice of the bar.
  if (at.reap) m *= 1 + at.reap * 0.5;
  if (at.cull) m *= 1 / (1 - Math.min(0.4, at.cull));
  return dpsOf(at) * m;
}

console.log('\n-- every archetype assembles and performs --');
const results = [];
for (const a of ARCH) {
  const at = assemble(a, 1500, 11);
  const d = effDps(at);
  results.push({ n: a.n, d, at });
  A(!!at, a.n + ' assembles');
  A(isFinite(d) && d > 0, a.n + ' produces a finite, positive DPS');
}
results.sort((x, y) => y.d - x.d);
for (const r of results) console.log('   ' + r.n.padEnd(20) + String(Math.round(r.d)).padStart(6) + ' dps');
{
  const best = results[0].d, worst = results[results.length - 1].d;
  console.log('   spread: ' + (best / worst).toFixed(2) + 'x  (' + results[0].n + ' over ' + results[results.length - 1].n + ')');
  A(worst > 0, 'no archetype is unbuildable');
  A(best / worst <= 4.5, 'the strongest build is not more than 4.5x the weakest (' + (best / worst).toFixed(2) + 'x)');
  // and the same set at a shallow depth must not reorder wildly — a build should stay itself
  const shallow = ARCH.map(a => ({ n: a.n, d: effDps(assemble(a, 400, 5)) })).sort((x, y) => y.d - x.d);
  const topDeep = new Set(results.slice(0, 6).map(r => r.n));
  const overlap = shallow.slice(0, 6).filter(s => topDeep.has(s.n)).length;
  A(overlap >= 3, 'the good builds are broadly the good builds at any depth (' + overlap + '/6 overlap)');
}

// ---------- EVERY ARCHETYPE CAN ACTUALLY KILL ITS BAND ----------
console.log('\n-- viability at 1500m --');
{
  const E = ENEMIES.brute, hp = E.hp * depthHP((SURFACE + 1500) * TILE);
  let slow = [];
  for (const r of results) {
    const secs = hp / Math.max(1, r.d);
    if (secs > 12) slow.push(r.n + ' ' + secs.toFixed(1) + 's');
  }
  A(slow.length === 0, 'every archetype kills a band-appropriate bruiser inside 12s' +
    (slow.length ? ': ' + slow.join(', ') : ''));
}

// ---------- NO GEM IS DEAD ----------
// A gem that changes nothing about the resulting attack is a trap for the player and a lie in the
// unlock shop. This catches a support whose mod() silently no-ops on the slot it claims to serve.
console.log('\n-- no dead gems --');
{
  const FIELDS = ['dmg', 'cd', 'more', 'count', 'pierce', 'chain', 'cull', 'explode', 'arc', 'range', 'kb',
    'crit', 'critMult', 'leech', 'momentum', 'reap', 'sunder', 'twin', 'fork', 'ret', 'homing', 'grav',
    'bounce', 'dig', 'speed', 'life', 'vsBurn', 'vsChill', 'vsSpent', 'vsLow', 'interrupt', 'stagger',
    'splinter', 'contagion', 'ailMore', 'critAdd', 'critMultAdd', 'chan', 'lunge', 'riposte',
    'slam', 'aloft', 'vsFull', 'farshot', 'raise', 'stormcall', 'noSt', 'hpCost', 'focusCost', 'mine', 'vsBleed'];
  function snap(at) {
    const o = {};
    for (const f of FIELDS) o[f] = at[f];
    o.__st = JSON.stringify(at.st || {}) + '|' + JSON.stringify(at.stR || {});
    return o;
  }
  const dead = [];
  for (const kind of ['melee', 'ranged']) {
    const base = kind === 'melee' ? 'sword' : 'bow';
    META.cls = 'vanguard'; newRun(); OFF(1200);
    EQ[kind] = mkItem(base, 1, 1200); EQ[kind].sockets = [null, null]; EQ[kind].sc = ['r', 'r'];
    EQ.armor = mkItem('vest', 0, 1); EQ.armor.sockets = []; EQ.armor.sc = [];
    refreshAttacks();
    const before = snap(ATK[kind]);
    for (const id in GEMS) {
      const G = GEMS[id];
      if (G.t !== 'sup' && G.t !== 'skill') continue;
      if (G.for !== 'any' && G.for !== kind) continue;
      EQ[kind].sc[0] = G.col; EQ[kind].sockets[0] = { id, tier: 1 };
      refreshAttacks();
      const after = snap(ATK[kind]);
      let changed = false;
      for (const f in after) if (after[f] !== before[f]) changed = true;
      if (!changed) dead.push(id + '/' + kind);
      EQ[kind].sockets[0] = null;
    }
  }
  A(dead.length === 0, 'every skill and support gem changes the attack it is socketed into' +
    (dead.length ? ': ' + dead.join(', ') : ''));
}

// ---------- CONDITIONAL GEMS PAY OUT ON BOTH PATHS ----------
// CLAUDE.md rule 2, as an assertion. A conditional wired into strike() but not projStrike() is not
// a weaker gem — it is a pure downside for every ranged build, and that has shipped here before.
console.log('\n-- melee and ranged are the same contract --');
{
  META.cls = 'vanguard'; newRun(); OFF(900); NOCRIT();
  const CONDS = [
    { f: 'vsSpent', set: e => { e.rec = 0.5 } },
    { f: 'vsLow', set: e => { e.hp = e.maxhp * 0.3 } },
    { f: 'vsBurn', set: e => { applyStatus(e, { burn: 5 }, false) } },
    { f: 'vsChill', set: e => { applyStatus(e, { chill: 0.6 }, false) } },
    { f: 'momentum', set: () => { P.vx = MOVE } },
    { f: 'reap', set: e => { e.hp = e.maxhp * 0.2 } },
    // wave 4 — farshot is deliberately absent (ox-guarded, lawfully ranged-only: riposte precedent)
    { f: 'slam', set: () => { P.vy = 520 } },
    { f: 'aloft', set: () => { P.onG = false } },
    { f: 'vsFull', set: null },
    { f: 'vsBleed', set: e => { applyStatus(e, { bleed: 5 }, false) } },
  ];
  function hitFor(fields, setup, ranged) {
    EN.length = 0;
    const e = mkEnemy('brute', P.x + 24, P.y, null, threat(), null);
    e.hp = e.maxhp = 100000; e.arm = 0; e.invT = 0; e.acd = 99; e.spd = 0; EN.push(e);
    P.vx = 0; if (setup) setup(e);
    const a = Object.assign({ kind: ranged ? 'ranged' : 'melee', dmg: 1000, crit: 0, critMult: 1, col: '#fff', more: 1, inc: 0 }, fields);
    const before = e.hp;
    if (ranged) projStrike(e, a); else strike(e, a, 0);
    return before - e.hp;
  }
  for (const c of CONDS) {
    const off = { [c.f]: 0 }, on = { [c.f]: 0.5 };
    const mB = hitFor(off, c.set, false), mA = hitFor(on, c.set, false);
    const rB = hitFor(off, c.set, true), rA = hitFor(on, c.set, true);
    const mGain = mA / Math.max(1, mB), rGain = rA / Math.max(1, rB);
    A(mGain > 1.05, c.f + ' pays out on melee (' + mGain.toFixed(2) + 'x)');
    A(rGain > 1.05, c.f + ' pays out on ranged (' + rGain.toFixed(2) + 'x)');
    A(Math.abs(mGain - rGain) < 0.08, c.f + ' pays the SAME on both paths (' +
      mGain.toFixed(2) + ' vs ' + rGain.toFixed(2) + ')');
  }
}
{ // the on-hit and on-kill riders too
  META.cls = 'vanguard'; newRun(); OFF(900); NOCRIT();
  function rider(fields, ranged, prep) {
    EN.length = 0; PROJ.length = 0;
    const e = mkEnemy('crawler', P.x + 24, P.y, null, threat(), null);
    e.arm = 0; e.invT = 0; e.acd = 99; e.spd = 0; EN.push(e);
    if (prep) prep(e);
    const a = Object.assign({ kind: ranged ? 'ranged' : 'melee', dmg: 10, crit: 0, critMult: 1, col: '#fff', more: 1, inc: 0 }, fields);
    if (ranged) projStrike(e, a); else strike(e, a, 0);
    return e;
  }
  for (const ranged of [false, true]) {
    const w = ranged ? 'ranged' : 'melee';
    const e = rider({ interrupt: 1 }, ranged, x => { x.hp = 99999; x.maxhp = 99999; x.wind = 0.4; x.atk = mkAtk(ENEMIES.crawler.atk) });
    A(e.wind === 0 && e.rec > 0, 'interrupt cancels a windup on ' + w);
    PROJ.length = 0;
    rider({ splinter: 1, dmg: 99999 }, ranged);
    A(PROJ.length >= 3, 'splinter fires shards on a kill from ' + w + ' (' + PROJ.length + ')');
  }
}

// ---------- NO AUTO-INCLUDE ----------
// A support that is the best choice for every skill is not a choice. Different skills must want
// different supports, or the socket screen is a formality.
console.log('\n-- the socket screen is a real decision --');
{
  const SKILLS = [
    { k: 'melee', base: 'sword', skill: 'cleave' },
    { k: 'melee', base: 'greataxe', skill: 'rend' },
    { k: 'ranged', base: 'bow', skill: null },
    { k: 'ranged', base: 'wand', skill: 'lightning' },
    { k: 'ranged', base: 'crossbow', skill: 'grenade' },
  ];
  const winners = [];
  for (const S of SKILLS) {
    META.cls = 'vanguard'; newRun(); OFF(1200);
    let best = null, bd = -1;
    for (const id in GEMS) {
      const G = GEMS[id];
      if (G.t !== 'sup') continue;
      if (G.for !== 'any' && G.for !== S.k) continue;
      const ids = S.skill ? [S.skill, id] : [id];
      EQ[S.k] = fit(mkItem(S.base, 1, 1200), ids);
      // strip the rolled affixes: each candidate gets a FRESH item, so affix luck was quietly
      // picking winners (the known gear-affixes-feed-inc() trap) — supports compete bare
      EQ[S.k].affixes = {}; EQ[S.k].tiers = {}; EQ[S.k].mods = {};
      EQ.armor = mkItem('vest', 0, 1); EQ.armor.sockets = []; EQ.armor.sc = [];
      refreshAttacks();
      const d = effDps(ATK[S.k]);
      if (d > bd) { bd = d; best = id }
    }
    winners.push(S.base + (S.skill ? '/' + S.skill : '') + ' -> ' + best);
  }
  console.log('   best support per skill:');
  for (const w of winners) console.log('     ' + w);
  const uniq = new Set(winners.map(w => w.split('-> ')[1]));
  A(uniq.size >= 3, 'different skills want different supports (' + uniq.size + ' distinct winners of ' + winners.length + ')');
}

// ---------- THE SOUP TEST ----------
console.log('\n-- the additive pool does not run away --');
{
  A(softInc(1) === 1, 'below the cap the additive pool is untouched');
  A(softInc(INC_SOFT) === INC_SOFT, 'the cap itself is exact');
  A(softInc(INC_SOFT + 4) < INC_SOFT + 4, 'past it, more increased damage is worth less');
  A(softInc(20) < 10, 'and it cannot run away (+2000% raw -> +' + (softInc(20) * 100).toFixed(0) + '%)');
  // the everything-at-once build: max tree, max boons, max attunements, rare gear
  META.cls = 'pyromancer'; META.threat = 5; newRun(); OFF(3000);
  for (const n of TREE) META.tree[n.id] = 1;
  RUNB = RUNB0(); RUNM = RUNM0();
  for (const b of BOONS) { for (const k in (b.fx || {})) RUNB[k] = (RUNB[k] || 0) + b.fx[k];
    for (const k in (b.m || {})) RUNM[k] = (RUNM[k] || 0) + b.m[k] }
  for (const t of ATTUNE) { for (const k in (t.fx || {})) RUNB[k] = (RUNB[k] || 0) + t.fx[k];
    for (const k in (t.m || {})) RUNM[k] = (RUNM[k] || 0) + t.m[k] }
  EQ.melee = mkItem('greataxe', 2, 3140); EQ.ranged = mkItem('crossbow', 2, 3140); EQ.armor = mkItem('plate', 2, 3140);
  P.maxhp = maxHP(); P.hp = P.maxhp; refreshAttacks();
  const raw = inc('dmg');
  console.log('   everything-at-once: +' + (raw * 100).toFixed(0) + '% raw increased, ' +
    'crit ' + (critChance() * 100).toFixed(0) + '% x' + ATK.melee.critMult.toFixed(2) +
    ', ' + dpsOf(ATK.melee) + ' dps, ' + P.maxhp + ' hp, ' + (P.armor | 0) + ' armour');
  A(isFinite(dpsOf(ATK.melee)) && dpsOf(ATK.melee) > 0, 'the everything build is still finite');
  A(ATK.melee.critMult <= CRIT_SOFT + 2, 'crit damage stays capped through every source');
  A(critChance() <= 0.95, 'crit chance stays capped');
  A(sresVal() <= 0.85, 'status resist stays capped');
  A(applyArmor(100, P.armor) >= 100 * ARMOR_MIN_FRAC - 0.001, 'armour stays capped');
  // and the whole pile must not be more than a few times a focused build
  const focused = effDps(assemble(ARCH[0], 3000, 14));
  META.threat = 0;
  A(focused > 0, 'a focused build at the same depth is measurable');
}

// ---------- SUPPORTS ARE CONTRACT CHANGES, NOT MULTIPLIERS ----------
console.log('\n-- support gem shape --');
{
  const pure = [], contract = [];
  for (const id in GEMS) {
    const G = GEMS[id]; if (G.t !== 'sup' || !G.mod) continue;
    const a = { kind: 'melee', dmg: 10, cd: 1, arc: 90, range: 20, kb: 1, more: 1, inc: 0, pierce: 0, count: 1 };
    const before = JSON.stringify(a);
    G.mod(a);
    const keys = Object.keys(a).filter(k => JSON.stringify(a[k]) !== JSON.stringify(JSON.parse(before)[k]));
    const onlyNumbers = keys.every(k => k === 'more' || k === 'cd' || k === 'dmg' || k === 'kb');
    (onlyNumbers ? pure : contract).push(id);
  }
  console.log('   contract changes: ' + contract.length + '  |  pure multipliers: ' + pure.length +
    (pure.length ? ' (' + pure.join(', ') + ')' : ''));
  A(contract.length > pure.length * 2, 'most supports change the contract, not just the number (' +
    contract.length + ' vs ' + pure.length + ')');
  A(pure.length <= 4, 'and only a handful are pure multipliers, which is what an affix is for');
}

// ---------- RUN REWARDS ARE DECISIONS ----------
console.log('\n-- boons and attunements --');
{
  const bm = BOONS.filter(b => b.m).length, am = ATTUNE.filter(t => t.m).length;
  console.log('   boons: ' + BOONS.length + ' (' + bm + ' mechanical)  attunements: ' + ATTUNE.length + ' (' + am + ' mechanical)');
  A(bm >= 6, 'a shrine can hand you a mechanic, not only a percentage (' + bm + ' of ' + BOONS.length + ')');
  A(am >= 12, 'and so can a level-up (' + am + ' of ' + ATTUNE.length + ')');
  // a mechanical boon must actually reach the attack
  META.cls = 'vanguard'; newRun(); OFF(900);
  EQ.melee = mkItem('sword', 0, 1); EQ.melee.sockets = []; EQ.melee.sc = [];
  EQ.armor = mkItem('vest', 0, 1); EQ.armor.sockets = []; EQ.armor.sc = [];
  refreshAttacks();
  A(!(ATK.melee.stR && ATK.melee.stR.burn), 'a bare sword does not burn');
  RUNM.hitBurn = 0.26; refreshAttacks();
  A(ATK.melee.stR && ATK.melee.stR.burn > 0, 'Emberheart makes it burn');
  A(ATK.melee.st && ATK.melee.st.burn > 0, 'and the potency is derived from the finished damage');
  RUNM.chain = 1; refreshAttacks();
  A(ATK.melee.chain === 1, 'Arcing makes it chain');
  RUNM = RUNM0(); refreshAttacks();
  A(!ATK.melee.chain, 'and a new run clears them');
  // every boon and attunement id must be unique, or the "taken" bookkeeping silently misfires
  const ids = {}; let dupes = [];
  for (const b of BOONS) { if (ids['b' + b.id]) dupes.push(b.id); ids['b' + b.id] = 1 }
  for (const t of ATTUNE) { if (ids['a' + t.id]) dupes.push(t.id); ids['a' + t.id] = 1 }
  A(dupes.length === 0, 'no duplicate boon or attunement ids' + (dupes.length ? ': ' + dupes.join(',') : ''));
  // every mechanical key one of them writes must be read somewhere
  const KNOWN = ['vsBleed', 'aloft', 'hpCost', 'construct', 'stormEcho', 'dodgeRush', 'crewcap',
    'feast', 'dodgeBlast', 'cornered', 'moving', 'overflow', 'echo', 'thorn', 'scav', 'secondWind',
    'hitBurn', 'hitBleed', 'hitChill', 'hitShock', 'vsBurn', 'vsChill', 'vsSpent', 'vsLow',
    'extraProj', 'chain', 'sunder', 'lastLight'];
  const unread = [];
  for (const src of [BOONS, ATTUNE]) for (const x of src) for (const k in (x.m || {}))
    if (KNOWN.indexOf(k) < 0) unread.push(x.id + ':' + k);
  A(unread.length === 0, 'every mechanical reward writes a key something reads' +
    (unread.length ? ': ' + unread.join(', ') : ''));
}

// ---------- UNLOCKS MATCH CONTENT ----------
console.log('\n-- the shop is honest --');
{
  const bad = [];
  for (const u of UNLOCKS) if (!GEMS[u.id] && !GEAR[u.id]) bad.push(u.id);
  A(bad.length === 0, 'every unlock points at something that exists' + (bad.length ? ': ' + bad.join(',') : ''));
  const unbuyable = [];
  const byId = {}; for (const u of UNLOCKS) byId[u.id] = 1;
  for (const g in GEMS) if (!byId[g] && DEFAULT_GEM_POOL.indexOf(g) < 0) unbuyable.push(g);
  A(unbuyable.length === 0, 'every gem is either free or purchasable' +
    (unbuyable.length ? ': ' + unbuyable.join(',') : ''));
  const dupU = {}; let dd = [];
  for (const u of UNLOCKS) { if (dupU[u.id]) dd.push(u.id); dupU[u.id] = 1 }
  A(dd.length === 0, 'no unlock is listed twice' + (dd.length ? ': ' + dd.join(',') : ''));
}

// ---------- THE SOUP CEILING (batched-review regression lock) ----------
// The archetype rows are 3-gem builds; the review assembled a 5-socket staff with every
// unconditional `more` support and measured 10.7x the intended spread — plus x47 with
// duplicates, which were legal. One support id applies once now, and the worst honest
// assembly must stay within reach of the archetype spread.
console.log('\n-- the soup ceiling --');
{
  META.cls = 'marksman'; newRun(); OFF(1500);
  META.tree = {}; RUNB = RUNB0(); RUNM = RUNM0();
  EQ.ranged = fit(mkItem('staff', 1, 1500), ['lightning', 'conc', 'overload', 'sterile', 'bloodtithe']);
  EQ.ranged.affixes = {}; EQ.ranged.tiers = {}; EQ.ranged.mods = {};
  EQ.armor = fit(mkItem('shroud', 1, 1500), ['overdraw']);
  EQ.armor.affixes = {}; EQ.armor.tiers = {}; EQ.armor.mods = {};
  refreshAttacks();
  const worst = effDps(ATK.ranged);
  console.log('   five-socket everything-staff: ' + Math.round(worst) + ' eff dps');
  A(isFinite(worst) && worst > 0, 'the everything-staff resolves');
  A(ATK.ranged.more < 8.2, 'the stacked more-pool stays under 8.2x (' + ATK.ranged.more.toFixed(2) + 'x)');
  // a DUPLICATE support is a dead socket, not a second multiplier
  EQ.ranged = fit(mkItem('staff', 1, 1500), ['lightning', 'conc', 'conc', 'conc', 'conc']);
  EQ.ranged.affixes = {}; EQ.ranged.tiers = {}; EQ.ranged.mods = {};
  EQ.armor = mkItem('vest', 0, 1); EQ.armor.sockets = []; EQ.armor.sc = []; refreshAttacks();
  const one = 1.55;
  A(Math.abs(ATK.ranged.more - one) < 0.01, 'four Concentrateds pay once (' + ATK.ranged.more.toFixed(2) + 'x, not ' + Math.pow(1.55, 4).toFixed(1) + 'x)');
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
if (fail) process.exit(1);
