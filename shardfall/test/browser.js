// SHARDFALL browser smoke test — the thing the headless node harness cannot do.
// Loads index.html in real Chromium, watches for console/page errors, drives input,
// samples the canvas to prove pixels actually change, and writes screenshots.
//
//   node test/browser.js            # smoke + screenshots -> test/shots/
//   node test/browser.js --shots-only
//
// Playwright lives outside the repo (scratchpad) so the game stays dependency-free.
const path = require('path');
const fs = require('fs');
const http = require('http');

const PW = process.env.PW_DIR || '/tmp/claude-1000/-workspaces-Sweet-Spot/00ff769b-1474-43f1-895c-6b76d1865b29/scratchpad/node_modules';
const { chromium } = require(path.join(PW, 'playwright'));

const ROOT = path.join(__dirname, '..');
const SHOTS = path.join(__dirname, 'shots');
fs.mkdirSync(SHOTS, { recursive: true });

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.mp3': 'audio/mpeg', '.webmanifest': 'application/manifest+json' };

function serve() {
  return new Promise(res => {
    const srv = http.createServer((rq, rs) => {
      const p = path.join(ROOT, decodeURIComponent(rq.url.split('?')[0]) === '/' ? '/index.html' : decodeURIComponent(rq.url.split('?')[0]));
      if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { rs.writeHead(404); return rs.end('nope'); }
      rs.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' });
      fs.createReadStream(p).pipe(rs);
    });
    srv.listen(0, '127.0.0.1', () => res(srv));
  });
}

let fails = 0;
const ok = (c, m) => { console.log((c ? 'ok: ' : 'FAIL: ') + m); if (!c) fails++; };

