# parity 03: agents ranked by what they earned, on /leaderboard

How to run: paste this file's repo path into a fresh Claude Code chat in this repository and say "run this work order". Runnable after order 015 (per-agent earnings) has shipped; step 0 checks.

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

Competitor X's leaderboard ranks agents by what they earned and brings builders back to watch their rank. three.ws's `/leaderboard` (`pages/leaderboard.html` + `src/leaderboard.js`, data from `/api/sniper/leaderboard` via `getLeaderboard` in `api/_lib/trader-stats.js`) ranks trading agents only, by score, realized P&L, win rate or ROI. Nothing ranks agents by creator fees or service income. `/economy`'s "Agents earning" section ranks by rating and buyer count, not money.

Also found on 2026-09-30: two launch counts disagree. `api/leaderboard/unified.js` and `api/cron/leaderboard-rollup.js` count launches from `agent_identities.meta->'token'->>'mint'`, which agent-wallet launches leave empty (as `src/avatar-page.js` itself warns), while `daily-match` and `pulse` use `pump_agent_mints`. The `launches` board undercounts.

## Step 0: re-derive the current state

    ls prompts/finish/015-parity-01-creator-earnings.md 2>/dev/null && echo "015 still open: run it first"
    grep -rn "agent_coin_earnings\|/earnings" api/agents api/_lib --include=*.js | head
    sed -n 880,980p api/_lib/trader-stats.js
    grep -n "meta->'token'->>'mint'" api/leaderboard/unified.js api/cron/leaderboard-rollup.js
    grep -n "window\|sort" src/leaderboard.js | head -30

If 015 has not shipped, stop here, run 015, and come back: this board has no data without it.

## Tasks

1. **An "Earned" board.** A new tab on `/leaderboard` (the page keeps its trading boards): agents ranked by earnings in the selected window (24h, 7d, 30d, all), where earnings are creator fees (015's snapshot) plus service income (x402 skill sales and hires: `agent_revenue_events`, `agent_hires`), each column shown separately with the total. Row: rank, agent name and portrait linking to `/agents/:id`, total in SOL with USD, the split, and the agent's coin if any. Rank movement versus the previous window when the data supports it.
2. **API.** `GET /api/leaderboard/earnings?window=&limit=&offset=` with the same caching pattern as the sniper board (`public, max-age=10, s-maxage=20` or longer if the data refreshes slower), paginated, with a `method` string.
3. **Fix the launch count** in `unified.js` and `leaderboard-rollup.js` to count from `pump_agent_mints` (plus `fixed_supply_launches`), with a test that fails on the old query.
4. **Share and link.** The board's current window and tab live in the URL. Link the Earned tab from order 015's "Earned" card on agent pages ("#12 this week"). Add an OG image variant if `api/og-leaderboard.js` supports tabs.
5. **Docs.** API reference entry, `STRUCTURE.md` row update, changelog entry.

## Definition of done

- [ ] `/leaderboard` has an Earned tab showing real agents with real figures for each window, browser-verified at 375, 768 and 1440 px, both themes, zero console errors, empty window state designed.
- [ ] `GET /api/leaderboard/earnings` returns ranked rows whose totals equal the sum of their per-agent `/api/agents/:id/earnings` figures for the same window (a test or a scripted cross-check on real data).
- [ ] The launches count fix has a failing-then-passing test.
- [ ] `npm test` passes for touched suites; docs and changelog updated.

## Never blocked

| Blocker | Resolution (act, do not ask) |
|---|---|
| Few agents have earned anything | Ship the board with what exists and a strong empty-window state ("be the first: launch a coin" linking to `/launch`). Never pad with test agents. |
| Service income and creator fees are in different currencies | Convert both to SOL and USD at the price used for the window (`api/_lib/sol-price.js`) and state it in `method`. |

## Close out (required)

1. Verify every Definition of done line with the actual command output in front of you. Never claim a line you did not verify.
2. Commit with explicit paths and a subject that describes the diff (house style: `type(scope): what changed and why a reader cares`).
3. If every Definition of done line passes, delete this file in that same commit (`git rm prompts/finish/017-parity-03-earnings-leaderboard.md`) and append a dated entry to [_context/parity-PROGRESS.md](_context/parity-PROGRESS.md) with the commit SHAs. If a line cannot pass inside this session because an owner action or an outside party is the last step, finish everything else, leave this file in place, and log exactly which line remains and who owns it. Never delete this file on a partial.
4. Final report, in this order: what step 0 measured; what changed (file list with commit SHAs); evidence for each Definition of done line; the single batched owner message, if the order has a gate; one-line judgment calls. No trailing questions.
