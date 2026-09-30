# parity 07: "where every $100 goes" on /three-token, from the live split policies

How to run: paste this file's repo path into a fresh Claude Code chat in this repository and say "run this work order". Runnable now, no gate for the page. One measured production gap (below) needs an owner decision; it is batched into one message and does not block the page.

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

Competitor X's token page explains its economy in one picture: of every $100 of fees, how much goes to creators, to buybacks, to the treasury, to an ecosystem fund, with the public buyback wallet linked and a live tracker reading it. People trust what they can check. three.ws has a better-specified economy (it is in code: `SPLIT_POLICIES` in `api/_lib/token/config.js`, served publicly by `GET /api/token/config`) and never burns $THREE by design, but `/three-token` does not show where money goes.

**Policy facts (do not contradict them in copy):** the platform never burns $THREE; every split routes to the treasury (which funds buybacks), the holder rewards pool, and on a sale the seller. The "buyback and burn" mentioned in `api/cron/launcher-claimer.js` is about each agent's own coin via pump.fun's buyback vault, not $THREE. Users may burn their own $THREE with the `three_burn` MCP tool; that is theirs, not the platform's.

**Measured 2026-09-30:** `GET https://three.ws/api/token/config` returned `"treasury": null, "treasury_configured": false, "rewards_wallet": null, "rewards_configured": false`. `treasuryWallet()` fails closed with a 503 in production when `THREE_TREASURY_WALLET` is unset, so every $THREE-priced surface that splits to the treasury may be refusing payments. Re-measure in step 0.

## Step 0: re-derive the current state

    curl -s https://three.ws/api/token/config | python3 -m json.tool
    node scripts/read-service-env.mjs --names | grep -E "THREE_TREASURY_WALLET|THREE_REWARDS_WALLET|THREE_BUYBACK_ENABLED"
    grep -rn "treasuryWallet()" api --include=*.js | wc -l
    sed -n 1,60p src/three-token-page.js
    grep -n "stats\|buyback" api/three-token/\[action\].js | head -20
    gcloud logging read 'resource.type="cloud_run_revision" resource.labels.service_name="three-ws-api" textPayload:"treasury_unavailable"' --freshness=7d --limit=20 --format='value(timestamp,textPayload)'

Record whether the treasury and rewards wallets are configured, and how many `treasury_unavailable` refusals production logged in the last 7 days (that is the size of the live defect).

## Tasks

1. **The breakdown section on `/three-token`.** Render every split policy from `GET /api/token/config` as "of every $100 paid for <surface>": consumption (paid compute), marketplace sales, scarcity mints, spins, copy-trading performance fees, each as a stacked bar with dollar amounts and role labels (seller or creator, treasury, holder rewards). Name each surface in plain words (map policy keys to human labels in one place in the page code). No split number is typed into the page: all come from the API. State the no-burn policy in one sentence with a link to `docs/three-thesis.md` (published as `/docs/three-thesis` if routed; check).
2. **Where the money is.** Under the breakdown: the treasury and rewards wallet addresses from the config with copy buttons and Solscan links, their live $THREE and USDC balances (use the existing Solana RPC helpers), and the buyback history the page already shows (reuse, do not duplicate, its data). When a wallet is not configured, say so plainly ("not yet published") instead of hiding the row.
3. **Make it accessible.** The bars are an inline SVG or CSS with text equivalents; screen readers get the numbers, not just shapes. Loading skeletons and an error state if the config call fails.
4. **Docs.** `docs/three-thesis.md` gains a short "where every $100 goes" section pointing at the live page and the API (not retyping numbers). Changelog entry.
5. **The owner message.** Only if step 0 confirms the treasury or rewards wallet is unset: the count of refused payments from the logs, which surfaces are affected, and a request for the two wallet addresses. Setting them is a config-only update (`gcloud run services update three-ws-api --region us-central1 --update-env-vars THREE_TREASURY_WALLET=...,THREE_REWARDS_WALLET=...`), pre-approved as a command once the owner supplies the addresses; never pick an address yourself.

## Definition of done

- [ ] `/three-token` shows the per-$100 breakdown for every policy in `split_policies`, and adding a policy to `SPLIT_POLICIES` makes it appear with no page change (prove by a test or a local run with a temporary extra policy you then remove).
- [ ] `grep` shows no basis-point or percentage literal from `SPLIT_POLICIES` in the page code.
- [ ] Treasury and rewards rows render the configured address or an explicit "not yet published" state; balances come from real RPC reads.
- [ ] Browser-verified at 375, 768 and 1440 px in both themes, zero console errors, loading and error states exercised.
- [ ] Copy says the platform never burns $THREE and never says otherwise (`grep -i burn` over the diff, each hit justified in the report).
- [ ] If the wallets were unset, the owner message was sent with the refusal count.

## Never blocked

| Blocker | Resolution (act, do not ask) |
|---|---|
| Wallets unset in production | Build the "not yet published" state; the addresses go in the owner message. The page still ships. |
| `gcloud` re-auth needed for the log read | Report the refusal count as "not measured" and say why; it does not block the page. |
| RPC over quota | Use the existing failover chain (`rpc_lanes`); show "balance unavailable" per row, never a stale or invented number. |

## Close out (required)

1. Verify every Definition of done line with the actual command output in front of you. Never claim a line you did not verify.
2. Commit with explicit paths and a subject that describes the diff (house style: `type(scope): what changed and why a reader cares`).
3. If every Definition of done line passes, delete this file in that same commit (`git rm prompts/finish/021-parity-07-three-fee-flow.md`) and append a dated entry to [_context/parity-PROGRESS.md](_context/parity-PROGRESS.md) with the commit SHAs. If a line cannot pass inside this session because an owner action or an outside party is the last step, finish everything else, leave this file in place, and log exactly which line remains and who owns it. Never delete this file on a partial.
4. Final report, in this order: what step 0 measured; what changed (file list with commit SHAs); evidence for each Definition of done line; the single batched owner message, if the order has a gate; one-line judgment calls. No trailing questions.