(async () => {
  const srv = await serve();
  const url = `http://127.0.0.1:${srv.address().port}/index.html`;
  const browser = await chromium.launch();
  // iPhone-ish viewport: this is a mobile-first game and that is where it has to read.
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });

  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + (e && e.message)));

  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(600);

  ok(errors.length === 0, 'no console/page errors on boot' + (errors.length ? '\n    ' + errors.join('\n    ') : ''));

  // The game now boots to a title screen. Confirm it is there, shoot it, then dismiss it —
  // everything below this line assumes the run has actually started.
  const titled = await page.evaluate(() => paused && document.getElementById('panel').innerHTML.includes('SHARDFALL'));
  ok(titled, 'boots to a title screen');
  await page.screenshot({ path: path.join(SHOTS, '00-title.png') });
  await page.evaluate(() => startRun());
  await page.waitForTimeout(200);
  ok(await page.evaluate(() => !paused), 'DESCEND starts the run');

  // The game must have booted its globals and be running a real loop.
  const boot = await page.evaluate(() => ({
    hasP: typeof P === 'object' && P !== null,
    perf: typeof perf === 'number' ? perf : -1,
    hp: typeof P === 'object' ? P.hp : -1,
    maxhp: typeof P === 'object' ? P.maxhp : -1,
    chunks: typeof CHUNKS !== 'undefined' ? CHUNKS.size : -1,
    cw: document.getElementById('cv').width,
    ch: document.getElementById('cv').height,
  }));
  ok(boot.hasP, 'player object exists');
  ok(boot.perf > 0, `sim loop is advancing (perf=${boot.perf && boot.perf.toFixed(2)})`);
  ok(boot.hp > 0 && boot.hp === boot.maxhp, `player spawned at full HP (${boot.hp}/${boot.maxhp})`);
  ok(boot.chunks > 0, `world generated ${boot.chunks} chunks`);
  ok(boot.cw > 0 && boot.ch > 0, `canvas sized ${boot.cw}x${boot.ch}`);

  // Canvas must actually contain non-background pixels — proves terrain rendered, not just a fill.
  const painted = await page.evaluate(() => {
    const cv = document.getElementById('cv');
    const g = cv.getContext('2d');
    const d = g.getImageData(0, 0, cv.width, cv.height).data;
    const seen = new Set();
    for (let i = 0; i < d.length; i += 4 * 97) seen.add(`${d[i]},${d[i + 1]},${d[i + 2]}`);
    return seen.size;
  });
  ok(painted > 3, `canvas has ${painted} distinct sampled colors (terrain is drawing)`);

  await page.screenshot({ path: path.join(SHOTS, '01-spawn.png') });

  // Drive real input: walk right, jump, hover, swing, shoot.
  const before = await page.evaluate(() => ({ x: P.x, y: P.y }));
  await page.keyboard.down('d'); await page.waitForTimeout(700); await page.keyboard.up('d');
  const walked = await page.evaluate(() => ({ x: P.x, y: P.y }));
  ok(Math.abs(walked.x - before.x) > 20, `walking moves the player (${(walked.x - before.x).toFixed(0)}px)`);

  await page.keyboard.down('Space'); await page.waitForTimeout(500);
  const hovering = await page.evaluate(() => ({ fuel: P.fuel, maxfuel: P.maxfuel, flying: P.flying, y: P.y }));
  await page.keyboard.up('Space');
  ok(hovering.fuel < hovering.maxfuel, `hover burns fuel (${hovering.fuel.toFixed(0)}/${hovering.maxfuel})`);
  await page.screenshot({ path: path.join(SHOTS, '02-hover.png') });

  // Hold, don't press: an instant down+up can land entirely between two sim ticks.
  await page.keyboard.down('j'); await page.waitForTimeout(200); await page.keyboard.up('j');
  await page.keyboard.down('k'); await page.waitForTimeout(200); await page.keyboard.up('k');
  const acted = await page.evaluate(() => ({ mcd: P.mcd, part: PART.length }));
  ok(acted.part > 0, `attacking spawns particles (${acted.part})`);

  // Dig down and travel: this is the core traversal loop and the deepest render path.
  await page.evaluate(() => { for (let i = 0; i < 40; i++) carve(P.x, P.y + i * TILE, TILE * 1.6, 3); });
  await page.evaluate(() => { P.y += 30 * TILE; P.noFall = 5; P.vy = 0; });
  await page.waitForTimeout(900);
  const deep = await page.evaluate(() => ({ y: P.y, depth: runDepth, biome: biomeName(Math.floor(P.y / TILE)), en: EN.length, errs: 0 }));
  ok(deep.depth > 0, `descended to ${deep.depth}m (${deep.biome})`);
  await page.screenshot({ path: path.join(SHOTS, '03-underground.png') });

  // UI overlays must render — the bag is the most-used screen in the game.
  // Clear any panel the descent may have opened (death, shrine) first, or the 'e' toggle
  // closes that panel instead of opening the bag and the check reads as a failure.
  await page.evaluate(() => { P.dead = false; P.hp = P.maxhp; paused = false; closePanel(); });
  await page.keyboard.press('e'); await page.waitForTimeout(250);
  const bagOpen = await page.evaluate(() => document.getElementById('overlay').style.display === 'flex' && document.getElementById('panel').innerHTML.length > 40);
  ok(bagOpen, 'BAG panel opens and has content');
  await page.screenshot({ path: path.join(SHOTS, '04-bag.png') });
  await page.keyboard.press('Escape'); await page.waitForTimeout(150);

  // Let it run a while under load and re-check for late errors + frame health.
  await page.evaluate(() => { for (let i = 0; i < 25; i++) EN.push(Object.assign({}, { x: P.x + (i % 5) * 40 - 100, y: P.y - 20, vx: 0, vy: 0, w: 14, h: 12, type: 'crawler', ai: 'walk', c: '#7d5340', hp: 24, maxhp: 24, dmg: 8, spd: 42, onG: false, flash: 0, dir: 1, boss: false, elite: null, shoot: null, scd: 0 })); });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(SHOTS, '05-combat.png') });

  const health = await page.evaluate(() => ({
    nan: [P.x, P.y, P.vx, P.vy, P.hp, P.fuel].some(v => !isFinite(v)),
    en: EN.length, proj: PROJ.length, part: PART.length,
  }));
  ok(!health.nan, 'no NaN leaked into player state after live play');
  ok(health.part <= 350 && health.proj <= 220, `entity caps hold (PART ${health.part}, PROJ ${health.proj})`);

  // ---- UI/UX: the parts only a real DOM can exercise ----
  await page.evaluate(() => { P.dead = false; P.hp = P.maxhp; paused = false; closePanel(true); openSettings(); });
  await page.waitForTimeout(150);
  const focus0 = await page.evaluate(() => menuIdx);
  await page.keyboard.press('ArrowDown'); await page.waitForTimeout(80);
  const focus1 = await page.evaluate(() => menuIdx);
  ok(focus1 !== focus0, `arrow keys move the menu cursor (${focus0} -> ${focus1})`);
  const focusMarked = await page.evaluate(() => !!document.querySelector('#panel button.foc'));
  ok(focusMarked, 'the focused row is visibly marked');
  // wrapping: pressing up from the top lands on the last row
  await page.evaluate(() => menuFocus(0));
  await page.keyboard.press('ArrowUp'); await page.waitForTimeout(80);
  const wrapped = await page.evaluate(() => ({ idx: menuIdx, n: menuButtons().length }));
  ok(wrapped.idx === wrapped.n - 1, 'the cursor wraps around the ends');
  // Enter activates the focused row — cycle a setting and confirm it changed and persisted
  await page.evaluate(() => menuFocus(1));   // screen shake
  const shakeBefore = await page.evaluate(() => SET.shake);
  await page.keyboard.press('Enter'); await page.waitForTimeout(150);
  const shakeAfter = await page.evaluate(() => ({ v: SET.shake, saved: JSON.parse(localStorage.getItem('shardfall')).set.shake }));
  ok(shakeAfter.v !== shakeBefore, `Enter activates the focused row (shake ${shakeBefore} -> ${shakeAfter.v})`);
  ok(shakeAfter.saved === shakeAfter.v, 'the changed setting is persisted immediately');
  ok(await page.evaluate(() => menuIdx === 1), 'cycling a setting keeps the cursor where it was');
  await page.evaluate(() => { SET.shake = 100; saveSet(); closePanel(); });

  // Escape backs out of a normal panel but not a modal one
  await page.evaluate(() => { openBag() });
  await page.waitForTimeout(100);
  await page.keyboard.press('Escape'); await page.waitForTimeout(150);
  ok(await page.evaluate(() => !paused), 'Escape closes an ordinary panel');
  await page.evaluate(() => { P.picks = 1; offerAttune() });
  await page.waitForTimeout(120);
  await page.keyboard.press('Escape'); await page.waitForTimeout(150);
  ok(await page.evaluate(() => paused && document.getElementById('panel').innerHTML.includes('ATTUNE')),
    'a modal panel refuses to be dismissed without a choice');
  await page.evaluate(() => { takeAttune(0) });
  await page.waitForTimeout(120);
  ok(await page.evaluate(() => !paused && P.picks === 0), 'choosing an attunement closes the modal');

  // mouse aim: moving the cursor takes over from auto-aim and points where it points
  await page.mouse.move(60, 300); await page.waitForTimeout(120);
  const aimed = await page.evaluate(() => ({ manual: IN.manual, ax: IN.aimX }));
  ok(aimed.manual, 'moving the mouse switches to manual aim');
  ok(aimed.ax < 0, 'aiming left of the player produces a leftward aim vector');
  await page.mouse.move(340, 300); await page.waitForTimeout(120);
  ok(await page.evaluate(() => IN.aimX) > 0, 'and aiming right flips it');

  // touch controls must not be on screen for a keyboard player
  const touchHidden = await page.evaluate(() => getComputedStyle(document.getElementById('btns')).display === 'none');
  ok(touchHidden, 'touch controls are hidden in keyboard mode');
  await page.evaluate(() => setMode('touch'));
  await page.waitForTimeout(80);
  ok(await page.evaluate(() => getComputedStyle(document.getElementById('btns')).display !== 'none'),
    'and shown again in touch mode');
  await page.evaluate(() => setMode('kb'));

  // the codex opens, gates unseen pages, and reveals them once discovered
  await page.evaluate(() => { META.seen = { en: {}, item: {}, biome: {}, frag: {}, cls: {} }; openCodexList('en') });
  await page.waitForTimeout(120);
  const sealed = await page.evaluate(() => document.getElementById('panel').innerHTML.includes('???'));
  ok(sealed, 'undiscovered codex pages stay sealed');
  await page.evaluate(() => { discover('en', 'crawler', true); openCodexList('en') });
  await page.waitForTimeout(120);
  const revealed = await page.evaluate(() => document.getElementById('panel').innerHTML.includes('Crawler'));
  ok(revealed, 'a discovered page becomes readable');
  await page.evaluate(() => closePanel());

  ok(errors.length === 0, 'no errors across the whole session' + (errors.length ? '\n    ' + errors.join('\n    ') : ''));

  await browser.close();
  srv.close();
  console.log('');
  console.log(fails ? `=== ${fails} BROWSER CHECK(S) FAILED ===` : '=== BROWSER SMOKE PASS ===');
  console.log('screenshots -> ' + SHOTS);
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR', e); process.exit(1); });
