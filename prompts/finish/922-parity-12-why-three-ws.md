# parity 12: a "Why three.ws" page built on live numbers

How to run: paste this file's repo path into a fresh Claude Code chat in this repository and say "run this work order". Band 900: a comparison that names other platforms needs the owner's yes before it is committed. Build the whole page without names first; the named comparison is the one gated step.

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

Competitor X's `/why-deploy` page answers "why build here and not elsewhere" with a flywheel diagram, live platform metrics, a builder-infrastructure grid and a comparison table against named rivals. It converts. It is also weak in exactly one place: its figures are typed into the copy, contradict its own analytics page, and cannot be checked. Ours must beat it on that axis: every number live, every claim linked to where a reader can verify it.

Depends on order 016 (`/analytics` and its API). If 016 has not shipped, build that data layer first as part of this order or stop and run 016.

## Step 0: re-derive the current state

    grep -n '"/why\|"/compare' vercel.json | head
    python3 -c "import json;d=json.load(open('data/pages.json'));print([p['path'] for s in d['sections'] for p in s['pages'] if p['path'] in ('/why','/why-three-ws','/compare','/analytics','/what-is')])"
    ls prompts/finish/016-parity-02-analytics.md 2>/dev/null && echo "016 still open"
    sed -n 1,80p docs/research/competitor-teardown-2026-09.md

`/compare` is taken by a coin-comparison tool; do not reuse it. Pick `/why-three-ws` unless step 0 shows it taken.

## Tasks

1. **Page, unnamed version.** `/why-three-ws`, wired per the context file's five steps. Sections, in order: a one-line promise; live proof (agents, launches, creator fees earned, x402 settlements, 3D models generated, each fetched from the 016 API with a "how it's calculated" line); what a builder gets (3D body, custodial Solana wallet, MCP and CLI access, x402 selling, coin launch, marketplace), each linking to the live surface that proves it; the loop (build, get found, earn, reinvest) drawn as an accessible inline SVG; and a comparison against **categories**, not names ("closed agent launchpads", "open-source agent frameworks", "token launchpads without agents"), where every cell is a fact about three.ws that links to its proof.
2. **States.** Skeletons while the API loads; if a metric fails, that tile says so and the rest of the page renders.
3. **Docs and index.** `data/pages.json` entry, `STRUCTURE.md` row, nav entry (advanced tier), changelog entry.
4. **The owner message (the gate).** Offer the named comparison as an optional table: for each platform proposed, the metric, its value, the public source URL and the date read. Every figure must come from a public source you fetched that day (DefiLlama, the platform's own docs); a figure you cannot source is left out. Ask for a yes on the names; on a yes, add the table in a follow-up commit.

## Definition of done

- [ ] `/why-three-ws` renders at 375, 768 and 1440 px in both themes with zero console errors, every metric fetched live (Network tab evidence in the report).
- [ ] No number on the page is a literal in the HTML or JS (`grep` proof in the report).
- [ ] Every claim links to a live page or API that proves it; `npm run audit:links` passes.
- [ ] Nothing committed names another platform unless the owner approved that name.
- [ ] Page index, `STRUCTURE.md`, nav and changelog updated; `npm run build:pages` clean.

## Never blocked

| Blocker | Resolution (act, do not ask) |
|---|---|
| 016 not shipped | Build its API as part of this order, or run 016 first. |
| A metric is zero or embarrassing | Show it honestly with context, or leave it off the page; never inflate or backfill. |
| No public source for a rival's figure | Leave that figure out of the proposal. |

## Close out (required)

1. Verify every Definition of done line with the actual command output in front of you. Never claim a line you did not verify.
2. Commit with explicit paths and a subject that describes the diff (house style: `type(scope): what changed and why a reader cares`).
3. If every Definition of done line passes, delete this file in that same commit (`git rm prompts/finish/922-parity-12-why-three-ws.md`) and append a dated entry to [_context/parity-PROGRESS.md](_context/parity-PROGRESS.md) with the commit SHAs. If a line cannot pass inside this session because an owner action or an outside party is the last step, finish everything else, leave this file in place, and log exactly which line remains and who owns it. Never delete this file on a partial.
4. Final report, in this order: what step 0 measured; what changed (file list with commit SHAs); evidence for each Definition of done line; the single batched owner message, if the order has a gate; one-line judgment calls. No trailing questions.
