# parity: progress log

Cross-session handoff for the `parity-` orders ([parity-00-CONTEXT.md](parity-00-CONTEXT.md)). Append one dated entry per session: which order, what shipped (commit SHAs), what was measured, and anything the next session must know. Never edit an earlier entry.

## 2026-09-29: teardown and Tier 1

- Teardown written: `docs/research/competitor-teardown-2026-09.md` (`1cfce0cd1`).
- Tier 1 shipped locally, not pushed: `/connect` and `/docs/cli` (`1ee0a06c3`), official notice and curated `llms.txt` (`781090002`), `/skill.md` (`d8080afd2`), `three-ws create` / `launch` (`ec8dae368`), API reference error table and checklist (`a9380b9b2`).
- Found: the `three-ws` npm package was never published, so `npx three-ws setup` (named in every MCP 401 and in `/.well-known/mcp.json`) fails for everyone. Order 919.
- Corrected in the context file: the teardown called the $THREE burn policy contradictory. It is not. The platform never burns $THREE; the burn in `launcher-claimer.js` is each agent's own coin.
- Orders 015 to 022 and 919 to 925 written 2026-09-30.

## 2026-09-30: order 021, where every $100 goes (/three-token)

- Shipped: `05faebd92` (live wallets API `GET /api/three-token/wallets`, `src/three-token-fee-flow.js`, light theme for the page, tests) and the close-out commit that carries this entry (segment-label and stamp polish, light-theme state-kit tokens, API reference "$THREE Fee Flow API", thesis section 6 pointer, changelog).
- Measured in production: `treasury: null`, `rewards_wallet: null` on `/api/token/config`; neither `THREE_TREASURY_WALLET` nor `THREE_REWARDS_WALLET` exists on the Cloud Run service. 6 `POST /api/token/quote` answered 503 in the 7 days to 2026-09-30 and none succeeded (Cloud Run request log). The textPayload search for `treasury_unavailable` finds nothing because the quote handler returns that typed 503 without logging it; count refusals from the request log instead.
- Remaining owner action (not a line of the order): publish the two wallet addresses with `gcloud run services update three-ws-api --region us-central1 --update-env-vars THREE_TREASURY_WALLET=...,THREE_REWARDS_WALLET=...`. The page shows "not yet published" until then and fills itself in afterwards with no code change.
