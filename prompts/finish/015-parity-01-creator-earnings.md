# parity 01: public per-agent creator earnings

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

Competitor X's strongest proof is one number per agent: creator fees earned, in SOL, on a public page, with the on-chain claims linked. It is the number a builder screenshots. three.ws launches agent coins on pump.fun (90 on mainnet by 2026-09-30) but shows no builder what their coin has earned, except inside the coin page's live pump.fun lookup, which is not stored, not aggregated per agent, and not on the agent's own page.

**Measured 2026-09-30 (read-only queries against production):**

| What | Value |
|---|---|
| `pump_agent_mints` on mainnet | 90 |
| `launcher_runs` | 20,722 `dry_run`, 197 `skipped`, 11 `failed`, 3 `pending`, 0 with a mint: the autonomous launcher has never launched live |
| `launcher_claims` rows | 0 |
| `agent_actions` rows of type `pumpfun.collect_creator_fee` | 1 (0.0706 SOL, 2026-07-26) |

Two defects in the claim pipeline, verified in code (re-verify in step 0):

1. `api/cron/launcher-claimer.js` posts `{ agentId, mint, network }` to `/api/pump/collect-creator-fee-agent`, whose zod schema (`collectFeeAgentSchema` in `api/pump/[action].js`) only knows `agent_id` / `avatar_id` and refines on them, so every automatic claim is a 400 recorded as `claim-failed`. Its test mocks `fetch` and misses it.
2. `api/_lib/launcher-engine.js` treats a launch as failed unless `launch.status === 200`, but `/api/pump/launch-agent` answers a success with 201. The first live autonomous launch would be recorded as `failed` with a null mint, and the claimer (which filters `status in ('confirmed','launched') and mint is not null`) would never claim it. Its tests mock 200.

Also: `launcher_claims` has no migration (it is created on the fly in two files), no index on `agent_id` or `mint`, and nothing reads it.

## Step 0: re-derive the current state

    grep -n "JSON.stringify({ agentId" api/cron/launcher-claimer.js
    grep -n "launch.status !== 200" api/_lib/launcher-engine.js
    grep -n "collectFeeAgentSchema" -A9 api/pump/\[action\].js
    grep -rn "earnings" api/agents api/pump --include=*.js | head
    sed -n 60,100p api/pump/launch-detail.js

Then re-run the measurement with a throwaway script in `scripts/.tmp-*.mjs` (read `DATABASE_URL` from `.env.local`, SELECT only, delete the script after): counts of `pump_agent_mints` by network, `launcher_runs` by status, `launcher_claims`, and `agent_actions` where `type='pumpfun.collect_creator_fee'`.

## Tasks

1. **Fix the two defects at root**, each with a test that fails before the fix against the real handler contract, not a mocked `fetch` that accepts anything: the claimer sends `agent_id`; the engine accepts any 2xx with a mint (201 included). Give `launcher_claims` a real migration (same columns, plus indexes on `agent_id` and `(mint, network)`) and remove the two on-the-fly `create table` blocks.
2. **Earnings data model.** A per-coin earnings snapshot table (migration), for example `agent_coin_earnings (mint, network, agent_id, creator, earned_lamports, claimed_lamports, unclaimed_lamports, source, refreshed_at)`, filled by a cron that walks `pump_agent_mints` (mainnet) and reads each coin's fee totals from the same pump.fun fee-sharing source `api/pump/launch-detail.js` already uses (reuse its client and circuit breaker; do not add a second one). Our own recorded claims (`launcher_claims`, `agent_actions` `pumpfun.collect_creator_fee`) join in as the list of claim transactions. Register the cron in `vercel.json` `crons` (it syncs to Cloud Scheduler); update the cron count in CLAUDE.md if `npm run check:claude` requires it.
3. **Public API.** `GET /api/agents/:id/earnings`: lifetime earned, claimed and unclaimed in SOL and USD (`solPriceUsd()` from `api/_lib/sol-price.js`), per-coin rows, recent claims with signatures and explorer links, `refreshed_at`, and a `method` string that says where the numbers come from. Public (earnings of a public agent are public on-chain anyway), cached (`public, max-age=60, s-maxage=120, stale-while-revalidate=300`), and it answers a clean empty state for an agent with no coins. Add the per-mint figure to `/api/pump/launch-detail` from the snapshot when present so the coin page stops hitting pump.fun on every view.
4. **Show it.** On the agent page (`/agents/:id`, `pages/avatar-page.html` + `src/avatar-page.js`) and the agent profile (`/agents/:id/profile`, `src/agent-detail.js`): an "Earned" card with the SOL total, USD beside it, the per-coin breakdown and the claims list, each claim linking to Solscan. On `/launches/:mint`, the same figures for that coin. Every state designed: loading skeleton, no coins ("launch a coin" link to `/launch`), coins but nothing earned yet, data stale (show `refreshed_at`), API error.
5. **Docs.** `docs/api-reference.md` (the endpoint, response shape, method), the MCP resource `three://agents/{agentId}/earnings` if the MCP resources list follows this pattern (check `api/_mcp/resources.js`), `STRUCTURE.md` row, changelog entry.

Do not extend automatic claiming to user-launched coins in this order: claiming signs with the agent's custodial wallet on the owner's behalf, which is a behaviour change for the owner to decide. Name it as a follow-up in the report.

## Definition of done

- [ ] Both defects fixed; each has a test that fails on the old code (show the red run) and passes now.
- [ ] `launcher_claims` has a migration with the two indexes; `npm run db:status` shows the new migrations and `npm run db:migrate` applied them (read `db:status` first).
- [ ] The snapshot cron runs once against production data and fills a row for every mainnet coin in `pump_agent_mints` or records why a coin was skipped.
- [ ] `curl -s localhost:3000/api/agents/<real agent id>/earnings` returns real figures for an agent that launched a coin, and a clean empty state for one that did not.
- [ ] The agent page, profile and coin page show the figures, browser-verified at 375, 768 and 1440 px, both themes, zero console errors, every state exercised.
- [ ] `npm test` passes for the touched suites; docs, `STRUCTURE.md` and changelog updated.

## Never blocked

| Blocker | Resolution (act, do not ask) |
|---|---|
| pump.fun's fee API is down or throttled | The circuit breaker in `launch-detail.js` already handles it; the snapshot keeps the last good value and the page shows `refreshed_at`. Never invent a figure. |
| A coin predates fee sharing and returns nothing | Record it with `source: 'unavailable'` and render "not reported" for that coin. |
| Devnet coins | Exclude them from earnings; say so in `method`. |

## Close out (required)

1. Verify every Definition of done line with the actual command output in front of you. Never claim a line you did not verify.
2. Commit with explicit paths and a subject that describes the diff (house style: `type(scope): what changed and why a reader cares`).
3. If every Definition of done line passes, delete this file in that same commit (`git rm prompts/finish/015-parity-01-creator-earnings.md`) and append a dated entry to [_context/parity-PROGRESS.md](_context/parity-PROGRESS.md) with the commit SHAs. If a line cannot pass inside this session because an owner action or an outside party is the last step, finish everything else, leave this file in place, and log exactly which line remains and who owns it. Never delete this file on a partial.
4. Final report, in this order: what step 0 measured; what changed (file list with commit SHAs); evidence for each Definition of done line; the single batched owner message, if the order has a gate; one-line judgment calls. No trailing questions.
