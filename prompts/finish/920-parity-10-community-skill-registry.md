# parity 10: pull community skills from external GitHub registries

How to run: paste this file's repo path into a fresh Claude Code chat in this repository and say "run this work order". Band 900: the owner chooses which external registries to trust. Build everything else first.

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

Competitor X lists about 50 "community skills" by pulling two public GitHub skill repositories at runtime (one of them a widely used Apache-2.0 library of 44 Solana protocol skills) and caching them for five minutes. Our registry is richer in validation but closed: every skill must be committed to `community-skills/` in this repo (or merged through the mirror, `scripts/sync-community-skills.mjs`). Pulling vetted external registries widens the catalog without us writing or hosting each skill.

The risk is real and is the design constraint: a skill is a set of instructions an agent loads. An external skill is untrusted input. It must never be auto-enabled, must be pinned to a commit, and must be labelled as external everywhere it appears.

## Step 0: re-derive the current state

    sed -n 1,60p api/_lib/community-skills.js
    sed -n 1,40p api/skills/community.js
    python3 -c "import json;d=json.load(open('community-skills/registry.json'));print(d['count'], d['schema'], list(d)[:8])"
    sed -n 1,60p packages/three-ws-cli/src/commands/skills.js
    grep -rn "COMMUNITY_SKILL_SOURCES" api scripts packages 2>/dev/null
    node scripts/read-service-env.mjs '^COMMUNITY_SKILL_SOURCES$' --raw

Note the registry schema (`community-skills/registry.json`), how `/skills/community` and `GET /api/skills/community/:slug` read it, how `three-ws skills import` installs one, and whether any external-source code already exists.

## Tasks

1. **Source list from runtime config, not code.** Read the list of external registries from one env var, `COMMUNITY_SKILL_SOURCES`: a JSON array of `{ "repo": "owner/name", "ref": "<commit sha>", "path": "skills", "license": "<SPDX id>" }`. Nothing in committed code, tests or docs names a specific third-party repository (the commit gate); tests use a synthetic repository fixture served by a local HTTP server.
2. **Fetch, validate, cache.** A server module (beside `api/_lib/community-skills.js`) fetches each source's skill folders at the pinned `ref` from `raw.githubusercontent.com` (tree listing through the public GitHub API, unauthenticated, with `GITHUB_TOKEN` used when set to lift the rate limit), validates every `SKILL.md` with the same frontmatter rules as our registry, drops anything invalid with a logged reason, and caches the merged result (memory plus a short TTL). A source that fails to load never breaks our own registry: our in-image skills always render.
3. **Label and isolate.** Every external skill carries `origin: "external"`, its source repo, the pinned commit, and its license in the API response. `/skills/community` shows them in their own clearly labelled section with a "not reviewed by three.ws" badge and a link to the exact source commit. They can be imported only by an explicit user action; nothing enables them on any agent automatically; `three-ws skills import` prints the source and commit and asks for confirmation (non-interactive use requires `--yes`).
4. **Docs.** Extend `community-skills/README.md` (or the doc it links) with how external sources work, the trust model and how an operator adds one (the env var format). Add a `data/changelog.json` entry once live.
5. **The owner message (the gate).** Propose a concrete source list: for each candidate, the repository, a pinned commit, its license, its skill count and why it is worth including. Candidates must be permissively licensed (MIT, Apache-2.0, BSD). Ask for a yes on the list, then set the approved value with `gcloud run services update three-ws-api --region us-central1 --update-env-vars` (config-only updates are pre-approved once the list is approved; never `--set-env-vars`).

## Definition of done

- [ ] With `COMMUNITY_SKILL_SOURCES` unset, `/skills/community` and its API behave exactly as before (a test proves it).
- [ ] With the synthetic fixture source set, the API returns the fixture's valid skills with `origin: "external"`, `source`, `ref` and `license`, and omits the invalid one (a test proves each).
- [ ] A failing source (404, timeout) leaves the in-repo registry intact and is logged (a test proves it).
- [ ] `three-ws skills import` of an external skill without `--yes` in a non-interactive shell refuses (a test proves it).
- [ ] `grep -rn` over the diff finds no third-party repository name.
- [ ] `npm test` passes for the touched suites; `npm run check:rules -- --paths <files>` exits 0.
- [ ] The owner message with the proposed source list was sent (quote it in the report). Setting the env var is the only step allowed to remain.

## Never blocked

| Blocker | Resolution (act, do not ask) |
|---|---|
| GitHub API rate limit (60/hour unauthenticated) | Use `GITHUB_TOKEN` when present (check `.env`, `.env.local`, the service env); otherwise rely on the cache and fetch by pinned tree once per TTL. |
| An external `SKILL.md` has non-standard frontmatter | Drop it with a logged reason; never loosen our validator to admit it. |
| A candidate repository has no license | Exclude it from the proposal and say why. |

## Close out (required)

1. Verify every Definition of done line with the actual command output in front of you. Never claim a line you did not verify.
2. Commit with explicit paths and a subject that describes the diff (house style: `type(scope): what changed and why a reader cares`).
3. If every Definition of done line passes, delete this file in that same commit (`git rm prompts/finish/920-parity-10-community-skill-registry.md`) and append a dated entry to [_context/parity-PROGRESS.md](_context/parity-PROGRESS.md) with the commit SHAs. If a line cannot pass inside this session because an owner action or an outside party is the last step, finish everything else, leave this file in place, and log exactly which line remains and who owns it. Never delete this file on a partial.
4. Final report, in this order: what step 0 measured; what changed (file list with commit SHAs); evidence for each Definition of done line; the single batched owner message, if the order has a gate; one-line judgment calls. No trailing questions.
