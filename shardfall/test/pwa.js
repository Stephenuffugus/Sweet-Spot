// SHARDFALL PWA check: manifest is valid, the service worker installs, and the game actually
// boots with the network cut. "Works offline" is a claim worth testing rather than asserting.
//
//   node test/pwa.js
const path = require('path'), fs = require('fs'), http = require('http');
const PW = process.env.PW_DIR || '/tmp/claude-1000/-workspaces-Sweet-Spot/00ff769b-1474-43f1-895c-6b76d1865b29/scratchpad/node_modules';
const { chromium } = require(path.join(PW, 'playwright'));
const ROOT = path.join(__dirname, '..');

let fails = 0;
const ok = (c, m) => { console.log((c ? 'ok: ' : 'FAIL: ') + m); if (!c) fails++ };
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/manifest+json', '.png': 'image/png' };

(async () => {
  // ---- manifest sanity, before we even open a browser ----
  const mf = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8'));
  ok(!!mf.name && !!mf.start_url, 'manifest has name and start_url');
  // start_url must be relative: an absolute "/" breaks under a project subpath like /Sweet-Spot/shardfall/
  ok(!mf.start_url.startsWith('/'), 'start_url is relative, so it survives a subdirectory deploy');
  ok(!mf.scope || !mf.scope.startsWith('/'), 'scope is relative too');
  ok(mf.id === mf.start_url || !mf.id, 'manifest id matches start_url');
  for (const i of mf.icons) ok(fs.existsSync(path.join(ROOT, i.src)), `icon exists: ${i.src}`);
  ok(mf.icons.some(i => (i.purpose || '').includes('maskable')), 'a maskable icon is declared');

  const srv = http.createServer((rq, rs) => {
    const p = path.join(ROOT, rq.url === '/' ? '/index.html' : decodeURIComponent(rq.url.split('?')[0]));
    if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { rs.writeHead(404); return rs.end('nope') }
    rs.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' });
    fs.createReadStream(p).pipe(rs);
  });
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const port = srv.address().port;
  const url = `http://127.0.0.1:${port}/index.html`;

  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()) });

  await page.goto(url, { waitUntil: 'load' });
  // wait for the worker to reach activated
  const swState = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return 'unsupported';
    const reg = await navigator.serviceWorker.register('sw.js').catch(e => null);
    if (!reg) return 'failed';
    for (let i = 0; i < 60; i++) {
      const r = await navigator.serviceWorker.getRegistration();
      if (r && r.active) return 'activated';
      await new Promise(r2 => setTimeout(r2, 100));
    }
    return 'timeout';
  });
  ok(swState === 'activated', `service worker reaches activated (${swState})`);

  const cached = await page.evaluate(async () => {
    const keys = await caches.keys();
    if (!keys.length) return [];
    const c = await caches.open(keys[0]);
    return (await c.keys()).map(r => new URL(r.url).pathname);
  });
  ok(cached.length > 0, `cache populated (${cached.length} entries)`);
  ok(cached.some(p => p.endsWith('index.html') || p.endsWith('/')), 'the app shell itself is cached');

  // ---- cut the network and reload ----
  await ctx.setOffline(true);
  errs.length = 0;
  await page.reload({ waitUntil: 'load' }).catch(e => errs.push('reload: ' + e.message));
  await page.waitForTimeout(800);
  // The game boots to a title screen, which deliberately holds the sim paused — so start the
  // run before asserting the loop is alive, or "paused on purpose" reads as "broken".
  await page.evaluate(() => { if (typeof startRun === 'function') startRun() }).catch(() => {});
  await page.waitForTimeout(500);
  const offline = await page.evaluate(() => ({
    booted: typeof P === 'object' && P !== null && P.maxhp > 0,
    running: typeof perf === 'number' && perf > 0,
    chunks: typeof CHUNKS !== 'undefined' ? CHUNKS.size : 0,
  })).catch(() => ({ booted: false, running: false, chunks: 0 }));
  ok(offline.booted, 'game boots with the network cut');
  ok(offline.running, 'sim loop runs offline');
  ok(offline.chunks > 0, 'world still generates offline');
  ok(errs.length === 0, 'no errors while offline' + (errs.length ? '\n    ' + errs.join('\n    ') : ''));

  // ---- the save must survive a reload, since that IS the meta progression ----
  await ctx.setOffline(false);
  await page.goto(url, { waitUntil: 'load' });
  await page.evaluate(() => { META.shards = 1234; META.unlocks.axe = 1; saveMeta() });
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(400);
  const kept = await page.evaluate(() => ({ shards: META.shards, axe: !!META.unlocks.axe, ver: META.ver }));
  ok(kept.shards === 1234 && kept.axe, 'meta save survives a reload');
  // settings and codex progress live in the same blob and must survive too
  await page.evaluate(() => { SET.vol = 70; saveSet(); discover('en', 'brute', true) });
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(400);
  const kept2 = await page.evaluate(() => ({ vol: SET.vol, seen: !!META.seen.en.brute }));
  ok(kept2.vol === 70, 'settings survive a reload');
  ok(kept2.seen, 'codex discoveries survive a reload');
  ok(kept.ver === 3, `save is at version 3 (${kept.ver})`);

  // ---- a v1 save must migrate rather than being discarded ----
  await page.evaluate(() => {
    localStorage.setItem('shardfall', JSON.stringify({
      ver: 1, shards: 777, unlocks: { wand: 1 }, tree: { m1: 1 }, cls: 'delver',
      classes: { vanguard: 1, delver: 1 }, anchors: { surface: 1, caves: 1 }, startBiome: 'caves',
      loadout: { melee: 'axe', ranged: 'bow', armor: 'vest' }, bestDepth: 412
    }));
  });
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(400);
  const mig = await page.evaluate(() => ({
    shards: META.shards, ver: META.ver, cls: META.cls, wand: !!META.unlocks.wand,
    m1: !!META.tree.m1, depth: META.bestDepth, vault: Array.isArray(META.vault), anchor: META.startBiome,
    // every v3 field must exist after a v1 blob migrates, and the unlocked wand must seed
    // the gem collection (v3 seeds seen.gem from DEFAULT_GEM_POOL + unlocked gem ids)
    v3: ['endings', 'forge', 'dlg', 'firsts', 'tips', 'moves'].every(k => META[k] && typeof META[k] === 'object')
      && !!META.seen.gem && !!META.seen.uni,
  }));
  ok(mig.shards === 777, 'v1 save keeps its shards through migration');
  ok(mig.wand && mig.m1, 'v1 unlocks and tree nodes survive');
  ok(mig.cls === 'delver' && mig.anchor === 'caves', 'v1 class and anchor survive');
  ok(mig.depth === 412, 'v1 best depth survives');
  ok(mig.ver === 3 && mig.vault, 'v1 save is upgraded to v3 with a vault');
  ok(mig.v3, 'all eight v3 fields exist after migration');

  await browser.close(); srv.close();
  console.log('');
  console.log(fails ? `=== ${fails} PWA CHECK(S) FAILED ===` : '=== PWA PASS ===');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR', e); process.exit(1) });
