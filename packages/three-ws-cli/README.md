# three-ws

Connect any MCP client to [three.ws](https://three.ws) in one command. `three-ws` signs you in, writes the hosted three.ws MCP servers into every client it finds (Claude Code, Claude Desktop, Cursor, Windsurf, VS Code, Codex, Gemini CLI, Hermes), and verifies each one with a live `tools/list`.

```bash
npx three-ws setup
```

Requires Node.js 20.12 or newer.

## What you get

The three.ws MCP servers give your assistant 3D generation (text to 3D, image to 3D, rigged avatars), your agents and their wallets, x402 paid services, and Solana token data. The live list is at [three.ws/.well-known/mcp.json](https://three.ws/.well-known/mcp.json) and every tool is in the [catalog](https://three.ws/mcp-tools).

Using one client that supports remote connectors? [three.ws/connect](https://three.ws/connect) adds three.ws to Claude, Cursor or VS Code in one click, with no terminal.

## Common commands

```bash
npx three-ws setup --clients cursor,vscode --yes   # specific clients, no prompts
npx three-ws setup --project                       # project-scoped config in this directory
npx three-ws login --device                        # sign in over SSH
npx three-ws mcp list --available                  # every server and its name
npx three-ws tools --server three-ws-main --enable financial
npx three-ws status
```

Sign-in is a browser OAuth flow by default. `--device` approves a code from any browser, and `--key sk_live_...` (or `THREE_WS_API_KEY`) uses an API key from [Dashboard → API](https://three.ws/dashboard/api). Tools that move funds are off unless you sign in with `--financial` and enable them.

## Programmatic use

The package exports its building blocks (server directory, client detection, config writers, OAuth helpers) for tools that want to reuse them. List every hosted server and the name clients store it under:

```js
import { loadDirectory, hostedServers } from 'three-ws';

const origin = 'https://three.ws';
const directory = await loadDirectory(origin);
for (const server of hostedServers(directory, origin)) console.log(server.slug, server.url);
// three-ws-main https://three.ws/api/mcp
// three-ws-studio https://three.ws/api/mcp-studio
// ...
```

## Docs

Full reference, client config paths and troubleshooting: [three.ws/docs/cli](https://three.ws/docs/cli).

## License

Apache-2.0
