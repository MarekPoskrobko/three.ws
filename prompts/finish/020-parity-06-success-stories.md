# parity 06: /stories, opt-in case studies with metrics anyone can verify

How to run: paste this file's repo path into a fresh Claude Code chat in this repository and say "run this work order". Runnable now; it reads order 015's earnings when present and degrades cleanly when not.

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

Competitor X's `/stories` is five case studies, one per kind of builder (a breakout, a creative marketplace, an infrastructure protocol, a trader, a community operator), each with market cap, SOL earned and links to the coin and the builder's X account. It makes different builders see themselves, and every metric can be checked on-chain.

three.ws has the right foundation in `/spotlight` (`pages/spotlight.html` + `src/spotlight.js`, entries at `/spotlight/<id>`, API `api/spotlight/[action].js`, store `api/_lib/spotlight-store.js`, table `agent_showcase` with `title`, `tagline`, `story` up to 4,000 characters, `category`, `demo_url`, `tags`, one live entry per agent, plus `agent_showcase_votes`). Measured 2026-09-30: 15 live entries, 14 `source='curated'` and 1 `community`. What it lacks: no verified metrics on an entry (no coin, fees or revenue), and no moderation path (`status='hidden'` exists in the schema but nothing writes it).

**Consent rule for this order:** `scripts/seed-spotlight.mjs` inserts `curated` entries about public agents without their owners opting in. A story makes claims about someone's results, so only owner-submitted entries (`source='community'`) or entries whose owner explicitly accepted a feature invitation may become stories. `/stories` is free.

## Step 0: re-derive the current state

    sed -n 1,80p api/_lib/migrations/20260901160000_agent_showcase.sql
    grep -n "case '\|action ===" api/spotlight/\[action\].js | head
    sed -n 90,140p api/_lib/spotlight-store.js
    ls prompts/finish/015-parity-01-creator-earnings.md 2>/dev/null && echo "015 open: earnings not available yet"

Count live `agent_showcase` entries by `source` with a SELECT-only throwaway script.

## Tasks

1. **Verified metrics on every spotlight entry**, keyed by `agent_id` and computed server-side (never typed by the builder): coins launched (from `pump_agent_mints`, with mint and Solscan link), creator fees earned (order 015's `/api/agents/:id/earnings` data when present), service income (`agent_revenue_events`, `agent_hires`), chats and actions (already on the entry). Each metric shows its source link. Add them to the entry API response and render a "Verified results" block on `/spotlight/<id>`.
2. **Story consent.** A `featured_story` consent on the entry, set only by the agent's owner (a checkbox on the submit form, off by default, and an "accept feature" action for an existing entry). Curated entries never become stories without it.
3. **Moderation.** An admin-only `hide` / `unhide` action (reuse the repo's admin auth pattern; find it in `api/_lib`), logged, with a test.
4. **`/stories`.** Wired per the context file: consented entries that have at least one verified metric, grouped by category, each card showing the verified numbers, the builder, the coin and a link to the full entry. A strong empty state inviting builders to submit on `/spotlight`, since few entries will qualify at first. Never pad the page with non-consented or curated entries.
5. **Docs.** Extend the spotlight doc (find it under `docs/`) with verified metrics, consent and moderation; `STRUCTURE.md` row; changelog entry.

## Definition of done

- [ ] Entry API responses carry verified metrics from real tables; a test covers an agent with a coin and one without.
- [ ] Only owner-consented entries appear on `/stories` (a test proves a curated, non-consented entry is excluded).
- [ ] Admin hide and unhide work and are tested; a hidden entry disappears from `/spotlight` and `/stories`.
- [ ] `/stories` and the updated entry page are browser-verified at 375, 768 and 1440 px, both themes, zero console errors, empty state exercised.
- [ ] Migration applied if one was added (`npm run db:status` first); docs, `STRUCTURE.md` and changelog updated.

## Never blocked

| Blocker | Resolution (act, do not ask) |
|---|---|
| No entry qualifies yet | Ship with the empty state; that is correct. Do not seed, invent or auto-consent entries. |
| 015 not shipped | Show coins and service income; add creator fees when 015 lands (the block says which metrics are live). |

## Close out (required)

1. Verify every Definition of done line with the actual command output in front of you. Never claim a line you did not verify.
2. Commit with explicit paths and a subject that describes the diff (house style: `type(scope): what changed and why a reader cares`).
3. If every Definition of done line passes, delete this file in that same commit (`git rm prompts/finish/020-parity-06-success-stories.md`) and append a dated entry to [_context/parity-PROGRESS.md](_context/parity-PROGRESS.md) with the commit SHAs. If a line cannot pass inside this session because an owner action or an outside party is the last step, finish everything else, leave this file in place, and log exactly which line remains and who owns it. Never delete this file on a partial.
4. Final report, in this order: what step 0 measured; what changed (file list with commit SHAs); evidence for each Definition of done line; the single batched owner message, if the order has a gate; one-line judgment calls. No trailing questions.
