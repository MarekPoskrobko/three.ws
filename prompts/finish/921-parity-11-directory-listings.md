# parity 11: list three.ws in the directories agents and builders read

How to run: paste this file's repo path into a fresh Claude Code chat in this repository and say "run this work order". Band 900: opening a pull request on someone else's repository is posting to an external channel, so the submission itself is owner-gated. Everything up to it is yours.

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

The Solana Foundation's `solana-foundation/awesome-solana-ai` README (about 426 stars on 2026-09-29, pushed weekly) is a curated list of AI coding skills, agents and tools for Solana. Competitor X is listed there twice and cites the listing as credibility on its own marketing page. three.ws is not listed. Our entry point for an agent is `https://three.ws/skill.md` (shipped 2026-09-29, order 919 makes it live).

## Step 0: re-derive the current state

    curl -s -o /dev/null -w "%{http_code} %{content_type}\n" https://three.ws/skill.md
    curl -s https://raw.githubusercontent.com/solana-foundation/awesome-solana-ai/main/README.md | grep -n "^#\|three.ws\|three-ws"
    curl -s https://raw.githubusercontent.com/solana-foundation/awesome-solana-ai/main/CONTRIBUTING.md
    which gh; gh auth status 2>&1 | head -3

If `/skill.md` is not 200 on production, order 919 has not landed: finish the preparation below and log that the submission waits on 919.

## Tasks

1. Read the list's CONTRIBUTING rules and match them exactly: section, alphabetical position, line format, description length.
2. Decide the section from its content: `https://three.ws/skill.md` belongs under **AI Coding Skills > General**; if the list has an **AI Agents** or **Developer Tools** entry that fits the hosted MCP servers (`https://three.ws/connect`), prepare that second line too, and say which is primary.
3. Write the lines. Draft for the skill: `[three-ws-skill](https://three.ws/skill.md) - AI agent skill for three.ws: generate textured and rigged 3D models and avatars, create agents with their own Solana wallet, launch coins, and pay for or sell services over x402.` Every claim must be true on production the day you submit; re-check each one.
4. Prepare the pull request in a local clone under the session scratchpad: branch, the one-file README diff, a commit and a PR title and body written for the list's maintainers (what three.ws is in two sentences, why it fits the list, links to `/skill.md`, `/connect` and the repo). Save the diff, title and body to `docs/awesome-solana-ai-submission.md` in this repo and commit it.
5. Look for other directories of the same kind (Agent Skills registries, MCP server directories we are not yet in; `STRUCTURE.md` and `docs/` list the ones we are). For each one missing us, add its exact submission steps to the same doc.
6. **The owner message (the gate):** the list of submissions, each with its target, the exact text and the PR body, asking for one yes. On a yes, submit with `gh` from an authenticated account (install `gh` if missing), or hand the owner the one command if the machine has no GitHub auth.

## Definition of done

- [ ] `docs/awesome-solana-ai-submission.md` holds the exact diff, PR title and body, plus any other directory's steps, and is committed.
- [ ] Every claim in the proposed lines was re-checked against production that day (the report lists each check).
- [ ] The owner message was sent. The submission itself is the only step allowed to remain, and the report names the PR URL if it was opened.

## Never blocked

| Blocker | Resolution (act, do not ask) |
|---|---|
| `gh` not installed or not authenticated | Prepare everything; the submission command goes in the owner message. |
| The list's rules forbid self-submission | Say so in the owner message and prepare the text for a third party to submit. |
| `/skill.md` not live yet | Prepare everything and log that the submission waits on order 919. |

## Close out (required)

1. Verify every Definition of done line with the actual command output in front of you. Never claim a line you did not verify.
2. Commit with explicit paths and a subject that describes the diff (house style: `type(scope): what changed and why a reader cares`).
3. If every Definition of done line passes, delete this file in that same commit (`git rm prompts/finish/921-parity-11-directory-listings.md`) and append a dated entry to [_context/parity-PROGRESS.md](_context/parity-PROGRESS.md) with the commit SHAs. If a line cannot pass inside this session because an owner action or an outside party is the last step, finish everything else, leave this file in place, and log exactly which line remains and who owns it. Never delete this file on a partial.
4. Final report, in this order: what step 0 measured; what changed (file list with commit SHAs); evidence for each Definition of done line; the single batched owner message, if the order has a gate; one-line judgment calls. No trailing questions.
