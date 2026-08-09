# SHARDFALL

Side-view action roguelite RPG. Single-file vanilla JS PWA — open `index.html` and play.

- **`index.html`** — the entire game (~1290 lines, no dependencies, no build step)
- **`CLAUDE.md`** — rules and conventions; Claude Code loads this automatically
- **`HANDOFF.md`** — system-by-system map of the build, gaps, traps
- **`DESIGN-PLAN.md`** — stat model, content catalog, roadmap
- **`test/`** — headless test harness (node only)

```bash
./test/run.sh        # 141 assertions, 5 suites, deterministic
./test/run.sh 6      # single suite
```

Deploy: copy `index.html` to the host root. That's the whole pipeline.
