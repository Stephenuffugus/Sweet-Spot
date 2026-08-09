# CLAUDE.md — SHARDFALL

Read this before touching anything. Then:
- **`design/PLAN.md`** — the long plan, and what to do next. Start there.
- `HANDOFF.md` — the system-by-system map of what exists.
- `design/CURRENT-STATE.md` — every live table as real numbers (generated; run `design/audit.sh`).
- `design/RESEARCH.md` — sourced evidence behind the plan's decisions. Search it, don't read it.
- `DESIGN-PLAN.md` — the original design reasoning from sessions 1–7. Historical.

## What this is

A side-view action roguelite RPG. One file, `index.html`, ~3000 lines. Vanilla HTML/CSS/JS,
canvas 2D, no build step, no dependencies. Lives in `shardfall/` inside the Sweet-Spot repo;
deploys by copying the folder.

**It plays on four devices**: touch, keyboard, mouse, and gamepad. That is a change from the
original mobile-first framing — the touch layout still exists and still matters, but no longer
gets to be the only assumption. Anything you add has to answer "how does this work with a
thumb, and with a stick, and with a cursor?".

## Hard rules

1. **Single file.** The game is `index.html`. The only siblings are `sw.js`, `manifest.json`
   and the icons — all static, none imported by the game. No bundler, no npm install. If a
   change requires a build step, it's the wrong change.
2. **No browser storage APIs other than `localStorage`** for the meta save. One key,
   `shardfall`, one versioned JSON blob. Bump `SAVE_VER` and extend `migrate()` — never
   discard an old save.
3. **Never call `setTile()` directly to dig.** All terrain removal goes through
   `carve(x, y, radius, maxHardness)`. One hardness gate, one ore-drop rule, one bedrock guard.
4. **All content lives in the DATA TABLES section** at the top of the script. Adding a gem,
   gear base, unique, enemy, elite, class, boon, affix or biome should be a table entry and
   nothing else. If you find yourself writing an `if (gemId === 'x')` branch, the table is
   missing a field. Conditional effects that need *live* state (Momentum, Reap, Culling) are
   the one exception — they set a field on `a` and resolve inside `strike()`.
5. **Two damage pools, never mixed.** `inc(key)` is the additive `increased` pool — gear
   affixes, meta tree, class passives, shrine boons. `a.more` is the multiplicative `more`
   pool — support gems and uniques. They combine in exactly one place, `resolveDmg()`, as
   `base × (1 + inc) × more`. A support gem that touches `a.dmg` instead of `a.more` is a bug.
   See DESIGN-PLAN §1.1 for why this is load-bearing.
6. **Sockets hold `{id, tier}`** (or a bare string, from v1 saves). Always read them through
   `gemId()` / `gemTier()` / `gemOf()`. A raw `GEMS[socketValue]` lookup is a bug.
7. **The world is generated from SIX seeds, not one.** `WEAVE` holds a seed per strand and
   every generator reads through `hashS(strand, x, y)` or a per-strand chunk RNG. Strand
   independence is the whole mechanic — if rerolling the caches moves the monsters, the Lattice
   is broken. Suite 9 asserts it by fingerprinting each strand's output.
8. **`o.st[k]` is always an array** of `{p, t}` instances, even for the non-stacking effects.
   One shape, one code path.
9. **Run the tests before you claim anything works.** See below.
10. **Input goes through the abstraction, never straight to a device.** Devices write into
   `HELD` (continuous) and `fire()`/`consumed()` (one-shot); `readInput()` turns intent into
   actions once per frame, before `sim()`. A `keydown` handler that calls a gameplay function
   directly will fire while paused and behind menus.
11. **Every prompt goes through `pr(action)`.** Hard-coding "press E" is a bug on a controller.
    `GLYPH` carries the keyboard, Xbox, PlayStation and touch labels for every named action.
12. **A panel that can be dismissed must not leave the game paused.** `openPanel(html, true)`
    marks a panel modal (title, death, shrine, level-up); modal panels demand a choice.
    `closePanel(force)` is the only way out of one.
13. **Sprites are data.** A creature is a character grid in `SPR` indexing a palette ramp,
    baked once at load. Three laws are tested, not assumed: nothing approaches the player's
    ramp in luminance, every actor clears 3:1 against its ground, and no two enemies in a biome
    share a top shape.
