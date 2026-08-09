# CLAUDE.md — SHARDFALL

Read this before touching anything. Then read `HANDOFF.md` for the system-by-system map and
`DESIGN-PLAN.md` for where the game is going.

## What this is

A side-view action roguelite RPG. One file, `index.html`, ~1290 lines. Vanilla HTML/CSS/JS,
canvas 2D, no build step, no dependencies, mobile-first PWA. Deploys to lucidwinds.com via
Firebase Hosting / GitHub Pages by copying one file.

## Hard rules

1. **Single file.** Everything lives in `index.html`. No bundler, no npm install, no imports.
   If a change requires a build step, it's the wrong change.
2. **No browser storage APIs other than `localStorage`** for the meta save. One key,
   `shardfall`, one versioned JSON blob.
3. **Never call `setTile()` directly to dig.** All terrain removal goes through
   `carve(x, y, radius, maxHardness)`. One hardness gate, one ore-drop rule, one bedrock guard.
4. **All content lives in the DATA TABLES section** at the top of the script. Adding a gem,
   gear base, unique, enemy, elite, class, boon, or biome should be a table entry and nothing
   else. If you find yourself writing an `if (gemId === 'x')` branch, the table is missing a field.
5. **Support gems are `more` (multiplicative). Everything else is `increased` (additive).**
   Gear affixes, meta tree, class passives, and shrine boons all sum into one pool. Support
   gems and uniques each get their own multiplier. Never let a support gem write into the
   additive pool — see DESIGN-PLAN §1.1 for why this matters.
6. **Run the tests before you claim anything works.** See below.
7. **Don't add scope that wasn't asked for.** The owner is explicit about this. Build the
   thing requested, note adjacent opportunities in a comment or a message, don't just do them.

## Testing

```bash
./test/run.sh          # all suites
./test/run.sh 6        # one suite
```

Node only, no deps. The runner extracts the `<script>` block from `index.html`, syntax-checks
it, prepends a DOM/canvas stub, and runs each suite in its own process. Currently **141
assertions across 5 suites, all passing, deterministic** (the harness pins `Date.now` so world
seeds and RNG are stable — without that the suites are flaky).

**When you add a system, add assertions to a new `test/suite-N.js`.** Copy the shape of
suite-6. The harness cannot judge *feel* — it catches logic errors, NaN leaks, cap violations,
and regressions. It has caught real bugs every session, including two design-breaking ones
(`FLY_THRUST` exactly equalling gravity; a projectile burning its whole lifetime in 3 frames).

Traps that have bitten these tests before, in order of frequency:
- **Camp/anchor regen (12 hp/s) masks damage assertions.** Move the player off camp first.
- **Fall damage kills the test player** when you teleport them to a new depth. Set
  `P.vy=0; P.noFall=1; P.dead=false; P.hp=P.maxhp` after any teleport.
- **`P.dead` silently disables everything downstream** — `upPlayer` returns early and
  `useAbility` refuses. One early death cascades into a dozen confusing failures.
- **`EN[0]` is not your enemy.** World spawns get there first. Set `EN.length=0` and capture
  the reference you pushed.
- **Pickups expire.** Sample `PICK.length` immediately before the thing you're testing.

## Conventions

- Fixed 60Hz sim (`DT=1/60`), interpolated render, `requestAnimationFrame`.
- Sim and render are separate functions. Don't mutate game state in `render()`.
- No per-frame allocation in hot loops where avoidable. Entity caps: EN 120, PROJ 200/220,
  PART 350. Respect them.
- `refreshAttacks()` recomputes the cached `ATK` object. **Call it after any change to
  equipment, sockets, tree, class, or boons.** Forgetting this is the most likely bug you
  will introduce.
- Mobile-first: assume a phone, one thumb, no hover states.
- Terse code style, dense lines, minimal whitespace. Match what's there.
