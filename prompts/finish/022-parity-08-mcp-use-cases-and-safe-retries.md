# parity 08: MCP docs as tool-call sequences, and a paid call that never tells a buyer to pay twice

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

Two patterns from Competitor X's developer docs that we lack:

1. **Use cases written as the tool calls an agent makes, in order** ("Launch a token: check readiness, launch, get the page URL"). An agent learns a workflow faster from the call sequence than from a tool list. `docs/mcp.md` has no use-case section (its nearest is "Example Claude workflow"), although `api/_mcp/prompts.js` already encodes 17 guided workflows (`get-started`, `create-agent`, `setup-wallet`, `trade`, `launch-token`, `hire-agent`, `sell-a-skill`, `review-costs`, `setup-automations`, `setup-dca`, `explore-marketplace`, `explore-x402`, `earn-yield`, `perps`, `predictions`, `embed-avatar`, `generate-3d`).
2. **Errors after payment that say the buyer is safe to retry.** Their paid launch returns `retrySafe: true` on any failure after payment and makes the retry idempotent on the payment proof.

What happens on our x402 v2 stack today (`paidEndpoint` in `api/_lib/x402-paid-endpoint.js`, from a code read on 2026-09-30; re-verify):

- Default mode runs the handler before settling, so a handler failure charges nothing. Good.
- **Streaming mode settles first**, and the spent-payment claim runs inside `settleAndBuildResponse`. If the handler then throws, the buyer gets a generic 500 that does not say they paid, and retrying with the same payment header gets 409 `payment_replayed` telling them to pay again. They were charged and got nothing.
- If settle succeeds and the SIWX grant write fails, the answer is 502 `siwx_record_failed`, which also does not say the buyer paid.
- The payment-identifier idempotency hash (`api/_lib/x402/payment-identifier-server.js`) hashes `body: null` because a comment assumes paid routes are GET-only, yet POST paid routes exist (`api/x402/service.js` and others), so two different POST bodies under one payment identifier can collide.
- `retry_safe` / `retrySafe` appears nowhere in `api/x402` or `api/_lib/x402*`.

## Step 0: re-derive the current state

    grep -rn "retry_safe\|retrySafe" api/x402 api/_lib/x402* api/_lib/x402 | head
    grep -n "settleAndBuildResponse\|siwx_record_failed\|payment_replayed\|stream" api/_lib/x402-paid-endpoint.js | head -30
    grep -n "body: null\|GET-only" api/_lib/x402/payment-identifier-server.js api/_lib/x402-paid-endpoint.js
    grep -rln "paidEndpoint(" api/x402 | xargs grep -ln "method.*POST\|methods.*POST" | head
    grep -n "^## " docs/mcp.md

## Tasks

1. **Never ask a paid buyer to pay twice.** In streaming mode, when the handler fails after settlement, record the failure against the spent payment and let the same payment header re-run the handler (once, or a small bounded number of times within a window) instead of answering `payment_replayed`. The error response for any failure after settlement carries `paid: true`, `retry_safe: true`, the settlement transaction and a plain sentence ("You were charged; repeat this exact request with the same payment to get your result"). Apply the same fields to `siwx_record_failed`. Tests: a streaming handler that throws once then succeeds is retried with the same payment and returns the result without a second charge; a completed call replayed still returns 409 as today.
2. **Hash POST bodies.** Include the request body in the payment-identifier idempotency hash for non-GET routes, fix the misleading comment, and test that two different bodies under one identifier do not share a cached response.
3. **Document it.** `docs/x402.md` and the API reference's error table (`retry_safe`, `paid`) say what a buyer's client should do.
4. **Use cases in `docs/mcp.md`.** A "Use cases" section: for each guided prompt in `api/_mcp/prompts.js`, the goal in one line and the ordered tool and resource calls the prompt drives, using the real tool names (derive them from the prompt definitions, not from memory). Mark each step that spends money. Add a check (a test or an extension of an existing MCP audit) that fails when a tool named in the section no longer exists, so the section cannot drift.

## Definition of done

- [ ] The streaming retry test and the replay test pass; a failure after settlement returns `paid: true` and `retry_safe: true` (test).
- [ ] The POST-body idempotency test passes.
- [ ] `docs/mcp.md` has a "Use cases" section covering every prompt, and the drift check fails when a named tool is removed (shown by a red run you then revert).
- [ ] `npm test` passes for the touched suites; `npm run audit:docs` passes; changelog entry added.

## Never blocked

| Blocker | Resolution (act, do not ask) |
|---|---|
| A route relies on the old replay behaviour | Keep 409 for completed calls; only failed-after-settle calls become retryable. Cover the route with a test. |
| The settle sponsor is dry in production | Irrelevant to this order: everything here is proven under test. |

## Close out (required)

1. Verify every Definition of done line with the actual command output in front of you. Never claim a line you did not verify.
2. Commit with explicit paths and a subject that describes the diff (house style: `type(scope): what changed and why a reader cares`).
3. If every Definition of done line passes, delete this file in that same commit (`git rm prompts/finish/022-parity-08-mcp-use-cases-and-safe-retries.md`) and append a dated entry to [_context/parity-PROGRESS.md](_context/parity-PROGRESS.md) with the commit SHAs. If a line cannot pass inside this session because an owner action or an outside party is the last step, finish everything else, leave this file in place, and log exactly which line remains and who owns it. Never delete this file on a partial.
4. Final report, in this order: what step 0 measured; what changed (file list with commit SHAs); evidence for each Definition of done line; the single batched owner message, if the order has a gate; one-line judgment calls. No trailing questions.