14. **Don't add scope that wasn't asked for.** The owner is explicit about this. Build the
   thing requested, note adjacent opportunities in a comment or a message, don't just do them.

## Testing

```bash
./test/run.sh          # all node suites (2-9)
./test/run.sh 9        # one suite
node test/browser.js   # real Chromium: boot, input, render, no console errors
node test/pwa.js       # manifest, service worker, offline reload, save migration
node test/shots.js     # writes screenshots to test/shots/ — the only way to judge FEEL
```

The node runner extracts the `<script>` block from `index.html`, syntax-checks it, prepends a
DOM/canvas stub, and runs each suite in its own process. Node only, no deps. The browser and
PWA suites need Playwright, which lives **outside** the repo (set `PW_DIR` if yours differs) so
the game stays dependency-free.

**When you add a system, add assertions to a new `test/suite-N.js`.** Copy the shape of
suite-7 or suite-8. The harness cannot judge *feel* — it catches logic errors, NaN leaks, cap violations
and regressions. It has caught a real bug every session, including `FLY_THRUST` exactly
equalling gravity, a projectile burning its whole lifetime in three frames, and a hand-built
test enemy with no `invT` producing NaN.

Harness helpers, because the new model is full of dice rolls and resources:
- `NOCRIT()` / `YESCRIT()` — crit is a 5% roll, so any exact-damage assertion is flaky without it.
- `TOPUP()` — abilities cost Focus *and* cooldown; several in a row will fail on the resource.
- `NOARMOR()` — strip flat armor when asserting raw damage.
- `GID(socket)` — compare socket contents without caring about `{id,tier}` vs bare string.

Traps that have bitten these tests before, in order of frequency:
- **Camp/anchor regen (12 hp/s) masks damage assertions.** Move the player off camp first.
- **Deep test positions are solid rock.** Hand-built enemies spawn embedded, collision shoves
  them apart, and melee assertions fail for the wrong reason. Carve a floor — see `OFF()` in suite-7.
- **Fall damage kills the test player** when you teleport them. Set
  `P.vy=0; P.noFall=1; P.dead=false; P.hp=P.maxhp` after any teleport.
- **`P.dead` silently disables everything downstream** — `upPlayer` returns early and
  `useAbility` refuses. One early death cascades into a dozen confusing failures.
- **`EN[0]` is not your enemy.** World spawns get there first. Set `EN.length=0` and capture
  the reference you pushed.
- **Pickups expire.** Sample `PICK.length` immediately before the thing you're testing.
- **`Date.now` is pinned** by the harness so world seeds are deterministic. That also means
  any timing number printed by a suite is meaningless.
- **The harness has no pointer, no gamepad and no real DOM.** `querySelectorAll` returns `[]`,
  `matchMedia` reports false, `getGamepads` returns nothing. Anything that depends on real DOM
  behaviour — menu focus, computed styles, mouse coordinates — belongs in `test/browser.js`.
- **The game boots to a title screen**, which holds the sim paused on purpose. A test that
  asserts "the loop is running" must call `startRun()` first.

## Conventions

- Fixed 60Hz sim (`DT=1/60`), interpolated render, `requestAnimationFrame`.
- Sim and render are separate functions. `render()` must not mutate game state, and must not
  consume the world RNG — it has its own `RRNG()`. Screenshake once drew from `RNG()`, which
  made chunk contents depend on how many frames had been drawn.
- No per-frame allocation in hot loops where avoidable. Entity caps: EN 120, PROJ 200/220,
  PART 350. Respect them.
- `refreshAttacks()` recomputes the cached `ATK` object **and** `P.armor`, `P.sres`,
  `P.maxfuel`. **Call it after any change to equipment, sockets, tree, class, or boons.**
  Forgetting this is the most likely bug you will introduce.
- All visuals go through `drawEntity()`, which falls back to flat rects when no sprite atlas
  is loaded. Keep it that way — it's what lets art land without breaking the single-file rule.
- Multi-device. The thumb owns the bottom-right corner on touch and nothing else may live
  there; on keyboard and gamepad the touch overlay is hidden entirely (`body.touchmode`).
  `INMODE` tracks the last device actually used and the whole UI follows it.
- Every menu is a stack of `<button>`s so one focus cursor makes the entire UI navigable by
  dpad or arrow keys. Don't build a screen out of anything else.
- Terse code style, dense lines, minimal whitespace. Match what's there.
