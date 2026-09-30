# parity 13: a tokenized builder competition page

How to run: paste this file's repo path into a fresh Claude Code chat in this repository and say "run this work order". Band 900: prize money, dates, judges and tracks are owner decisions, and announcing is posting. Build the machinery so the owner's decision is a config change, not a project.

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

Competitor X ran a six-week builder competition on Solana whose entry rule was "build an agent, then launch its token on our platform by the deadline". Its own analytics page reports 195 tokenized entries and about $44.65M of trading volume in that window. The format turns a hackathon into platform launches, and its live leaderboard of entries by fees earned is the retention loop. three.ws has the pieces (agents, launches, earnings once order 015 ships) but no competition surface. `/arena` and tournaments are trading PvP, not this.

## Step 0: re-derive the current state

    grep -n '"/compete\|"/competition\|"/hackathon\|"/build-off' vercel.json | head
    ls api/_lib/migrations | tail -5
    ls prompts/finish/015-parity-01-creator-earnings.md 2>/dev/null && echo "015 still open"
    grep -rln "tournament" api/_lib/migrations | head -3

## Tasks

1. **Config, not code, for the decisions.** One committed file, `data/competitions.json`, holding zero or more competitions: `slug`, `title`, `starts_at`, `ends_at`, `register_by`, `tokenize_by`, `tracks` (name, description), `prizes` (amount, asset, vesting text), `judges`, `rules`. It ships EMPTY (an empty array). The page and API render nothing but an honest "no competition is running" state until the owner adds one.
2. **Registration.** A migration for `competition_entries` (competition slug, user id, agent id, team name, X handle, created_at, unique per agent per competition), an authenticated `POST /api/competitions/:slug/entries` that checks the window and that the agent belongs to the caller, and `GET` for the public entry list.
3. **Tokenized entries.** An entry is "tokenized" when its agent launched a coin through three.ws inside the window (from `pump_agent_mints`). Show each entry's coin, its creator fees earned (order 015's data) and 24h volume where available.
4. **Page.** `/compete/:slug` plus `/compete` (index), wired per the context file: hero with the countdown to the next deadline, tracks, prizes, rules, the register form, and the live leaderboard of entries by fees earned with the method stated under it. Every state designed: before registration opens, open, closed, ended with winners.
5. **Docs.** `docs/competitions.md` on how an owner runs one (edit `data/competitions.json`, deploy), `STRUCTURE.md` row, changelog entry when the first competition goes live.
6. **The owner message (the gate).** Ask for the competition's parameters (dates, tracks, prize pool and funding source, judges, eligibility) in one message, with a filled-in example config they can edit. Prize payouts are spends: they go through the spend gate when paid.

## Definition of done

- [ ] With `data/competitions.json` empty, `/compete` renders a clear "no competition running" state and the API returns an empty list (tests prove both).
- [ ] With a competition fixture, registration enforces the window and agent ownership (tests), and the leaderboard orders tokenized entries by fees earned from real tables.
- [ ] The migration applies cleanly (`npm run db:status` shows it pending, then applied); `npm test` passes for the touched suites.
- [ ] The page renders at 375, 768 and 1440 px in both themes with zero console errors.
- [ ] Docs, page index, `STRUCTURE.md` updated; the owner message was sent with an example config.

## Never blocked

| Blocker | Resolution (act, do not ask) |
|---|---|
| 015 (earnings) not shipped | Rank by volume from `pump_agent_mints`-linked launch data meanwhile, and switch to fees earned when 015 lands; say which in the method line. |
| No decisions from the owner | Ship with the empty config. That is a complete, correct state. |

## Close out (required)

1. Verify every Definition of done line with the actual command output in front of you. Never claim a line you did not verify.
2. Commit with explicit paths and a subject that describes the diff (house style: `type(scope): what changed and why a reader cares`).
3. If every Definition of done line passes, delete this file in that same commit (`git rm prompts/finish/923-parity-13-builder-competition.md`) and append a dated entry to [_context/parity-PROGRESS.md](_context/parity-PROGRESS.md) with the commit SHAs. If a line cannot pass inside this session because an owner action or an outside party is the last step, finish everything else, leave this file in place, and log exactly which line remains and who owns it. Never delete this file on a partial.
4. Final report, in this order: what step 0 measured; what changed (file list with commit SHAs); evidence for each Definition of done line; the single batched owner message, if the order has a gate; one-line judgment calls. No trailing questions.
