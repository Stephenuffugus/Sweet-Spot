# design/

Planning and reference material. None of it ships — the game is still just `../index.html`.

| file | what it is | how to use it |
|---|---|---|
| **[PLAN.md](PLAN.md)** | The long plan: what's broken, what we decided, ten sprints. | **Start here.** It carries the decisions. |
| [CURRENT-STATE.md](CURRENT-STATE.md) | Every live table as markdown — enemies, gear, gems, affixes, curves, economy. | Generated. Run `./audit.sh` to refresh; never hand-edit. |
| [RESEARCH.md](RESEARCH.md) | 1,500 lines of sourced research across seven lenses. | Don't read front to back. Search it when a decision needs justifying. |
| [art-prototype.html](art-prototype.html) | The visual spec, rendered: palette, before/after, silhouette test, in-context. | Open it in a browser. |
| [audit.js](audit.js) / [audit.sh](audit.sh) | Generator for CURRENT-STATE.md. | `./design/audit.sh` |

## Why CURRENT-STATE.md is generated

Design docs drift from the code within a session. Numbers typed from memory are wrong by the
time anyone reads them. `audit.sh` extracts the `<script>` block, runs it on the test harness,
and dumps the live tables — so the plan can cite real values and be caught when it doesn't.

## Reading order for a fresh session

1. `../CLAUDE.md` — the hard rules. Non-negotiable.
2. `PLAN.md` §0 (how to start), §1 (where we are), §2 (the five things that matter).
3. `CURRENT-STATE.md` for whatever subsystem you're touching.
4. `RESEARCH.md` only when you need the evidence behind a decision.

## A note on the research

Each research lens was asked for numbers and primary sources rather than advice, and was asked
to mark its own proposals as distinct from citations. That distinction is preserved in
`RESEARCH.md` and it matters: several widely-repeated figures in game-feel writing turn out to
have no primary source at all. The Vlambeer "Art of Screenshake" talk, for instance, publishes
no numeric values — anyone citing specific amplitudes to it is inventing them.

Where a number in `PLAN.md` came from a shipped game, `RESEARCH.md` says which game and how
confident the lens was. Where it's a proposal, it says so.
