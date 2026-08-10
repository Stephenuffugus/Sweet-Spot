// ===== SUITE 12 — itemisation: the depth axis =====
// Before this pass, mkItem took no item level: affix ranges were constant forever, the base pool
// was unlock-gated but not depth-gated, and rarity odds were constants at each drop site. A sword
// found at 3,000m was statistically identical to one found at 50m, which quietly removes the
// entire reason an ARPG exists. Everything here asserts that deep loot is actually better —
// measured over thousands of rolls, not asserted about one lucky item.
let pass = 0, fail = 0;
function A(c, m) { if (c) { pass++; console.log('ok: ' + m) } else { fail++; console.log('FAIL: ' + m) } }

loadMeta(); META.shards = 1e6; META.cls = 'vanguard'; META.threat = 0;
for (const k in GEAR) META.unlocks[k] = 1;
newRun();

function sample(ilvl, n, rarity) {
  const st = { r: [0, 0, 0, 0], affSum: 0, affN: 0, tier: [0, 0, 0, 0, 0], mods: 0, score: 0, bases: {}, maxAff: 0 };
  for (let i = 0; i < n; i++) {
    const pool = gearPool(ilvl), base = pool[ri(0, pool.length - 1)];
    const it = mkItem(base, rarity === undefined ? rollRarity(ilvl, 1) : rarity, ilvl);
    st.r[it.rarity]++; st.bases[base] = 1; st.score += itemScore(it);
    st.mods += Object.keys(it.mods || {}).length;
    for (const k in it.affixes) {
      st.affSum += it.affixes[k]; st.affN++;
      st.tier[(it.tiers[k] || 1) - 1]++;
      st.maxAff = Math.max(st.maxAff, it.affixes[k]);
    }
  }
  st.avgAff = st.affSum / Math.max(1, st.affN);
  st.avgScore = st.score / n;
  st.nBases = Object.keys(st.bases).length;
  return st;
}

// ---------- 1. ITEM LEVEL EXISTS AND COMES FROM DEPTH ----------
console.log('\n-- item level --');
A(ilvlAt((SURFACE + 1234) * TILE) === 1234, 'item level is depth in metres');
A(ilvlAt(0) === 1, 'above the surface still yields a legal item level');
{
  const it = mkItem('sword', 1, 900);
  A(it.ilvl === 900, 'mkItem records the item level it was rolled at');
  A(it.tiers && typeof it.tiers === 'object', 'and the tier of each affix it rolled');
  A(it.mods && typeof it.mods === 'object', 'and its modifier affixes');
}
{ // old saves and old call sites must not explode
  const it = mkItem('sword', 1);
  A(it.ilvl >= 1, 'mkItem still works with no item level given');
  A(affixStr(it).length >= 0 && itemScore(it) > 0, 'and such an item still renders and scores');
  const legacy = { uid: 1, base: 'sword', rarity: 1, affixes: { dmg: 10 }, sockets: [null], sc: ['r'], chroma: -1, unique: null, alt: 0 };
  A(typeof affixStr(legacy) === 'string', 'a v1-shaped item with no tiers/mods still renders');
  A(itemScore(legacy) > 0, 'and still scores');
  A(ilvlStr(legacy) === '', 'and simply shows no item level');
}

// ---------- 2. DEEP LOOT IS MEASURABLY BETTER ----------
console.log('\n-- the depth axis --');
const N = 3000;
const shallow = sample(80, N), mid = sample(1200, N), deep = sample(2900, N);
console.log('   depth |  norm  magic   rare  uniq | avg affix | mod% | avg score | bases');
for (const [d, s] of [[80, shallow], [1200, mid], [2900, deep]]) {
  const pc = x => (x * 100 / N).toFixed(1).padStart(5);
  console.log('   ' + String(d).padStart(5) + ' |' + pc(s.r[0]) + ' ' + pc(s.r[1]) + ' ' + pc(s.r[2]) + ' ' + pc(s.r[3]) +
    ' |    ' + s.avgAff.toFixed(1).padStart(5) + '  |' + (s.mods * 100 / N).toFixed(1).padStart(5) +
    ' |' + s.avgScore.toFixed(0).padStart(7) + '   | ' + s.nBases);
}
A(deep.avgAff > shallow.avgAff * 1.8, 'affix rolls are far bigger at depth (' +
  shallow.avgAff.toFixed(1) + ' -> ' + deep.avgAff.toFixed(1) + ')');
