# OSS Release: Docs & Cleanup Pass — Design

**Date:** 2026-04-19
**Scope:** Docs + code cleanup only. No GitHub publishing, no CI, no release tagging this pass.
**Audience:** Total-beginner students who will most often hand the repo URL to Claude Code and let the agent do the installation. Docs should therefore be unambiguous and precise rather than hand-holding with OS-specific screenshots — agent-parseable language serves both audiences.

## Context

Token Dashboard was built on Windows, now verified to work on macOS (66/66 tests pass, all 7 API endpoints serve real data, no hardcoded Windows paths in runtime code). The goal of this pass is to turn it into a public-repo-ready codebase so students can clone (or hand the URL to Claude Code) and get useful output with zero back-and-forth. The non-goals are creating the GitHub repo, pushing, setting up CI, or tagging a release — those happen in a follow-up.

Three known issues surface from the initial run:
1. `CLAUDE.md` is stale — still reads "empty scaffold," lists resolved open questions, hardcodes the Windows project path.
2. `docs/customizations.md` is a pre-decision TODO list whose candidates have all been answered by the code — it's misleading, not useful.
3. The Skills route computes `tokens_per_call` only for skills whose `SKILL.md` lives under three scanned roots; skills registered elsewhere still get accurate invocation counts but leave the token column blank. Cool but incomplete — needs a documented known-limitations note rather than silently confusing.

## Collaboration model

Three subagents run in parallel, each in its own lane, each producing deliverables into the working tree. The main thread synthesizes (reconciles any overlapping claims, resolves conflicts, makes final judgment calls) in one pass at the end.

### Backend dev agent — code gap analysis + technical docs

Audit scope (six specific items, not open-ended):

1. **Skills tokens root cause.** Confirm why `tokens_per_call` is null for `enrich-row`, `loop`, `pulse-check` but populated for `superpowers:brainstorming`. Document the scanned-roots coverage precisely.
2. **HEAD request behavior.** Server currently returns `501 Unsupported method ('HEAD')`. Decide and implement: override `do_HEAD` to delegate to `do_GET` (standard Python idiom) or explicitly 405. Backend decides; one-line change either way.
3. **Scanner completeness.** Pick one real JSONL from `~/.claude/projects/`, compare every `message.usage` field to the corresponding DB row. Confirm nothing is silently dropped (e.g., cache-creation tiers, model name, tool names inside content blocks).
4. **Pricing freshness.** Check `pricing.json` contains current entries for Opus 4.7, Sonnet 4.6, Haiku 4.5. Flag any missing or stale rates.
5. **SQL injection surface.** Grep `token_dashboard/db.py` and `server.py` for any f-string-interpolated SQL. Everything must use `?` placeholders.
6. **Path-write safety.** Confirm no code path writes outside `~/.claude/` or the user-supplied `--db` / `--projects-dir` argument.

