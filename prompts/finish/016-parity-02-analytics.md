# parity 02: /analytics, one page of live platform totals and growth

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

Competitor X's `/analytics` is the page partners and investors open first: total volume, agents, fees, compute used per day, a growth chart, and a footnote under every number saying how it was calculated. three.ws has more of this data than it does, but it is spread over seven endpoints and four pages, and nobody can see the whole platform in one place.

What exists (from a code read on 2026-09-30; re-verify in step 0):

| Source | Route | What it gives |
|---|---|---|
| `api/home-stats.js` | `/api/home-stats` | agents, on-chain agents, widgets, chains, attestations, forge models |
| `api/platform/stats.js` | `/api/platform/stats` | agents, views, chats, avatars, countries, widgets, chains |
| `api/pulse.js` `view=stats` | `/api/pulse?view=stats` | 24h tips, launches, trades, payments, marketplace, active wallets, 7-day series |
| `api/agent-economy/volume.js` | `/api/agent-economy/volume` | agent-to-agent hire volume, daily series, top providers |
| `api/marketplace/analytics.js` | `/api/marketplace/analytics` | skill sales, buyers, sellers, trial funnel, daily |
| `api/status.js` | `/api/status` | uptime and latency |

Tables for the rest: agents `agent_identities`; launches `pump_agent_mints` (plus `fixed_supply_launches`); 3D generations `forge_creations` (`status='done'`); LLM tokens `usage_events` where `kind='llm'` (`input_tokens`, `output_tokens`, indexed by `usage_events_llm_time`); x402 settlements `x402_self_facilitator_log` (`action='settle' and ok`), `x402_receipts`, `agent_hires`; marketplace `skill_purchases` (`status='confirmed'`). `/analytics` is free: no route, no page, no `data/pages.json` entry. Charts elsewhere are drawn on a native canvas with a screen-reader table (`drawVolumeChart()` in `src/agent-economy-volume.js`); `lightweight-charts` is installed but is for price charts.

## Step 0: re-derive the current state

    grep -n '"/analytics' vercel.json; ls pages/analytics.html 2>/dev/null
    for p in home-stats platform/stats "pulse?view=stats" agent-economy/volume marketplace/analytics; do printf "%s " $p; curl -s -o /dev/null -w "%{http_code}\n" "https://three.ws/api/$p"; done
    sed -n 150,310p src/agent-economy-volume.js
    grep -n "usage_events_llm_time\|create table.*usage_events" -r api/_lib/migrations | head

Load the `dataviz` skill before choosing chart colors and marks.

## Tasks

1. **One aggregate endpoint.** `GET /api/platform/analytics?window=30d|90d|all`: totals (agents, agents with a wallet, coins launched, 3D models generated, LLM tokens processed, x402 settlements count and USD, marketplace sales count and volume, agent-to-agent hire volume, creator fees earned once order 015's snapshot exists) and a daily series for each over the window. Each figure carries a `method` string. Reuse the queries the existing endpoints already run (import their helpers; do not fork SQL), add the missing ones against the tables above, cache in KV for 5 minutes and at the CDN (`public, s-maxage=300, stale-while-revalidate=600`). A failing sub-query yields `null` for that metric plus an `errors` entry, never a 500 for the page.
2. **The page.** `/analytics`, wired per the context file's five steps: a headline row of totals, a growth chart per metric (canvas pattern from `src/agent-economy-volume.js`, with the screen-reader table), the window switcher (URL-synced), "updated at" from the response, and a "How each number is calculated" section rendered from the `method` strings. States: skeletons, a metric-level "unavailable" tile, whole-page error with retry.
3. **Link it.** From the footer's Resources column, `/docs/start-here`, and `llms.txt` (`site.llms` "Economy and $THREE" group in `data/pages.json`). Nav entry at the advanced tier.
4. **Docs.** `docs/api-reference.md` entry for the endpoint; `STRUCTURE.md` row; changelog entry.

## Definition of done

- [ ] `curl -s localhost:3000/api/platform/analytics?window=30d` returns every metric above (or `null` with a named error) and a daily series, read from production data.
- [ ] No figure is a literal in the page code (`grep` proof).
- [ ] `/analytics` renders at 375, 768 and 1440 px in both themes, zero console errors, window switcher and every state exercised.
- [ ] Linked from the footer, `/docs/start-here` and `llms.txt` (`npm run build:pages` shows it in `public/llms.txt`).
- [ ] `npm test` passes for touched suites; `npm run audit:links` passes; docs, `STRUCTURE.md`, changelog updated.

## Never blocked

| Blocker | Resolution (act, do not ask) |
|---|---|
| A sub-query is slow on production volume | Pre-aggregate into a daily rollup table filled by a cron, and read the rollup; do not drop the metric. |
| Two tables disagree on a count (for example launches) | Use `pump_agent_mints` plus `fixed_supply_launches` as the launch source, and say so in `method`. |
| 015 not shipped | Omit creator fees with `method: "coming with per-agent earnings"`; add them when 015 lands. |

## Close out (required)

1. Verify every Definition of done line with the actual command output in front of you. Never claim a line you did not verify.
2. Commit with explicit paths and a subject that describes the diff (house style: `type(scope): what changed and why a reader cares`).
3. If every Definition of done line passes, delete this file in that same commit (`git rm prompts/finish/016-parity-02-analytics.md`) and append a dated entry to [_context/parity-PROGRESS.md](_context/parity-PROGRESS.md) with the commit SHAs. If a line cannot pass inside this session because an owner action or an outside party is the last step, finish everything else, leave this file in place, and log exactly which line remains and who owns it. Never delete this file on a partial.
4. Final report, in this order: what step 0 measured; what changed (file list with commit SHAs); evidence for each Definition of done line; the single batched owner message, if the order has a gate; one-line judgment calls. No trailing questions.