A(deep.avgScore > shallow.avgScore * 3, 'a deep item is worth several times a shallow one (' +
  shallow.avgScore.toFixed(0) + ' -> ' + deep.avgScore.toFixed(0) + ')');
A(mid.avgScore > shallow.avgScore && deep.avgScore > mid.avgScore, 'and it improves monotonically with depth');
A(deep.r[2] + deep.r[3] > (shallow.r[2] + shallow.r[3]) * 3, 'rare-and-better is several times more common deep (' +
  ((shallow.r[2] + shallow.r[3]) * 100 / N).toFixed(1) + '% -> ' + ((deep.r[2] + deep.r[3]) * 100 / N).toFixed(1) + '%)');
A(shallow.r[3] > 0, 'uniques can still drop shallow — the lottery ticket exists everywhere');
A(deep.nBases > shallow.nBases, 'the base pool widens with depth (' + shallow.nBases + ' -> ' + deep.nBases + ')');

// ---------- 3. AFFIX TIERS ARE GATED, NOT JUST SCALED ----------
console.log('\n-- affix tiers --');
{
  console.log('   tier spread by depth (T1..T5):');
  for (const [d, s] of [[80, shallow], [1200, mid], [2900, deep]]) {
    const tt = s.tier.reduce((a, b) => a + b, 0) || 1;
    console.log('     ' + String(d).padStart(5) + 'm  ' + s.tier.map(t => String((t * 100 / tt) | 0).padStart(3) + '%').join(' '));
  }
  A(shallow.tier[1] + shallow.tier[2] + shallow.tier[3] + shallow.tier[4] === 0,
    'a shallow item can only roll tier 1 — the good tiers are gated, not merely unlikely');
  A(deep.tier[4] > 0, 'the top tier is reachable at depth');
  A(deep.tier[4] > deep.tier[0] * 3, 'and it is the common case there, not a jackpot');
  A(mid.tier[4] === 0, 'but tier 5 is NOT reachable at 1200m');
}
{ // the ranges themselves must actually ascend
  for (const a of AFFIXES) {
    let ok = true;
    for (let t = 2; t <= 5; t++) {
      const [lo, hi] = affTierRange(a, t), [plo, phi] = affTierRange(a, t - 1);
      if (lo <= plo || hi <= phi) ok = false;
    }
    A(ok, a[0] + ': every tier is strictly better than the one below it');
  }
  const [lo5, hi5] = affTierRange(AFF.dmg, 5);
  A(hi5 >= AFF.dmg[3] * 2.4, 'a perfect damage roll is worth several ordinary ones (' + hi5 + '%)');
}
{ // and the gate is the item level, exactly
  let leak = 0;
  for (let i = 0; i < 4000; i++) {
    const it = mkItem('sword', 2, 700);
    for (const k in it.tiers) if (AFF_TIER_ILVL[it.tiers[k] - 1] > 700) leak++;
  }
  A(leak === 0, 'no item ever rolls a tier its item level does not allow');
}

