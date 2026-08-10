// ===== SUITE 18 — THE CAMP: who is at the rim, and what the surface feels =====
// Dialogue is content with GATES, and a gate that throws on a fresh save or hides a node
// forever is a bug no other suite can see. The maxed fixture is the reachability proof.
let pass = 0, fail = 0;
function A(c, m) { if (c) { pass++; console.log('ok: ' + m) } else { fail++; console.log('FAIL: ' + m) } }

loadMeta(); META.shards = 100000; META.cls = 'vanguard'; newRun();

console.log('\n-- dialogue integrity --');
{
  const ids = new Set();
  let dup = 0, badWho = 0, badChar = 0;
  for (const d of DIALOG) {
    if (ids.has(d.id)) dup++; ids.add(d.id);
    if (!CAST.some(c => c.id === d.who)) badWho++;
    if (/[`<&!]|\$\{/.test(d.t)) badChar++;
    if (GEMS[d.id] || GEAR[d.id]) dup++;
  }
  A(dup === 0, 'every node id is unique and collides with nothing');
  A(badWho === 0, 'every node belongs to a cast member');
  A(badChar === 0, 'no node carries a backtick, template, angle bracket, ampersand or exclamation');
  for (const c of CAST) {
    const n = DIALOG.filter(d => d.who === c.id).length;
    A(n >= 10 && n <= 16, c.n + ' speaks ' + n + ' times (want 10-16)');
  }
}

console.log('\n-- gates: safe on a virgin, all-reachable on a life fully lived --');
{
  const virgin = { bosses: {}, endings: {}, seen: {}, forge: {}, firsts: {}, runs: 0, bestDepth: 0, echoLv: 0, maxEcho: 0, maxThreat: 0, escapes: 0 };
  let threw = 0;
  for (const d of DIALOG) { try { d.gate(virgin) } catch (e) { threw++ } }
  for (const c of CAST) { try { c.show(virgin) } catch (e) { threw++ } }
  for (const c of CAMP_LINES) { try { c.gate(virgin) } catch (e) { threw++ } }
  A(threw === 0, 'no gate throws on a fresh save');
  const maxed = { runs: 9, bestDepth: 3000, echoLv: 8, maxEcho: 8, maxThreat: 5, escapes: 3,
    bosses: { warden: 1, sporemother: 1, sentinel: 1, forgelord: 1, voidmaw: 1, weft: 1, witness: 1 },
    endings: { escape: 1, mend: 1, usurp: 1 }, forge: { n: 5, owk: 1 }, firsts: { uniq: 1 },
    seen: { sigil: { reroll: 1, lock: 1 }, diss: { a: 1, b: 1 } } };
  const unreachable = DIALOG.filter(d => !d.gate(maxed)).map(d => d.id);
  A(unreachable.length === 0, 'every node is reachable in a maxed life' +
    (unreachable.length ? ': ' + unreachable.join(',') : ''));
}

console.log('\n-- talk marches, once each --');
{
  META.dlg = {}; META.runs = 0; META.bosses = {}; META.endings = {}; META.firsts = {}; META.forge = { n: 0, owk: 0 };
  openTalk('anvil');
  A(Object.keys(META.dlg).length === 1 && META.dlg.anvil1 === 1, 'the first talk serves the first node');
  const n0 = talkNew('anvil');
  openTalk('anvil');
  A(talkNew('anvil') <= n0, 'talking never mints new nodes');
  META.runs = 1;
  A(talkNew('anvil') >= 1, 'progress unlocks more to say');
  A(CAST.find(c => c.id === 'verse').show(META) === true, 'the Chanter appears after the first ended run');
  META.dlg = {};
}

console.log('\n-- the camp notices --');
{
  const mk = o => Object.assign({ bosses: {}, endings: {} }, o);
  A(campLine.call(null) === '' || true, '');
  const save = { b: META.bosses, e: META.endings };
  META.bosses = {}; META.endings = {};
  A(campLine() === '', 'a virgin camp is silent');
  META.bosses = { warden: 1 };
  A(campLine().indexOf('draught') >= 0, 'the first knot changes the air');
  META.bosses = { warden: 1, sporemother: 1, sentinel: 1 };
  A(campLine().indexOf('straighter') >= 0, 'three knots and the rope-men talk');
  META.bosses = { warden: 1, sporemother: 1, sentinel: 1, forgelord: 1, voidmaw: 1 };
  A(campLine().indexOf('listening') >= 0, 'five knots and the camp listens');
  META.endings = { escape: 1 };
  A(campLine().indexOf('wrong depth') >= 0, 'an ending outranks the knots');
  META.endings = { escape: 1, mend: 1 };
  A(campLine().indexOf('colour') >= 0, 'mend outranks escape');
  META.endings = { escape: 1, mend: 1, usurp: 1 };
  A(campLine().indexOf('agrees') >= 0, 'usurp outranks everything');
  META.bosses = save.b; META.endings = save.e;
}

console.log('\n-- the knots write themselves --');
{
  META.bosses = {}; META.seen.frag = {}; UNLOCK_MSG.length = 0; EN.length = 0;
  for (const [b, f] of [['warden', 'knot1'], ['sporemother', 'knot2'], ['sentinel', 'knot3'], ['forgelord', 'knot4'], ['voidmaw', 'knot5']])
    A(ENEMIES[b].frag === f && LORE.frag.some(x => x.id === f && x.depth < 0), b + ' carries ' + f + ' and it exists, unburied');
  P.x = (CAMP_X + 400) * TILE; P.y = (SURFACE + 300) * TILE;
  const w = mkEnemy('warden', P.x + 60, P.y, null, threat(), null); EN.push(w); w.hp = 1;
  killEnemy(w);
  A(META.seen.frag.knot1 === 1, 'the first warden writes its fragment');
  A(UNLOCK_MSG.some(m => m.indexOf('knot comes loose') >= 0), 'and the death screen will say so');
  UNLOCK_MSG.length = 0; EN.length = 0;
  const w2 = mkEnemy('warden', P.x + 60, P.y, null, threat(), null); EN.push(w2); w2.hp = 1;
  killEnemy(w2);
  A(!UNLOCK_MSG.some(m => m.indexOf('knot comes loose') >= 0), 'a second warden writes nothing');
  // rites: the first death
  delete META.seen.frag.rites; P.dead = false; DYING = false; P.hp = 1;
  die();
  A(META.seen.frag.rites === 1, 'the first death writes the rites');
  P.dead = false; DYING = false; newRun();
  META.bosses = {}; META.seen.frag = {};
}

console.log('\n-- the smith remembers her lapse --');
{
  META.shards = 100000; META.bosses = { forgelord: 1 }; META.forge = { n: 0, owk: 0 };
  delete META.seen.frag.annealed;
  const it = mkItem('sword', 2, 700); BAG.length = 0; BAG.push({ kind: 'gear', item: it });
  doForgeOp(it.uid, 'frisk');
  A(it.owk === 1, 'overwork lands');
  A(META.seen.frag.annealed === 1, 'and the annealed fragment is written');
  BAG.length = 0; META.bosses = {}; META.forge = { n: 0, owk: 0 };
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
if (fail) process.exit(1);
