## Review Briefing: game-night (full repo)
<!-- Generated: 2026-08-06, Tools: ctx-reviewer -->

### Project context
game-night (v0.1.0) is a searchable library of games — board, card, online, and homemade — built on Node.js/ESM with npm. Key deps: @leeoniya/ufuzzy (fuzzy search), @vanilla-bean/components and @vanilla-bean/hypertether (UI framework), argi-cli, lowdb (JSON db), marked (markdown rendering). Entry point is `./server/index.js`. The repo has 50 source files (5,333 lines) and 3 test files. Currently on `main`, with recent work on a related-games picker, a hypertether security bump, and CI-adjacent dep swaps. Uncommitted working-tree changes exist at review time: `client/Games/GameCard.js`, `client/Games/Games.js`, `spellcheck.config.cjs`.

### Critical findings  🔴
- FILE: client/router.js, client/Games/Games.js, client/Games/index.js, client/Games/GamesToolbar.js, client/Games/GameDialog/index.js, client/Games/GameDialog/GameDialog.js, client/GamePage/GamePage.js, client/GamePage/index.js  FUNCTION: module-level import graph  TOOL: ctx-health / ctx-arch --cycles-only  ISSUE: 3 circular import chains detected: (1) `router.js → Games/index.js → Games/Games.js → router.js`; (2) `router.js → Games/index.js → Games/Games.js → GamesToolbar.js → GameDialog/index.js → GameDialog/GameDialog.js → router.js`; (3) `GamePage/GamePage.js → router.js → GamePage/index.js → GamePage/GamePage.js`  CONSEQUENCE: circular ESM imports risk temporal-dead-zone / undefined bindings depending on evaluation order, make bundler tree-shaking unreliable, and mean any future edit to router.js, Games.js, or GamePage.js can silently change module initialization order elsewhere in the cycle.