// ---------- 4. MODIFIER AFFIXES: THE PART THAT CHANGES HOW YOU PLAY ----------
console.log('\n-- modifier affixes --');
{
  A(shallow.mods === 0, 'shallow items never roll a modifier affix');
  A(deep.mods > 0, 'deep rares do (' + (deep.mods * 100 / N).toFixed(1) + '% of all rolls)');
  let normals = 0;
  for (let i = 0; i < 2000; i++) if (Object.keys(mkItem('sword', 0, 2900).mods).length) normals++;
  A(normals === 0, 'and a normal-rarity item never does, however deep it drops');
}
{ // a modifier must actually reach the attack — this is the whole point of it
  META.cls = 'marksman'; newRun();
  NOCRIT();
  EQ.ranged = mkItem('bow', 1, 2000); EQ.ranged.sockets = []; EQ.ranged.sc = [];
  EQ.armor = mkItem('vest', 0, 1); EQ.armor.sockets = []; EQ.armor.sc = [];
  refreshAttacks();
  const before = ATK.ranged.count || 1;
  EQ.ranged.mods = { aproj: 1 }; refreshAttacks();
  A((ATK.ranged.count || 1) === before + 1, '+1 projectile on a bow actually fires another arrow');
  A(ATK.ranged.more < 1, 'and it pays for it in `more`, not by touching a.dmg (rule 5)');
  EQ.ranged.mods = {}; refreshAttacks();
  // a modifier on ARMOUR links globally, exactly like a support gem does
  EQ.armor.mods = { achain: 1 }; refreshAttacks();
  A((ATK.ranged.chain || 0) > 0, 'a modifier on armour reaches the ranged attack');
  META.cls = 'vanguard'; newRun();
  EQ.melee = mkItem('sword', 0, 1); EQ.melee.sockets = []; EQ.melee.sc = [];
  EQ.armor = mkItem('vest', 0, 1); EQ.armor.sockets = []; EQ.armor.sc = [];
  EQ.armor.mods = { achain: 1 }; refreshAttacks();
  A((ATK.melee.chain || 0) > 0, 'and the melee attack too');
}
{ // slot restrictions must hold, or a bow rolls "strikes twice" and does nothing
  let wrong = 0;
  for (let i = 0; i < 3000; i++) {
    const it = mkItem('bow', 2, 2900);
    for (const k in it.mods) if (MODA[k].slot === 'melee') wrong++;
    const it2 = mkItem('sword', 2, 2900);
    for (const k in it2.mods) if (MODA[k].slot === 'ranged') wrong++;
  }
  A(wrong === 0, 'no weapon rolls a modifier meant for the other hand');
  let deepOnly = 0;
  for (let i = 0; i < 3000; i++) { const it = mkItem('sword', 2, 300);
    for (const k in it.mods) if (MODA[k].ilvl > 300) deepOnly++ }
  A(deepOnly === 0, 'and none rolls above its own depth gate');
}
{ // one per item, always — two would be a second unique system
  let many = 0;
  for (let i = 0; i < 4000; i++) if (Object.keys(mkItem('greataxe', 3, 3100).mods).length > 1) many++;
  A(many === 0, 'an item never carries more than one modifier affix');
}

// ---------- 5. DEPTH-GATED BASES ----------
console.log('\n-- base gating --');
{
  const early = gearPool(50), late = gearPool(2800);
  A(early.indexOf('plate') < 0, 'Plate cannot drop at 50m');
  A(early.indexOf('greataxe') < 0, 'nor a Greataxe');
  A(late.indexOf('plate') >= 0 && late.indexOf('greataxe') >= 0, 'both are in the deep pool');
  A(early.indexOf('sword') >= 0, 'the starting bases are always available');
  A(gearPool(1).length > 0, 'the pool is never empty, however shallow');
  A(baseAllowed('sword', 1) && !baseAllowed('plate', 1), 'baseAllowed agrees with the pool');
}

// ---------- 6. FEWER, BETTER DROPS ----------
// Target from the plan: 8-12 items a run, 2-3 worth a look, 1 worth equipping.
console.log('\n-- drop volume --');
{
  for (const d of [400, 1500, 2800]) {
    let items = 0, worth = 0, equip = 0;
    const KILLS = 160, CHESTS = 9;
    for (let i = 0; i < KILLS; i++) if (chance(0.035)) {
      const p = gearPool(d), it = mkItem(p[ri(0, p.length - 1)], rollRarity(d, 1), d);
      items++; if (it.rarity >= 1) worth++; if (it.rarity >= 2) equip++;
    }
    for (let i = 0; i < CHESTS; i++) if (chance(0.72)) {
      const p = gearPool(d), it = mkItem(p[ri(0, p.length - 1)], Math.max(1, rollRarity(d, 2.4)), d);
      items++; if (it.rarity >= 1) worth++; if (it.rarity >= 2) equip++;
    }
    console.log('   ' + String(d).padStart(4) + 'm run: ' + items + ' items, ' + worth + ' magic+, ' + equip + ' rare+');
    A(items >= 3 && items <= 20, d + 'm: a run yields a readable number of items (' + items + ')');
  }
}

