# parity 05: /experiments, public write-ups of what we tried and what the numbers said

How to run: paste this file's repo path into a fresh Claude Code chat in this repository and say "run this work order". Runnable now, no gate.

## Operating clause (binding)

- Read CLAUDE.md first, then [_context/parity-00-CONTEXT.md](_context/parity-00-CONTEXT.md). CLAUDE.md overrides everything, including this file.
- Finish 100% in this session. Never end the turn with a question, an option list, or an unexecuted plan. A judgment call goes in one line of the final report; it never becomes a question that halts work.
- The only permitted stops are the CLAUDE.md stop-and-ask gates: spending real funds or any irreversible on-chain write, git push or a production deploy, committing content that names a crypto project other than $THREE, and destroying unrecoverable data. Where this order hits one, it says so, and you batch every such ask into ONE message after everything else is done.
- Never name Competitor X in anything you commit. If a reference is unavoidable, write "Competitor X".
- No mocks, no fake data, no placeholder stubs, no unfinished-work markers, no commented-out code. Real APIs and real integrations only.
- The em-dash and en-dash characters are banned in everything you write.
- Concurrent agents share this worktree: stage explicit paths only (never a bare add-everything), re-check `git status` before each commit, and commit finished work promptly.
- Before committing, run `npm run check:rules -- --paths <files you touched>`. It must exit 0.

## Why this matters

Competitor X publishes its internal experiments with the method, the money spent (often under a dollar), the results, and "the parts we got wrong", including one that ended a project. It is the most credible thing on its site because no marketing team would write it. Its own founder-allocation experiment (7,215 launches) found that 0.40% of builders ever earned $500 and 35.6% of tokens never traded once.

three.ws already runs experiments but only for trading: `/sniper/experiments` (`pages/sniper-experiments.html`, `src/sniper-experiments.js`, data from `GET /api/sniper/experiments`, one entry per armed `agent_sniper_strategies` row) and the long-form `blog/autonomous-trading-experiment.html` plus `docs/trading-experiment.md`. There is no general `/experiments` index and no standard write-up format. `/experiments` is free (no route, page or `data/pages.json` entry).

How content is published today: docs pages are `docs/<slug>.md`, served at `/docs/<slug>` by the SPA `docs/index.html` (it fetches `/docs/<slug>.md` and renders it with `marked`), listed in `docs/nav.json` and `data/pages.json`. Blog posts are hand-written `blog/<slug>.html` files indexed in `blog/index.html`; `scripts/inject-blog-seo.mjs` upserts them into `data/pages.json`.

## Step 0: re-derive the current state

    grep -n '"/experiments' vercel.json; ls pages/experiments.html 2>/dev/null
    curl -s "https://three.ws/api/sniper/experiments?network=mainnet&window=7d" | head -c 600; echo
    sed -n 1,60p docs/trading-experiment.md
    sed -n 1,40p docs/research/launchpad-landscape-2026-09.md

## Tasks

1. **The format.** `data/experiments.json`: one entry per experiment with `slug`, `title`, `question`, `published` (date), `spend_usd`, `status` (`running`, `concluded`, `killed`), `doc` (the write-up's docs slug), and optional `live_url` (for example `/sniper/experiments`). Write-ups are `docs/experiments-<slug>.md` following one template, in this order: The question; Method (data window, tables or tools, sample size); Spend; Result (the numbers, with the SELECT or script that produced them in a closing appendix so anyone can re-run it); What we got wrong; What we changed because of it. A small validator (in `scripts/build-page-index.mjs` or its own script run by `build:pages`) fails the build on a missing field or a `doc` that does not exist.
2. **The index page.** `/experiments`, wired per the context file: cards from `data/experiments.json` with the question, status, spend and date, newest first, filter by status; each opens its write-up at `/docs/experiments-<slug>`. Empty and error states designed.
3. **Two first write-ups, from real data measured this session:**
   - **The agent-to-launch funnel.** How many agents were created in the last 30 days, by how many users, and how many launched a coin (`agent_identities`, `pump_agent_mints`); how many token plans were saved; the landscape doc measured 788 agents and 3 launches in the 30 days to 2026-09-28. Re-measure; report what the numbers say and what we changed or will change.
   - **The trading experiment.** Index the existing one (link `/sniper/experiments` as `live_url`, its doc and blog post), writing only the template sections it lacks.
   Every number is measured this session by a SELECT-only script whose SQL goes into the appendix. Nothing is estimated or rounded to flatter.
4. **Link and document.** Footer Resources, `/docs/start-here`, `docs/nav.json` group, `data/pages.json` entries (index and each write-up), `STRUCTURE.md` row, changelog entry per published write-up. A short `docs/experiments.md` (or a section of the index doc) says how to add one.

## Definition of done

- [ ] `/experiments` lists both experiments from `data/experiments.json`, each opening a write-up with all six template sections.
- [ ] The validator fails the build on a missing field (shown by a red run on a temporary bad entry you then remove).
- [ ] Every number in the write-ups has its query in the appendix, and re-running the queries reproduces them (evidence in the report).
- [ ] Browser-verified at 375, 768 and 1440 px, both themes, zero console errors; `npm run audit:docs` and `npm run audit:links` pass.
- [ ] Page index, nav, `STRUCTURE.md` and changelog updated.

## Never blocked

| Blocker | Resolution (act, do not ask) |
|---|---|
| A finding is unflattering | Publish it. That is the point of the section. State what we changed. |
| A number cannot be measured (table missing, access denied) | Say "not measured" and why; never substitute an estimate. |

## Close out (required)

1. Verify every Definition of done line with the actual command output in front of you. Never claim a line you did not verify.
2. Commit with explicit paths and a subject that describes the diff (house style: `type(scope): what changed and why a reader cares`).
3. If every Definition of done line passes, delete this file in that same commit (`git rm prompts/finish/019-parity-05-experiments.md`) and append a dated entry to [_context/parity-PROGRESS.md](_context/parity-PROGRESS.md) with the commit SHAs. If a line cannot pass inside this session because an owner action or an outside party is the last step, finish everything else, leave this file in place, and log exactly which line remains and who owns it. Never delete this file on a partial.
4. Final report, in this order: what step 0 measured; what changed (file list with commit SHAs); evidence for each Definition of done line; the single batched owner message, if the order has a gate; one-line judgment calls. No trailing questions.
