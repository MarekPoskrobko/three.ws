# parity 09: push, deploy, and publish the three-ws CLI

How to run: paste this file's repo path into a fresh Claude Code chat in this repository and say "run this work order". Band 900: the last steps are owner actions (push, production deploy, npm publish). Everything before them is yours.

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

Every hosted MCP server answers an unauthenticated call with a 401 whose body says `Run npx three-ws setup` and links `https://three.ws/docs/cli`, and `/.well-known/mcp.json` advertises the same command. On 2026-09-29 the `three-ws` package had never been published (`npm view three-ws` returned E404), so that command failed for every developer who tried it. The Tier 1 work (`/connect`, `/docs/cli`, `/skill.md`, the curated `llms.txt`, the footer notice, the CLI's `create` and `launch`) is committed on `main` but was not live.

## Step 0: re-derive the current state

    git fetch threews main && git log --oneline threews/main..main | wc -l
    curl -s https://three.ws/api/version
    for p in /connect /docs/cli /skill.md /llms.txt; do printf "%s " $p; curl -s -o /dev/null -w "%{http_code} %{content_type}\n" https://three.ws$p; done
    (cd /tmp && npm view three-ws version 2>&1 | head -1)
    npm whoami 2>&1 | head -1
    npx vitest run packages/three-ws-cli/tests

Record each result. Skip any task below whose outcome step 0 shows is already true.

## Tasks

1. **Make the package publish-ready.** In `packages/three-ws-cli`: run `npm pack --dry-run` and confirm the tarball holds `src/`, `README.md` and `LICENSE` and nothing else (no tests, no `node_modules`). Confirm `bin`, `engines`, `publishConfig.access: public` and the dependency ranges in `package.json`. Run the CLI from the packed tarball in a clean temp dir (`npm pack`, then `npx --yes ./three-ws-<version>.tgz version` and `... mcp list --available`) and confirm both work against production. Fix anything that fails at root and commit it.
2. **Prepare the deploy exactly as the CLAUDE.md Deploy runbook says**, in order: `npm run clean:worktrees`, `npm run prep:worktree` (plan) then `-- --apply`, `npm run build:gcp` inside the worktree, and run the `deploy-preflight` subagent against it. Stop before `npm run deploy:gcp:submit`.
3. **Send the ONE owner message** (the gate). It asks for three yeses, each with what it does: (a) `git push threews main`, listing the commit count from step 0; (b) the production deploy from the prepared worktree; (c) `npm publish` of `three-ws@<version>` from `packages/three-ws-cli`, which needs an npm account with publish rights (if `npm whoami` failed, ask for `npm login` in the same message). If the owner's current instruction already approves any of these (for example "ship it"), that is the approval: do not ask again.
4. **After approval**, run the approved steps: the push, then `npm run deploy:gcp:submit`, `npm run deploy:gcp:purge-cdn`, then `npm publish` from the package directory. Remove the deploy worktree when it lands (`git worktree remove --force <path>`).
5. **Verify live**, every line against production: `curl -s https://three.ws/api/version` shows the pushed commit; `/connect` and `/docs/cli` return 200 and render (Playwright, no console errors); `/skill.md` returns 200 with `text/markdown`; `/llms.txt` starts with the `## Official` block within its first 20 lines; `npm run smoke:prod` passes; and from an empty temp directory `npx --yes three-ws@latest version` prints the published version and `npx --yes three-ws mcp list --available` lists the hosted servers.

## Definition of done

- [ ] `git log --oneline threews/main..main` is empty for the commits that existed at step 0.
- [ ] `curl -s https://three.ws/api/version` reports a commit at or after the pushed head.
- [ ] `/connect`, `/docs/cli`, `/skill.md` and `/llms.txt` return 200 on production, `/skill.md` as `text/markdown`.
- [ ] `npm view three-ws version` prints a version; `npx --yes three-ws@latest mcp list --available` works in an empty directory.
- [ ] `npm run smoke:prod` exits 0.

## Never blocked

| Blocker | Resolution (act, do not ask) |
|---|---|
| `gcloud` answers `Reauthentication failed` | Retry one real call; if it persists, it goes into the single owner message as `gcloud auth login`, alongside the three approvals. Everything up to the submit is still yours. |
| `npm whoami` fails | Same: `npm login` joins the single owner message. Finish the publish-readiness task regardless. |
| Migrations pending at `db:check` | `npm run db:status`, then `npm run db:migrate` (it applies every pending migration; read the status first). |
| A build step fails in code you did not touch | Root-cause and fix it if it blocks the build; the CLAUDE.md runbook lists the known failure modes. |
| The npm name is taken at publish time | Stop the publish, report it, and do not rename the package: every 401, `/docs/cli` and `/.well-known/mcp.json` name `three-ws`. |
| Production smoke fails on a page unrelated to this order | Report it as a named follow-up; it does not block this order unless it is one of the four surfaces above. |

## Close out (required)

1. Verify every Definition of done line with the actual command output in front of you. Never claim a line you did not verify.
2. Commit with explicit paths and a subject that describes the diff (house style: `type(scope): what changed and why a reader cares`).
3. If every Definition of done line passes, delete this file in that same commit (`git rm prompts/finish/919-parity-09-ship-and-publish.md`) and append a dated entry to [_context/parity-PROGRESS.md](_context/parity-PROGRESS.md) with the commit SHAs. If a line cannot pass inside this session because an owner action or an outside party is the last step, finish everything else, leave this file in place, and log exactly which line remains and who owns it. Never delete this file on a partial.
4. Final report, in this order: what step 0 measured; what changed (file list with commit SHAs); evidence for each Definition of done line; the single batched owner message, if the order has a gate; one-line judgment calls. No trailing questions.