// ---------- 7. THE ITEM READS ----------
console.log('\n-- presentation --');
{
  const it = mkItem('greataxe', 2, 2900);
  const s = affixStr(it);
  A(s.indexOf('++') < 0, 'no doubled plus in an affix line');
  A(s.indexOf('undefined') < 0, 'no undefined in an affix line');
  A(ilvlStr(it).indexOf('i2900') >= 0, 'the item level is on the item');
  let sawTierName = false;
  for (let i = 0; i < 300; i++) { const x = affixStr(mkItem('sword', 2, 2900));
    if (x.indexOf('Perfect') >= 0 || x.indexOf('Grand') >= 0 || x.indexOf('Greater') >= 0) sawTierName = true }
  A(sawTierName, 'a high roll says so in words, not just a bigger number');
  console.log('   deep rare: ' + affixStr(mkItem('greataxe', 2, 2900)).replace(/<[^>]+>/g, ''));
  console.log('   shallow  : ' + affixStr(mkItem('sword', 2, 120)).replace(/<[^>]+>/g, ''));
}
{ // the bag has to tell you whether a thing beats what you are wearing
  META.cls = 'vanguard'; newRun();
  EQ.melee = mkItem('sword', 0, 1);
  A(bagBetter(mkItem('sword', 2, 2900)).indexOf('9650') >= 0, 'a clearly better item is marked as an upgrade');
  EQ.melee = mkItem('sword', 3, 2900);
  A(bagBetter(mkItem('sword', 0, 10)).indexOf('9660') >= 0, 'a clearly worse one is marked as a downgrade');
  EQ.ranged = null;
  A(bagBetter(mkItem('bow', 0, 10)).indexOf('NEW') >= 0, 'and an empty slot says NEW');
  A(bagBetter(null) === '', 'and nothing crashes on a missing item');
}

// ---------- 8. SCORING IS SANE ----------
console.log('\n-- scoring --');
{
  A(itemScore(mkItem('sword', 3, 2900)) > itemScore(mkItem('sword', 0, 2900)), 'a unique outscores a normal');
  A(itemScore(mkItem('sword', 2, 2900)) > itemScore(mkItem('sword', 2, 100)), 'a deep rare outscores a shallow rare');
  let mono = 0;
  for (let i = 0; i < 300; i++) if (itemScore(mkItem('sword', 1, 2900)) < itemScore(mkItem('sword', 1, 100))) mono++;
  A(mono < 90, 'and that holds most of the time at equal rarity (' + mono + '/300 inversions)');
  A(itemScore({ base: 'sword', rarity: 0, affixes: {} }) >= 0, 'scoring a bare item does not throw');
}

// ---------- 9. NOTHING LEAKS ----------
console.log('\n-- integrity --');
{
  let bad = 0;
  for (const d of [1, 500, 1500, 3140]) for (let i = 0; i < 1500; i++) {
    const p = gearPool(d), it = mkItem(p[ri(0, p.length - 1)], rollRarity(d, 1), d);
    for (const k in it.affixes) if (!isFinite(it.affixes[k]) || it.affixes[k] <= 0) bad++;
    if (!isFinite(it.ilvl) || it.ilvl < 1) bad++;
    if (it.sockets.length !== it.sc.length) bad++;
    if (it.rarity === 3 && !it.unique) bad++;
    if (it.chroma >= it.sockets.length) bad++;
  }
  A(bad === 0, '6,000 rolls across four depths produce no malformed item');
}
{ // equipping the deepest possible junk must not NaN the attack pipeline
  META.cls = 'pyromancer'; META.threat = 5; newRun();
  for (let i = 0; i < 200; i++) {
    EQ.melee = mkItem('greataxe', 2, 3140); EQ.ranged = mkItem('crossbow', 2, 3140); EQ.armor = mkItem('plate', 2, 3140);
    refreshAttacks();
    if (!isFinite(ATK.melee.dmg) || !isFinite(ATK.ranged.dmg) || !isFinite(P.armor) || !isFinite(maxHP())) { fail++; break }
  }
  A(isFinite(ATK.melee.dmg) && isFinite(ATK.ranged.dmg), 'a full set of deep rares produces finite numbers');
  A(ATK.melee.critMult <= CRIT_SOFT + 2, 'and the crit cap still holds through gear');
  META.threat = 0;
}

