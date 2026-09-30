# parity 14: pricing levers (API key tiers with enforced limits, a $THREE deposit bonus)

How to run: paste this file's repo path into a fresh Claude Code chat in this repository and say "run this work order". Band 900: prices and limits are owner decisions. Build both levers so each is a config change, with defaults that reproduce today's behaviour exactly, then ask.

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

Competitor X sells four API key tiers (free, builder, scale, enterprise) with rising monthly call allowances and falling swap fees, and gives a 3% credit bonus when a user deposits its own coin. Its own docs admit the call limits are recorded but never enforced. Two lessons: tiers give partners a clear paid path, and a tier that is not enforced is worse than none. Today three.ws has one flat limit on the versioned API (`apiV1`, 120 requests per minute per principal, `api/_lib/rate-limit.js`), account tiers for members (`api/_lib/account-tier.js`, pro, team, enterprise), and credit deposits in SOL or $THREE with no deposit bonus (`api/credits/deposit.js`); $THREE holders instead get up to 30% off spend.

## Step 0: re-derive the current state

    grep -n "apiV1" api/_lib/rate-limit.js api/_lib/agents-v1/http.js
    grep -n "ACCOUNT_TIERS" -A40 api/_lib/account-tier.js | head -60
    sed -n 1,80p api/credits/deposit.js
    grep -rn "api_keys" api/_lib/migrations/*.sql | head
    grep -n "discount\|holder" api/_lib/three-tier.js | head

## Tasks

1. **Key tiers, enforced.** A tier on each API key (default: the tier implied by the owner's account tier, so nothing changes for anyone today). A committed config maps tier to per-minute and per-month limits; `apiV1` reads the key's tier and applies both. Monthly usage is already metered into `usage_events` (kind `api`); the monthly check reads it with a cheap counter, and a 429 past the monthly cap says so (`reason: "monthly_quota"`) and names the reset date. Default config values must equal today's single limit so enabling the code changes no one's behaviour.
2. **Visibility.** Dashboard → Data API (or the API keys page) shows each key's tier, the month's usage against its cap, and the reset date. `docs/api-reference.md` rate-limit section documents tiers from the config (generated or read, never retyped).
3. **Deposit bonus lever.** A config value, `three_deposit_bonus_bps`, default `0`. When non-zero, a $THREE deposit credits `amount_usd * (1 + bps/10000)`, the ledger row records the bonus separately, and the credits page states the bonus. SOL deposits are unchanged.
4. **The owner message (the gate).** Propose concrete tiers (names, per-minute and monthly limits, prices, what each unlocks) and a bonus value, each with the reasoning and today's usage numbers from production (the distribution of monthly API calls per key, read from `usage_events`). Ask for a yes on each lever separately. On a yes, change only the config and commit.

## Definition of done

- [ ] With default config, every existing rate-limit test passes unchanged and a new test proves a key's limits equal today's.
- [ ] Tests prove: a key over its monthly cap gets 429 with `reason: "monthly_quota"`; a tier change takes effect on the next request; a $THREE deposit with `three_deposit_bonus_bps: 300` credits 3% more and records the bonus separately; with `0` it credits exactly as today.
- [ ] Usage and tier are visible to the key owner in the dashboard (browser-verified).
- [ ] Docs updated; the owner message carries the proposal with production usage numbers.

## Never blocked

| Blocker | Resolution (act, do not ask) |
|---|---|
| No monthly counter exists | Build it on the existing `usage_events` metering; do not add a second metering path. |
| The owner declines tiers | Leave the enforced mechanism in place at today's limits; it is still correct and documented. |

## Close out (required)

1. Verify every Definition of done line with the actual command output in front of you. Never claim a line you did not verify.
2. Commit with explicit paths and a subject that describes the diff (house style: `type(scope): what changed and why a reader cares`).
3. If every Definition of done line passes, delete this file in that same commit (`git rm prompts/finish/924-parity-14-pricing-levers.md`) and append a dated entry to [_context/parity-PROGRESS.md](_context/parity-PROGRESS.md) with the commit SHAs. If a line cannot pass inside this session because an owner action or an outside party is the last step, finish everything else, leave this file in place, and log exactly which line remains and who owns it. Never delete this file on a partial.
4. Final report, in this order: what step 0 measured; what changed (file list with commit SHAs); evidence for each Definition of done line; the single batched owner message, if the order has a gate; one-line judgment calls. No trailing questions.
