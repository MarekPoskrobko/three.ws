# Launchpad landscape, September 2026: where three.ws can improve

Research date: 2026-09-28. Competitor facts come from live sources (DefiLlama API, official docs, crypto press) pulled that day; every claim links its source in the tables below, and anything that could not be confirmed is marked UNVERIFIED. Our own numbers come from the production database and the Cloud Run service config, read the same day.

## Bottom line

1. **Our problem is conversion, not reach.** 788 agents were created in the last 30 days and 3 coins were launched. The token plan, built to bridge that gap, has never been saved once.
2. **The two strongest 2026 plays are already built in our repo and switched off.** The native Meteora lane already prices every agent coin in $THREE on mainnet (the pattern that took StonkFun to $24M in 30-day revenue), and the $THREE buyback engine has run 82,208 times since June 19 and skipped every time because `THREE_BUYBACK_ENABLED` is not set.
3. **The native lane needs one change before it goes live: anti-sniper protection.** Its fee schedule is flat today. Every serious launchpad ships a 99% fee that decays over seconds, and a Meteora partner config is fixed once created on-chain, so this has to land before the mainnet config is made.
4. **Nobody in the market ties agent tokens to real revenue.** Across Virtuals agents, economic output and token value correlate at r = -0.004. We have x402 per-call revenue, custodial agent wallets and 3D embodiment, which is the stack to close that gap and show it.
5. **Robinhood Chain: fix our screener, don't build a launchpad there.** `/markets/robinhood` indexes NOXA (halted July 11) and The Odyssey (now redirects to Robinpad) and misses Pons V2, which earned $14.3M of the chain's launchpad fees in the last 7 days.

## Our own numbers

Production database, 2026-09-28.

| Funnel stage, last 30 days | Count |
|---|---|
| Avatars created (34,234 from Avatar Studio, 9,961 from forge; roughly one per owner, so largely guest sessions) | 44,529 |
| Selfie reconstructions | 164 |
| Agents created | 788, by 452 users |
| Coins launched through three.ws | 3 |
| Token plans saved (all time) | 0 |

All-time launches: 90 mainnet coins from 58 creators and 65 agents since 2026-05-13. By month: May 26, June 7, July 47, August 7, September 3 (last one on 2026-09-17). The native Meteora lane and the anonymous x402 launch door have 0 launches each.

Switched-off infrastructure, confirmed on the production service:

| Built | State in production | Evidence |
|---|---|---|
| Native Meteora launch lane, $THREE-quoted on mainnet | Hidden: no `NATIVE_LAUNCH_CONFIG_KEY` | `quoteMintFor()` in `api/_lib/native-launch/config.js` returns the $THREE mint for mainnet |
| $THREE buyback (`run-three-buyback` cron, `api/_lib/token/buyback.js`) | Off: `THREE_BUYBACK_ENABLED` unset | 82,208 runs in `three_buyback_runs`, all `skipped / disabled`; max revenue seen 0 |
| Fee Bridge (creator fees to an X handle in USDC, 20% buys $THREE) | Held by owner since 2026-09-17 | `FEE_BRIDGE_ENABLED` unset, page unrouted |
| pump.fun agent-payments (`handlePay` `create` in `api/agents/pumpfun/[action].js`) | Likely broken for new mints | pump.fun stopped new tokenized-agent launches on 2026-07-02; `pump_buyback_runs` shows 201,339 skipped runs |

## The market in September 2026

### Solana launchpads by 30-day protocol revenue