// ---------- THE FORGE ----------
console.log('\n-- the forge --');
{
  META.shards = 100000; META.bosses = { warden: 1, forgelord: 1 }; META.forge = { n: 0, owk: 0 };
  // TEMPER respects the depth law: a 700m item can never reach T4/T5; a 2900m item can
  A(affTierCap(700) === 2 && affTierCap(2900) === 5, 'affTierCap reads the same gates as the roller');
  for (let i = 0; i < 400; i++) { const l = 1 + (i * 8) % 3000; A(affTierFor(l) <= affTierCap(l), 'affTierFor never exceeds the cap'); if (affTierFor(l) > affTierCap(l)) break }
  const it = mkItem('sword', 2, 700); BAG.length = 0; BAG.push({ kind: 'gear', item: it });
  const k0 = Object.keys(it.affixes)[0];
  it.tiers[k0] = affTierCap(it.ilvl);
  const s0 = META.shards;
  doForgeOp(it.uid, 'fup', k0);
  A(it.tiers[k0] === affTierCap(it.ilvl) && META.shards === s0, 'TEMPER refuses past what depth allows, free of charge');
  it.tiers[k0] = 1;
  doForgeOp(it.uid, 'fup', k0);
  A(it.tiers[k0] === 2, 'TEMPER raises a tier');
  A(META.shards === s0 - Math.round(90 + it.ilvl * 0.10), 'and charges exactly the listed price');
  // RECAST: affix count constant, no duplicate keys, mods untouched
  const modsBefore = JSON.stringify(it.mods), n0 = Object.keys(it.affixes).length;
  const kOld = Object.keys(it.affixes)[0];
  doForgeOp(it.uid, 'frr', kOld);
  A(Object.keys(it.affixes).length === n0, 'RECAST keeps the affix count');
  A(new Set(Object.keys(it.affixes)).size === n0, 'and never duplicates a key');
  A(JSON.stringify(it.mods) === modsBefore, 'and never touches the modifier affix');
  // CUT: once, cap respected, arrays stay paired
  const cap = GEAR[it.base].sockets + (it.rarity >= 2 ? 1 : 0) + 1;
  while (it.sockets.length < cap && !it.cut) doForgeOp(it.uid, 'fsock');
  A(it.sockets.length <= cap, 'CUT never exceeds base+rarity+1 (' + it.sockets.length + '/' + cap + ')');
  A(it.sockets.length === it.sc.length, 'sockets and colors stay paired');
  const sBefore = it.sockets.length; doForgeOp(it.uid, 'fsock');
  A(it.sockets.length === sBefore, 'a second CUT is refused');
  // OVERWORK: once, then the forge is closed to it
  doForgeOp(it.uid, 'frisk');
  A(it.owk === 1, 'OVERWORK marks the item');
  const t1 = JSON.stringify([it.affixes, it.tiers, it.mods, it.sockets.length]);
  doForgeOp(it.uid, 'fup', Object.keys(it.affixes)[0]);
  doForgeOp(it.uid, 'frisk');
  A(JSON.stringify([it.affixes, it.tiers, it.mods, it.sockets.length]) === t1, 'an overworked item is closed to every op');
  // uniques and normals refused
  const un = mkItem('sword', 3, 900); BAG.push({ kind: 'gear', item: un });
  const uj = JSON.stringify(un.affixes); doForgeOp(un.uid, 'fup', 'dmg');
  A(JSON.stringify(un.affixes) === uj, 'finished work: the Smith refuses uniques');
  // broke player refused
  const it2 = mkItem('sword', 1, 400); BAG.push({ kind: 'gear', item: it2 });
  META.shards = 0; const j2 = JSON.stringify(it2.affixes);
  doForgeOp(it2.uid, 'fup', Object.keys(it2.affixes)[0]);
  A(JSON.stringify(it2.affixes) === j2, 'no shards, no work');
  // OVERWORK gates on the forgelord (R11)
  META.shards = 100000; META.bosses = { warden: 1 };
  const it3 = mkItem('sword', 1, 400); BAG.push({ kind: 'gear', item: it3 });
  doForgeOp(it3.uid, 'frisk');
  A(!it3.owk, 'the Smith will not stop being careful until the forge answers');
  META.bosses = {}; BAG.length = 0; META.forge = { n: 0, owk: 0 };
}
// ---------- BASE GATING (gear wave) ----------
{
  const p100 = gearPool(100), p200 = gearPool(200), p2800 = gearPool(2800);
  for (const b of ['spear', 'brig', 'staff', 'shroud']) A(p100.indexOf(b) < 0, b + ' does not drop at 100m');
  A(p200.indexOf('dagger') >= 0, 'the dagger drops at 200m');
  for (const b of ['dagger', 'spear', 'brig', 'staff', 'shroud']) A(p2800.indexOf(b) >= 0, b + ' drops deep');
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
if (fail) process.exit(1);
