// SHARDFALL screenshot rig. Stages representative moments in real Chromium and writes PNGs
// to test/shots/. This is the only way to review FEEL — the node harness cannot see anything.
//
//   node test/shots.js
//
// Staging rule: never carve a big empty room to make space. An empty room photographs as a
// black rectangle and tells you nothing. Drop into real generated terrain and let it be messy.
const path = require('path'), fs = require('fs'), http = require('http');
const PW = process.env.PW_DIR || '/tmp/claude-1000/-workspaces-Sweet-Spot/00ff769b-1474-43f1-895c-6b76d1865b29/scratchpad/node_modules';
const { chromium } = require(path.join(PW, 'playwright'));
const ROOT = path.join(__dirname, '..'), OUT = path.join(__dirname, 'shots');
fs.mkdirSync(OUT, { recursive: true });

// Land the player at a target depth. Scans a band of columns for a natural ledge first; only
// if the generator gave us solid rock for 40 tiles does it carve a small ledge by hand. A
// hand-carved cavern photographs as a black rectangle, so we take the real terrain when we can.
/* eslint-disable no-undef */
const LAND = (o) => {
  const depth=o.depth, ty=SURFACE+depth;
  let best=null;
  for(let r=0;r<40&&!best;r++)for(const sy of (r?[1,-1]:[1])){ const y=ty+r*sy;
    for(let dx=-24;dx<=24&&!best;dx++){ const x=Math.floor(CAMP_X)+dx;
      if(getTile(x,y)===0&&getTile(x,y-1)===0&&getTile(x,y+1)!==0)best={x,y}; } }
  if(!best){ best={x:Math.floor(CAMP_X),y:ty};
    for(let yy=-3;yy<=0;yy++)for(let xx=-4;xx<=4;xx++)setTile(best.x+xx,best.y+yy,0); }
  P.x=best.x*TILE+8; P.y=best.y*TILE-2; P.vx=0; P.vy=0;
  // inv must stay 0: the i-frame flicker skips drawing the player on alternate frames, so a
  // large P.inv makes the hero invisible in half the screenshots. Enemies are held off by acd.
  P.noFall=99; P.dead=false; P.hp=P.maxhp; P.inv=0; paused=false;
  P.band=biomeName(Math.floor(P.y/TILE)); RUNBANDS[P.band]=1;
  for(const s of SHRINES)s.used=true;   // don't let a POI shrine hijack the frame
  cam.x=P.x; cam.y=P.y;                 // camera lerps; snap it or the shot is of empty rock
  closePanel();
  return {tile:best, biome:biomeName(best.y)};
};
const SPAWN = (o) => {
  EN.length=0;
  for(const it of o.list){ const E=ENEMIES[it[0]]; if(!E)continue;
    EN.push({x:P.x+it[1],y:P.y+(it[2]||0)-8,vx:0,vy:0,w:E.w,h:E.h,type:it[0],ai:E.ai,c:E.c,
      hp:E.hp*2,maxhp:E.hp*2,dmg:E.dmg,arm:E.arm||0,spd:E.spd,onG:false,flash:0,dir:it[1]>0?-1:1,
      boss:!!E.boss,elite:null,shoot:E.shoot||null,scd:99,atk:E.atk||null,acd:99,
      wind:(E.atk&&it[3])?E.atk.wind*it[3]:0,act:0,invT:0,phase:0,ph:E.ph||null}); }
  return EN.length;
};

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png' };
(async () => {
  const srv = http.createServer((rq, rs) => {
    const p = path.join(ROOT, rq.url === '/' ? '/index.html' : decodeURIComponent(rq.url.split('?')[0]));
    if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { rs.writeHead(404); return rs.end(); }
    rs.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' });
    fs.createReadStream(p).pipe(rs);
  });
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const url = `http://127.0.0.1:${srv.address().port}/index.html`;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(600);

  const shot = n => page.screenshot({ path: path.join(OUT, n) });

  // 0. title screen — first thing anyone sees
  await shot('00-title.png');
  await page.evaluate(() => { startRun(); closePanel(true) });
  await page.waitForTimeout(200);

  // 1. spawn / surface
  await shot('01-surface.png');

  // 2. caves, mid-fight, one enemy mid-windup so the telegraph is on camera
  const l2=await page.evaluate(LAND, {depth:300});console.log('  caves ->',JSON.stringify(l2));
  console.log('  spawned',await page.evaluate(SPAWN, {list:[['crawler', -70, 0, 0.5], ['bat', 60, -40, 0], ['crawler', 90, 0, 0]]}));
  await page.evaluate(() => { for (let i = 0; i < 6; i++) dmgNum(P.x + i * 14 - 30, P.y - 24 - i * 6, 18 + i * 11, i === 2 ? '#d8a53f' : '#fff', i === 2); });
  await page.waitForTimeout(60);
  await shot('02-caves-telegraph.png');

  // 3. fungal, statuses + a shock chain arc
  const l3=await page.evaluate(LAND, {depth:700});console.log('  fungal ->',JSON.stringify(l3));
  console.log('  spawned',await page.evaluate(SPAWN, {list:[['spitter', -60, 0, 0], ['crawler', 55, 0, 0.7], ['bat', 20, -50, 0]]}));
  await page.evaluate(() => {
    if (EN[0]) applyStatus(EN[0], { burn: 22, shock: 1.35 }, false);
    if (EN[1]) applyStatus(EN[1], { bleed: 14, chill: 0.55 }, false);
    if (EN[0] && EN[2]) arc(EN[0].x, EN[0].y, EN[2].x, EN[2].y, '#e6d34a');
    P.focus = 74;
  });
  await page.waitForTimeout(40);
  await shot('03-fungal-status.png');

  // 4. boss fight, phase 2, deep darkness
  const l4=await page.evaluate(LAND, {depth:1500});console.log('  deep ->',JSON.stringify(l4));
  console.log('  spawned',await page.evaluate(SPAWN, {list:[['sentinel', 75, -10, 0.6]]}));
  await page.evaluate(() => {
    if (EN[0]) { EN[0].hp = EN[0].maxhp * 0.5; EN[0].phase = 1; }
    P.shield = 52; P.shieldT = perf + 9; P.weight = 3; P.focus = 100;
    for (let i = 0; i < 24; i++) burst(P.x + 50, P.y - 10, '#ffe9a0', 1);
  });
  await page.waitForTimeout(40);
  await shot('04-boss-deep.png');

  // 5. the socket screen with a real build in it
  await page.evaluate(() => {
    EQ.melee = mkItem('greataxe', 2); EQ.armor = mkItem('robe', 2);
    EQ.melee.sc = ['r', 'r', 'g']; EQ.armor.sc = ['b', 'b', 'r']; EQ.armor.chroma = 2;
    EQ.melee.sockets[0] = { id: 'cleave', tier: 2 }; EQ.melee.sockets[1] = { id: 'heavyimpact', tier: 1 };
    EQ.armor.sockets[0] = { id: 'quake', tier: 1 }; EQ.armor.sockets[1] = { id: 'addedfire', tier: 3 };
    BAG.length = 0;
    BAG.push({ kind: 'gem', id: 'serration', tier: 1 }, { kind: 'gem', id: 'ignite', tier: 2 },
             { kind: 'gear', item: mkItem('crossbow', 3) });
    refreshAttacks(); openBag();
  });
  await page.waitForTimeout(120);
  await shot('05-socket-screen.png');

  // 6. level-up: the choice that arrives inside a run
  await page.evaluate(() => { P.dead = false; paused = false; closePanel(true); P.level = 6; P.picks = 1; offerAttune(); });
  await page.waitForTimeout(120);
  await shot('06-attune.png');

  // 7. pause menu, keyboard prompts
  await page.evaluate(() => { closePanel(true); P.kills = 21; RUNSHARDS = 180; openPause(); });
  await page.waitForTimeout(120);
  await shot('07-pause.png');

  // 7b. full map after some exploring
  await page.evaluate(() => { closePanel(true); openMap() });
  await page.waitForTimeout(200);
  await shot('07b-map.png');

  // 7c. loot comparison against what you are wearing
  await page.evaluate(() => {
    closePanel(true);
    BAG.length = 0;
    BAG.push({ kind: 'gear', item: mkItem('plate', 2) }, { kind: 'gear', item: mkItem('robe', 1) },
             { kind: 'gem', id: 'chainbolt', tier: 1 });
    openBag();
  });
  await page.waitForTimeout(150);
  await shot('07c-compare.png');

  // 8. codex with a few pages earned
  await page.evaluate(() => {
    for (const k of ['crawler', 'bat', 'rockling', 'spitter', 'warden']) discover('en', k, true);
    for (const k of ['surface', 'caves', 'fungal']) discover('biome', k, true);
    discover('frag', 'f1', true); discover('frag', 'f2', true); discover('cls', 'vanguard', true);
    openCodexList('frag');
  });
  await page.waitForTimeout(120);
  await shot('08-codex.png');
  await page.evaluate(() => openLore('frag', 'f2'));
  await page.waitForTimeout(120);
  await shot('09-lore.png');

  // 10. settings, controller-navigable
  await page.evaluate(() => { INMODE = 'pad'; PADTYPE = 'xbox'; openSettings(); });
  await page.waitForTimeout(120);
  await shot('10-settings.png');

  // 11a. the lattice — the seed as an object in the fiction
  await page.evaluate(() => {
    closePanel(true); paused = false;
    SIGILS = ['reroll', 'lock', 'graft', 'invert'];
    DISSONANCE = 52; WOVEN = 2; WEAVE_LOCK.terrain = 1;
    META.bosses = { warden: 1, sporemother: 1 };
    openLattice();
  });
  await page.waitForTimeout(150);
  await shot('12-lattice.png');

  // 11b. grafting: typing a world into existence
  await page.evaluate(() => { LAT_SEL = 'ore'; GRAFT_BUF = 'KX7'; drawGraft('ore') });
  await page.waitForTimeout(150);
  await shot('13-graft.png');

  // 11c. the way out
  await page.evaluate(() => {
    DISSONANCE = 118; WOVEN = 5;
    META.bosses = { warden: 1, sporemother: 1, sentinel: 1 };
    closePanel(true); openEscape();
  });
  await page.waitForTimeout(150);
  await shot('14-escape.png');

  // 11. death summary
  await page.evaluate(() => { INMODE = 'kb'; closePanel(true); P.kills = 37; P.bestHit = 418; RUNSHARDS = 244; runDepth = 1612; P.level = 11; P.dead = false; die(); });
  await page.waitForTimeout(120);
  await shot('11-death-summary.png');

  await browser.close(); srv.close();
  if (errs.length) { console.log('ERRORS:\n  ' + errs.join('\n  ')); process.exit(1); }
  console.log('shots -> ' + OUT);
})().catch(e => { console.error(e); process.exit(1); });