Source: [DefiLlama Solana fees/revenue API](https://api.llama.fi/overview/fees/solana?dataType=dailyRevenue), pulled 2026-09-28.

| Launchpad | 30d revenue | Model in one line |
|---|---|---|
| pump.fun + PumpSwap | $32.4M + $13.1M | 1.25% curve fee (0.30% creator), graduates at ~85 SOL; 50% of revenue buys and burns PUMP ([fees](https://pump.fun/docs/fees), [PUMP](https://pump.fun/pump-token)) |
| StonkFun (launched 2026-08-03) | $24.3M | Coins priced against tokenized stocks, ETFs or crypto; ~60% of revenue buys and burns STONK ([Datawallet](https://www.datawallet.com/crypto/stonk-fun-explained)) |
| BONK.fun + Graphite | $4.4M + $2.9M | 58% of fees buy BONK; fell from 55% launch share (July 2025) to ~3% ([CoinDesk](https://www.coindesk.com/markets/2025/07/08/bonkfun-grabs-55-of-solana-token-issuance-share-pushes-bonk-demand)) |
| Raydium LaunchLab (infra under Bonk, StonkFun) | $1.8M | LP locked and burned at graduation since 2026-08-17 ([Solana Compass](https://solanacompass.com/news/raydium-launchlab-mandates-cpmm-only-graduation-and-locks-creator-lp-at-token-migration)) |
| Meteora DBC (protocol cut only) | $0.24M | The curve our native lane runs on; 20% protocol, 80% partner ([docs](https://docs.meteora.ag/protocol/protocol-revenues)) |
| Jupiter Studio, Bags, Moonshot | $0.06-0.2M each | Jupiter: 99% anti-sniper fee decaying over 15-60s ([CryptoSlate](https://cryptoslate.com/launchpads/jupiter-studio-review/)); Bags: 1% perpetual creator royalty split up to 100 ways |
| Believe, Heaven | ~$0 | Believe: class action, founder arrested ([The Block](https://www.theblock.co/post/398532/believe-founder-arrested-strangulation)) |

### AI-agent and creator launchpads

| Platform | What matters for us |
|---|---|
| Virtuals (Base, Solana since 2026-08-24) | Agent commerce protocol (ACP) with escrow and x402; anti-sniper tax 99% to 1% over a founder-chosen window; "60 Days" reversible launch that refunds holders if the founder walks ([whitepaper](https://whitepaper.virtuals.io/about-virtuals/capital-formation-layer/virtuals-launch-mechanics), [Coinspeaker](https://www.coinspeaker.com/virtuals-protocol-debuts-60-day-trial-for-founders-virtual-shows-signs-of-life/)) |
| Holoworld / HoloLaunch (Solana) | Closest to us: no-code agent with 3D avatar; users burn $AVA for compute credits with a 10% bonus; staking points into launch raffles. Deployer-linked wallets sniped ~40% of AVA at launch ([docs](https://docs.holoworld.com/holoworld/agent-market/credits-system), [Lookonchain](https://lookonchain.com/feeds/41096)) |
| pump.fun tokenized agents | Revenue-to-buyback for agent coins; killed for new launches 2026-07-02 for "unnecessary PVP" and fragmenting attention ([CoinSpot](https://coinspot.io/en/analysis/pump-fun-abandons-tokenized-agent-mode/)) |
| ai16z / ELIZAOS, Believe | Dead. Both sued over promised buybacks and insider allocation ([CoinDesk](https://www.coindesk.com/markets/2026/08/05/ai-agent-token-once-worth-usd2-4-billion-ends-with-founder-calling-it-dead)) |
| Zora creator coins (Base) | Coins per day fell from 118,069 to 852; no revenue or IP rights behind them ([BeInCrypto](https://beincrypto.com/jesse-pollak-base-zora-social-bet/)) |
| UsePaid (Solana, 2026-09-15) | Same design as our held Fee Bridge: 80% of pump.fun creator fees to an X handle, 20% buys its own coin. $1.44M paid out, plus backlash over paying people who never opted in ([Hokanews](https://www.hokanews.com/2026/09/usepaid-routes-memecoin-trading-fees-to.html)) |
| Clawnch (Base) | Only verified agents can launch; spend caps enforced on-chain ([MetaMask](https://metamask.io/news/clawnch-ai-agent-launchpad-delegation)) |

Category context: AI-agent token market cap peaked at $20.2B in January 2025 and sits around $4B today ([CoinGecko](https://www.coingecko.com/en/categories/ai-agents)). What survived was real commerce (Virtuals ACP) and perpetual creator royalties (Bags), not "a chatbot with a ticker."

### Robinhood Chain

| Launchpad | Status | 7d fees |
|---|---|---|
| Pons V2 | Leader; ETH bonding curve into a locked Uniswap v4 pool, 99% snipe tax decaying over ~5s ([datawallet](https://www.datawallet.com/crypto/pons-explained)) | $14.34M |
| Pools.trade (Uniswap Labs) | No launchpad fee, locked v4 liquidity, distribution in the Uniswap app and API ([Uniswap blog](https://blog.uniswap.org/pools-trade-a-new-way-to-launch-on-robinhood-chain)) | $124k |
| NOXA | Halted new launches 2026-07-11; old pools still earn ([CoinDesk](https://www.coindesk.com/business/2026/07/15/the-launchpad-that-fueled-robinhood-chain-s-memecoin-boom-just-gave-away-all-its-revenue)) | $239k |
| The Odyssey | Domain now redirects to Robinpad (instant v3 pools, no curve) ([docs](https://robinpad.app/docs)) | not listed |

Chain daily fees fell from ~$31.3M (Sep 4) to ~$3.8M (Sep 28), and the Robinhood Wallet gas subsidy ends 2026-09-29 ([DefiLlama](https://api.llama.fi/overview/fees/Robinhood%20Chain), [KuCoin](https://www.kucoin.com/news/flash/robinhood-chain-ends-free-gas-subsidy-in-late-september-memecoins-face-stress-test)). One operator extracted $18.4M across 53 Pons V2 launches by exempting their own wallets from the snipe tax ([The Block](https://www.theblock.co/news/defi/2026-09-27-onchain-analyst-links-18-4-million-in-robinhood-chain-memecoin-extractions-to-single-rug-pull-operation-416960)). No embodied or 3D agent product exists on the chain.

## What the 2026 winners have in common

1. **A programmatic buyback of the platform coin, shown on a live public counter.** PUMP 50% of revenue, STONK ~60%, PONS 80%.
2. **Quote-asset choice as a product lever.** Pricing launches against another asset turns every buy into demand for that asset.
3. **Fees flowing to holders, not only creators.** pump.fun Holder Rewards (2026-09-12) pays holders several times an hour; Bags pays the top 100.
4. **Anti-sniper protection by default.** A 99% fee that decays to normal over seconds to minutes, on Jupiter Studio, Virtuals and Pons.
5. **One opinionated default launch.** pump.fun killed a launch mode for fragmenting attention.

## Recommendations, ranked

Solana first. "Owner" marks steps that move funds, sign on-chain, or change production, which need your explicit go-ahead.

### Tier 1: turn on what is already built

1. **Add a decaying anti-sniper fee to the native lane, then launch it on mainnet.**
   - Change `baseFeeParams` in `api/_lib/native-launch/config.js` from the flat linear schedule to an exponential one starting near 99% and decaying to the 1% base over a short window. Prove it on devnet with the existing `scripts/native-launchpad-e2e-devnet.mjs`.
   - Then create the mainnet partner config (`scripts/native-launchpad-create-config.mjs`) and set `NATIVE_LAUNCH_CONFIG_KEY`. **Owner:** on-chain transaction, and the config is permanent once created.
   - Result: every agent coin is priced in $THREE, platform and creator split the 1% fee, and 100% of LP is locked at graduation. That lines up with points 1, 2 and 4 above in one move.
2. **Turn on the $THREE buyback and publish it.**
   - Set `THREE_BUYBACK_ENABLED` once the treasury has revenue to spend (the runs show zero revenue seen). **Owner:** spends funds.
   - Ship a public page with a live buyback total and a link to every buy transaction, fed by `three_buyback_runs`.
   - Word it as programmatic and non-guaranteed. Believe and ELIZAOS were sued over promised buybacks; pump.fun's disclaimer says no one should buy expecting one.
3. **Decide the Fee Bridge now.** UsePaid shipped the same design two weeks ago. Our edge is consent: a public claim page per handle, opt-in or opt-out, and the agent itself as a possible recipient. Either ship with that framing or accept being second. **Owner:** currently held by you.

### Tier 2: build to fix the funnel

4. **One default "launch my agent's coin" path from the agent page.** Today there are three launch doors, the autonomous launcher, Launch Studio and 50 recipes, and 0 saved token plans. Auto-draft the plan from the agent's identity and 3D render, run the free devnet dry-run as a visible rehearsal, then one confirm to launch on the native lane.
5. **Revenue-backed agents.** A public, verifiable P&L per agent: x402 service revenue in USDC kept separate from trading volume, paying callers, and buyback transactions. Award a "revenue-backed" badge only to agents with real paid calls, and rank the Daily Match on revenue. This is the gap no competitor has closed.
6. **Holder rewards for agent coins.** A fee mode where the agent's custodial wallet pays holders pro-rata in SOL or $THREE above a minimum balance, and the 3D agent reports it. Get a legal read on the framing first.
7. **A $THREE compute sink.** Pay for forge tiers and inference credits in $THREE with a bonus, on top of the existing `/credits` system. That is demand from use, not speculation (Holoworld's model).
8. **The agent hosts its own coin, live.** Living Stages already runs AI hosts tipped in $THREE. A 3D agent that streams about its own coin, holders and fees around the clock is something no launchpad has, and it avoids the moderation problems that got pump.fun's human streams suspended.
9. **Retire or fix the tokenized-agent path.** Confirm on devnet whether `handlePay` `create` still works for a new mint. If not, remove it from the product and route agent-coin buybacks through our own engine.

### Tier 3: Robinhood Chain (secondary)

10. **Fix `/markets/robinhood` coverage.** Add Pons V1/V2, Pools.trade, hood.fun and Flap to `api/_lib/robinhood.js` and `api/v1/robinhood/launches.js`; mark NOXA halted and The Odyssey as Robinpad. Low effort; today the screener misses most of the chain's launch activity.
11. **Rug-risk flags on every coin page, both chains.** Show snipe-tax-exempt wallets, the supply they took in the first blocks, and the creator's past launches. The $18.4M Pons extraction shows the need, and the Trader Card already has the wallet-reputation plumbing.
12. **Phantom first in the Robinhood Chain buy panel.** Phantom supports the chain since 2026-07-23 and our users already hold it.

## What not to do

- **Don't promise buybacks or revenue to holders.** Two platforms are in court over exactly that.
- **Don't add launch modes.** Consolidate to one default with depth behind it.
- **Don't build a launchpad on Robinhood Chain.** 60+ exist, fees are falling, and Uniswap charges nothing.
- **Don't route fees to people without their consent.** UsePaid and the Bags "$GAS" episode both drew backlash.

## Method

Three research passes (Solana launchpads, AI-agent and creator launchpads, Robinhood Chain) ran on 2026-09-28 against live sources. Our side was verified against the code and read-only production queries the same day: `pump_agent_mints`, `native_launches`, `x402_pump_launches`, `agent_identities`, `avatars`, `agent_token_plans`, `three_buyback_runs`, `pump_buyback_runs`, and the Cloud Run env var names via `scripts/read-service-env.mjs`. Market numbers move daily; re-pull the DefiLlama links before acting on a specific figure.
