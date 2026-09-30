# parity 04: sell a whole agent as a paid x402 API

How to run: paste this file's repo path into a fresh Claude Code chat in this repository and say "run this work order". Runnable now. The one real paid call at the end spends real USDC, so it is the single gated step.

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

Competitor X's "x402 cloud": an owner flips "service active", sets a USD price per request, and gets a stable public endpoint; a buyer POSTs, gets a 402, pays in SOL or USDC on Solana, and the agent runs only after settlement. three.ws sells individual skills, not the agent, and the skill flow does not work end to end.

**Measured 2026-09-30 (production, read-only):**

| What | Value |
|---|---|
| Active rows in `agent_skill_prices` | 376 |
| Rows in `agent_revenue_events` (every sale ever) | 0 |
| Rows in `agent_paid_services` | 0 |
| `agent_payment_intents_status_check` | `CHECK (status IN ('pending','paid','expired','failed'))` |

`consumeIntent` in `api/_lib/x402.js` sets `status='consumed'`, which that constraint rejects, so the legacy per-skill invoke (`api/agents/x402/[action].js`) fails with a database error AFTER the buyer paid. Other defects in that legacy flow (from a code read): `pay-prep` / `pay-confirm` are session-only, so an autonomous agent cannot buy; `verifyPaid` does not check that the intent's payer is the caller; `emit402` and the manifest can name different recipients; and `emit402` links a manifest path (`/api/agents/:id/x402/:skill/manifest`) that has no route.

The standard x402 v2 stack is healthy and is what to build on: `paidEndpoint` in `api/_lib/x402-paid-endpoint.js` (networks default `['solana','base']`, Solana first), `send402` / `verifyPayment` / `settlePayment` in `api/_lib/x402-spec.js`, spent-payment guards in `api/_lib/x402/spent-payments.js`. The closest pattern to copy is `api/x402/skill-call.js`: a per-request `paidEndpoint` with a `payTo` override and an `onSettled` hook for revenue. One agent turn server-side: `api/agents/talk.js` (non-streaming, persona from `meta.brain`, returns `{response, model, usage}`); `sendMessage` in `api/_lib/agents-v1/messages.js` has the full tool loop and billing but no route.

## Step 0: re-derive the current state

    grep -n "consumed" api/_lib/x402.js
    grep -rn "agent_payment_intents_status_check\|agent_payment_intents" api/_lib/migrations/*.sql | head
    sed -n 150,270p api/x402/skill-call.js
    sed -n 90,200p api/agents/talk.js
    grep -n "resolvePayoutAddress" -A20 api/_lib/payout.js | head -30

Re-run the four production counts above with a SELECT-only throwaway script in `scripts/.tmp-*.mjs` (`DATABASE_URL` from `.env.local`; delete it after).

## Tasks

1. **Stop the legacy flow failing after payment.** A migration that widens `agent_payment_intents_status_check` to include `consumed`, with a test that runs `consumeIntent` against the real constraint definition. Fix the dead manifest link in `emit402`. Make `emit402` and the manifest resolve the recipient the same way. Bind an intent to its payer in `verifyPaid`. Each fix has a test that fails on the old code.
2. **The agent endpoint.** `POST /api/x402/agents/:agentId` (and a slug alias if agents have slugs): a per-request `paidEndpoint` priced from the agent's service config, `payTo` the agent's payout address (`resolvePayoutAddress`, Solana USDC first), handler runs one turn (extract the core of `api/agents/talk.js` into a shared function both use, rather than copying it), default mode (handler before settle, so a failed turn is never charged), and `onSettled` writes `agent_revenue_events` net of `PLATFORM_FEE_BPS` (`api/_lib/fee.js`). Body `{ "message": "...", "history": [] }` capped in size; response `{ "reply", "model", "usage" }`. Only public agents whose `embed_policy` allows it can be sold.
3. **Owner switch.** On the agent wallet's Earn tab (`src/agent-wallet-hub/tabs/earn.js` via `src/agent-economy-hub.js`): "Sell this agent as an API" toggle, price per call in USD, a short public description, then the stable endpoint URL with copy buttons, a ready `curl` showing the 402, and earnings from `agent_revenue_events`. Store the config on the agent (for example `meta.api_service = { active, price_usd, description }`), validated server-side.
4. **Discovery.** List active agent services in `/.well-known/x402.json` (it is generated; find its builder) and in the x402 catalog page, each with price, network and input schema.
5. **Docs.** `docs/x402.md` section "Sell your agent as an API" with the buyer's flow and a runnable `curl`; `docs/api-reference.md`; changelog entry.
6. **The one gated step.** Prove a real paid call on mainnet: the owner message names the agent, the price (keep it at the minimum the facilitator accepts), the payer wallet and the recipient, and asks for a yes. Everything else is proven without spending: the unpaid 402 on production shape, a verify against a malformed payment, and the handler path under test.

## Definition of done

- [ ] The constraint migration is applied (`npm run db:status` then `npm run db:migrate`); a test proves `consumeIntent` succeeds against it.
- [ ] Each legacy defect listed in task 1 has a failing-then-passing test.
- [ ] `curl -i -X POST localhost:3000/api/x402/agents/<active agent id> -d '{"message":"hi"}'` returns 402 with Solana USDC first in `accepts`, the agent's payout address as `payTo`, and the configured price.
- [ ] The owner toggle, price, endpoint and earnings render on the Earn tab, browser-verified at 375, 768 and 1440 px, both themes, zero console errors.
- [ ] Active services appear in `/.well-known/x402.json` (`npm run audit:x402-catalog` passes).
- [ ] Docs and changelog updated; the owner message for the one real paid call was sent (or the call was made on the owner's yes, with its signature in the report).

## Never blocked

| Blocker | Resolution (act, do not ask) |
|---|---|
| The agent has no payout address | Fall back exactly as `resolvePayoutAddress` does (the agent's own wallet); refuse to activate a service with no Solana address and say why in the UI. |
| The facilitator is down or the settle sponsor is dry (`x402_settle` in `/api/healthz`) | Run the `x402-economy-triage` subagent; ship the code; the live paid proof waits in the owner message. |
| LLM credits or provider errors in the turn | The turn fails before settlement, so the buyer is not charged; surface the error and test that no settlement happened. |

## Close out (required)

1. Verify every Definition of done line with the actual command output in front of you. Never claim a line you did not verify.
2. Commit with explicit paths and a subject that describes the diff (house style: `type(scope): what changed and why a reader cares`).
3. If every Definition of done line passes, delete this file in that same commit (`git rm prompts/finish/018-parity-04-agent-as-paid-api.md`) and append a dated entry to [_context/parity-PROGRESS.md](_context/parity-PROGRESS.md) with the commit SHAs. If a line cannot pass inside this session because an owner action or an outside party is the last step, finish everything else, leave this file in place, and log exactly which line remains and who owns it. Never delete this file on a partial.
4. Final report, in this order: what step 0 measured; what changed (file list with commit SHAs); evidence for each Definition of done line; the single batched owner message, if the order has a gate; one-line judgment calls. No trailing questions.