### Warnings  🟡
- FILE: server/router/games.js  FUNCTION: gamesRouter  TOOL: ctx-health / ctx-hotspots  ISSUE: cyclomatic complexity 22 — highest in the repo; also a top hotspot (churn 1 commit, score 22)  CONSEQUENCE: high branch count in the main games route handler makes it error-prone to modify and hard to cover exhaustively with tests.
- FILE: client/Games/util.js  FUNCTION: gameMatchesFilters  TOOL: ctx-health / ctx-hotspots  ISSUE: complexity 20; file is the #1 hotspot overall (churn 2 commits, complexity 20, score 40 — highest combined churn+complexity in the repo)  CONSEQUENCE: frequently-edited, highly-complex filter logic is the most likely place for regressions when game-filtering behavior changes.
- FILE: server/utils/steam.js  FUNCTION: enrichSteamGames  TOOL: ctx-health  ISSUE: complexity 17  CONSEQUENCE: complex Steam-enrichment logic is harder to verify correctly against edge-case API responses.
- FILE: client/Games/GamesToolbar.js  FUNCTION: GamesToolbar.build  TOOL: ctx-health / ctx-hotspots  ISSUE: complexity 15  CONSEQUENCE: high-branching UI construction logic is harder to visually verify and prone to state-handling bugs.
- FILE: client/Games/GameDialog/GameDialog.js  FUNCTION: module-level  TOOL: ctx-hotspots  ISSUE: 2nd-highest hotspot — churn 2 commits, complexity 13, score 26  CONSEQUENCE: actively-changing file with moderate complexity carries elevated regression risk on future edits.
- FILE: package.json  FUNCTION: n/a (dependencies)  TOOL: ctx-health  ISSUE: 2 unused deps never imported anywhere: `@testing-library/dom`, `@testing-library/jest-dom`  CONSEQUENCE: dead install weight; may also indicate test infrastructure that was set up but never wired in.
- FILE: server/database/crud.js, server/database/index.js, server/database/database.js, server/database/games.js (+43 more files)  FUNCTION: n/a  TOOL: ctx-health  ISSUE: 47 of 50 source files have no test coverage, including the entire server/database/* persistence layer  CONSEQUENCE: core data-access code is completely unverified by automated tests — regressions in CRUD/database logic would only surface at runtime.
- FILE: client/Games/confirmDeleteGame.js, server/database/games.js, server/router/steam.js, server/utils/requestMatch.js  FUNCTION: n/a  TOOL: ctx-duplicates  ISSUE: 4 files flagged as structurally similar (similarity threshold 0.7)  CONSEQUENCE: possible copy-pasted logic; a bug fixed in one copy may silently persist in the others.

### Passing  ✓
- Stale docs: all JSDoc current (ctx-health)
- Known debt: no TODO/FIXME/HACK/XXX/NOTE/REVIEW comments found (ctx-health, ctx-todo)
- Dead exports: 0 dead exports found across the repo (ctx-dead)
- TypeScript: n/a — no TS files present, check skipped cleanly (ctx-health)

### Scope summary
- Scope: full repo
- Refs: branch `main` (uncommitted changes present: client/Games/GameCard.js, client/Games/Games.js, spellcheck.config.cjs)
- Files reviewed: 50 source files (5,333 lines), 3 test files
- Tools run: ctx-orient, ctx-health, ctx-todo --counts-only, ctx-hotspots --top 5, ctx-dead, ctx-duplicates, ctx-rhythm (environment failure — see note below), ctx-arch --cycles-only

Note: `ctx-rhythm` could not execute — its shebang points to a stale, machine-specific node path (`/Users/chase.whitfield/.nvm/...`), and re-running it under the local node (v14.21.3) fails with `Cannot find module 'ts-morph'`. This is a broken local tool install, not a code finding — return-shape/error-signaling consistency across module exports was not assessed in this review.

### Verbatim tool output
<!-- Downstream agents: the raw output is below. The structured findings above are derived from it. -->

<tool: ctx-orient>
## Orient: game-night  v0.1.0
A searchable library of games - board, card, online, and homemade

  Runtime       Node.js
  Package mgr   npm
  Module type   ESM
  Key deps      @leeoniya/ufuzzy, @vanilla-bean/components, @vanilla-bean/hypertether, argi-cli, lowdb, marked

  Source files  50  (5,333 lines)
  Test files    3

  Architecture
    client/Games/Games.js                    in:1  out:10
    client/GamePage/GamePage.js              in:1  out:9
    client/api/index.js                      in:7  out:2
    Cycles: 🔴 found — run ctx-health for the paths

  Most changed (6 months)
    server/index.js                          2 commit(s)
    client/Games/GameDialog/GameForm.js      2 commit(s)
    client/Games/GameDialog/GameDialog.js    2 commit(s)

  Entry         ./server/index.js

  Health
    🔴  Cycles       3 import cycle(s)
    🟡  Complexity   18 function(s) complexity ≥ 8
    🟡  Unused deps  2 package(s) never imported
    🟡  Test gaps    47 file(s) without tests
    ✓ 2  |  🟡 3 warning(s)  |  🔴 1 critical  |  · 1 skipped
</tool>

<tool: ctx-health>
## Health: /home/chase/Projects/game-night

  ·  TypeScript   no TS files
  🔴  Cycles       3 import cycle(s)
                      client/Games/Games.js → client/router.js → client/Games/index.js → client/Games/Games.js
                      client/router.js → client/GamePage/index.js → client/GamePage/GamePage.js → client/router.js
                      client/router.js → client/GamePage/index.js → client/GamePage/GamePage.js → client/Games/GameDialog/index.js → client/Games/GameDialog/GameDialog.js → client/router.js
  🟡  Complexity   18 function(s) complexity ≥ 8
                      gamesRouter (22)  server/router/games.js
                      gameMatchesFilters (20)  client/Games/util.js
                      enrichSteamGames (17)  server/utils/steam.js
                      GamesToolbar.build (15)  client/Games/GamesToolbar.js
  🟡  Unused deps  2 package(s) never imported
                      @testing-library/dom
                      @testing-library/jest-dom
  ✓  Stale docs   all JSDoc current
  🟡  Test gaps    47 file(s) without tests
                      server/database/crud.js
                      server/database/index.js
                      server/database/database.js
                      server/database/games.js
  ✓  Known debt   no TODO/FIXME/HACK comments

───────────────────────────────
✓ 2  |  🟡 3 warning(s)  |  🔴 1 critical  |  · 1 skipped
</tool>

<tool: ctx-todo --counts-only>
## TODO: .

✓ No TODO/FIXME/HACK/XXX/NOTE/REVIEW found.
</tool>

<tool: ctx-hotspots --top 5>
## Hotspots: .  (git since: 6 months ago)

file                                   churn  complexity  score
─────────────────────────────────────  ─────  ──────────  ─────
🟡 client/Games/util.js                       2          20     40
🟡 client/Games/GameDialog/GameDialog.js      2          13     26
🟡 server/router/games.js                     1          22     22
   server/utils/steam.js                      1          17     17
   client/Games/GamesToolbar.js               1          15     15
</tool>

<tool: ctx-dead>
## Dead Exports: .

0 dead, 0 live exports found
</tool>

<tool: ctx-duplicates>
## Structural Duplicates: . (threshold: 0.7)

  Structurally similar (4 files):
    ./client/Games/confirmDeleteGame.js
    ./server/database/games.js
    ./server/router/steam.js
    ./server/utils/requestMatch.js
</tool>

<tool: ctx-rhythm>
FAILED — tool environment error, not a code finding.
  First attempt: /home/chase/.dotfiles/bin/ctx-rhythm: exec: /Users/chase.whitfield/.nvm/versions/node/v20.3.0/bin/node: not found
  Retry with local node (v14.21.3): Error: Cannot find module '/home/chase/.nvm/versions/node/v14.21.3/lib/node_modules/ts-morph'
  ctx-rhythm's shebang is hardcoded to a different machine's nvm path; local ts-morph dependency is also missing. Return-shape/error-signaling consistency was not assessed.
</tool>

<tool: ctx-arch --cycles-only>
## Import Cycles: .

  🔴 client/router.js → client/Games/index.js → client/Games/Games.js → client/router.js
  🔴 client/router.js → client/Games/index.js → client/Games/Games.js → client/Games/GamesToolbar.js → client/Games/GameDialog/index.js → client/Games/GameDialog/GameDialog.js → client/router.js
  🔴 client/GamePage/GamePage.js → client/router.js → client/GamePage/index.js → client/GamePage/GamePage.js
</tool>

---
**BRIEFING COMPLETE: 1 critical, 8 warnings**
Downstream agents: start from "Critical findings" and "Project context". Do not re-run the tools.