Deliverables:
- `docs/ARCHITECTURE.md` — data-flow doc (JSONL → scanner → SQLite → HTTP/SSE → vanilla-JS views). Short: 400–800 words, one diagram as ASCII or mermaid.
- `docs/CUSTOMIZING.md` — env vars (`PORT`, `HOST`, `CLAUDE_PROJECTS_DIR`, `TOKEN_DASHBOARD_DB`), `pricing.json` format, "how to add a new route" walkthrough.
- Rewritten `CLAUDE.md` — describes the codebase as it is, not as the original scaffold.
- A findings bundle (inline in this spec's sibling Implementation Plan, not a separate file) listing what the audit found, what was fixed inline, and what was deferred.

### QA agent — verification + integrity

Tasks:
- Spin up the dashboard and confirm every factual claim in the *proposed* new `README.md` matches runtime behavior. (Numbers, endpoint paths, env-var names, flag names.)
- Confirm `.gitignore` is fork-safe (no risk of a student committing their own `.claude/` transcripts, no risk of committing a local `*.db`).
- Confirm tests still pass after backend's code changes.
- Cross-check `pricing.json` against the `cost_usd` the overview returns for a known session (sanity check that backend's pricing update didn't break math).

Deliverables:
- `docs/VERIFICATION.md` — "what we checked, what passed, what failed." Short checklist format, readable in one scroll.
- `docs/KNOWN_LIMITATIONS.md` — aggregates every "cool but incomplete" behavior, Skills tokens chief among them. Wording target for the Skills entry:

> **Skills token counts are partial.** The Skills route shows every skill Claude Code invoked, how many times, across how many sessions, and when. The **tokens-per-call** column is populated only for skills whose `SKILL.md` lives under `~/.claude/skills/`, `~/.claude/scheduled-tasks/`, or `~/.claude/plugins/`. Skills registered elsewhere (project-local `.claude/skills/`, or invocations that go through the `Task` tool with a skill-shaped subagent_type) show invocation counts but leave the token column blank. It's still a useful view — you can see which skills dominate your session time — just don't expect a complete per-skill token cost. PRs to broaden the catalog scan welcome.

### Instructor agent — student-facing docs

Tasks:
- Rewrite `README.md` for beginners but unambiguous enough that Claude Code can execute the install directly from it. No "open Terminal.app" hand-holding; instead, self-contained command blocks and clear prerequisites in plain English.
- Produce a glossary so students can look up terms the dashboard uses without needing to read the source code.
- Produce a five-minute first-experience walkthrough so students know what to actually look at when they first open the UI.

Deliverables:
- New `README.md`. Must include: what the dashboard does in one paragraph, prerequisites (Python 3.8+, Claude Code installed with at least one session), `git clone` → `python3 cli.py dashboard` quickstart, what each of the 7 UI routes shows, a link to `docs/EXAMPLE_WALKTHROUGH.md`, a link to `docs/KNOWN_LIMITATIONS.md`, privacy note (100% local), license line.
- `docs/GLOSSARY.md` — definitions for: token, input token, output token, cache read, cache create, session, turn, project slug, subagent, tool call, skill, pricing plan (API/Pro/Max/Max-20x). Student-voiced, 1–3 sentences each.
- `docs/EXAMPLE_WALKTHROUGH.md` — "your first five minutes." Narrative tour: open the dashboard, glance at Overview to confirm numbers look sane, click into Prompts to find your top-3 most-expensive prompts, open Tips to see rule-based suggestions, look at Skills to see what you've been invoking, set your pricing plan in Settings. Intentionally opinionated about what to pay attention to.

### Synthesis pass (main thread)

After all three agents return:
1. Reconcile any overlapping claims. If backend says "the scanner covers N fields" and QA verified N–1, side with QA; fix the doc.
2. Cross-link the docs (every new doc has at least one link in/out of `README.md` and at least one link to/from the docs index section of the README).
3. Delete `docs/customizations.md`.
4. Add `LICENSE` (MIT, 2026, Nathan Herkelman).
5. Add `CONTRIBUTING.md` (short: how to run tests, how to open a PR, code style summary — a few hundred words max).
6. Update `.gitignore` with `.claude/`.
7. Run the verification checklist in §6 end-to-end.

## Final file layout

```
/
├── README.md                  (rewritten by Instructor)
├── LICENSE                    (new — MIT)
├── CONTRIBUTING.md            (new — main-thread synthesis)
├── CLAUDE.md                  (rewritten by Backend)
├── .gitignore                 (main-thread adds `.claude/`)
├── cli.py                     (unchanged)
├── pricing.json               (updated by Backend only if §4 finds stale entries)
├── token_dashboard/
│   ├── server.py              (Backend §2 patch: HEAD handling)
│   └── … (rest unchanged)
├── web/                       (unchanged)
├── tests/                     (unchanged; Backend may add one test for HEAD fix)
└── docs/
    ├── ARCHITECTURE.md             (new — Backend)
    ├── CUSTOMIZING.md              (new — Backend)
    ├── GLOSSARY.md                 (new — Instructor)
    ├── EXAMPLE_WALKTHROUGH.md      (new — Instructor)
    ├── VERIFICATION.md             (new — QA)
    ├── KNOWN_LIMITATIONS.md        (new — QA)
    ├── inspiration.md              (kept as-is — historical record)
    ├── customizations.md           (DELETED — superseded)
    └── superpowers/specs/2026-04-19-oss-release-design.md   (this file)
```

## Out of scope (explicit)

- Creating the GitHub repo, pushing, setting remote URL.
- GitHub Actions / CI.
- Issue and PR templates.
- Demo screenshots or GIFs in the README.
- A tagged v0.1.0 release.
- Rewriting the frontend.
- Adding new features (e.g., CSV export, session filtering).
- The `README.md:15` placeholder `<your-handle>` — `KNOWN_LIMITATIONS.md` flags it as a pre-publish TODO but the instructor leaves a visible placeholder for now.

## Verification

Definition of done for this pass:

1. `python3 -m unittest discover tests` → all tests green (66 before, possibly 67 if Backend adds a HEAD test).
2. `python3 cli.py dashboard --no-open` starts, prints the listening URL, responds 200 to `GET /` and all 7 `/api/*` endpoints with valid JSON.
3. `curl -I http://127.0.0.1:8080/` no longer returns 501 (either 200 per HEAD-as-GET or a clean 405, Backend's call — documented in `VERIFICATION.md`).
4. A fresh reader can open `README.md` and follow it end-to-end with no unexplained jargon. Terms used but not self-explanatory are linked to `GLOSSARY.md`.
5. Every new file is linked from at least one other file (no orphan docs).
6. `docs/customizations.md` no longer exists.
7. `.gitignore` contains `.claude/`.
8. `LICENSE` contains MIT text with year 2026 and owner Nathan Herkelman.
9. No internal markdown link in the repo is broken.
10. `git status` is clean of untracked garbage (no `.DS_Store`, no `__pycache__/`, no `*.db`).

## Open follow-ups (tracked here, not done this pass)

- Create public GitHub repo; swap `<your-handle>` placeholder in `README.md` for the real URL.
- GitHub Actions workflow: run `python3 -m unittest discover tests` on push and PR.
- Screenshot or GIF in the README.
- Broaden the Skills catalog scan to cover project-local `.claude/skills/` directories — closes the known limitation.
- Issue / PR templates.
