// `three-ws create` and `three-ws launch`: an agent and its coin from the terminal.
//
// create  POSTs /api/agents with the stored credential. The server mints the
//         agent's own Solana wallet in that request; nothing here touches keys.
// launch  never spends from the terminal. Launching signs with the agent's
//         custodial wallet, which three.ws only allows from a same-site browser
//         session, so this collects the coin details and opens /launch with them
//         filled in: the owner reviews the cost there and signs it themselves.

import * as p from '@clack/prompts';
import { answer, canPrompt, signIn } from './common.js';
import { c, line, rows, sym, printJson, shortAddress } from '../ui.js';
import { bearerFor } from '../oauth.js';
import { requestJson, ApiError } from '../http.js';
import { openBrowser } from '../browser.js';

const NAME_MAX = 100;
const DESCRIPTION_MAX = 500;
const COIN_NAME_MAX = 32;
const SYMBOL_MAX = 10;
const COIN_DESCRIPTION_MAX = 500;

/** A bearer for the signed-in account, signing in first when a prompt is allowed. */
async function requireBearer(ctx) {
	let bearer = await bearerFor(ctx.env, { origin: ctx.origin });
	if (bearer) return bearer;
	if (!canPrompt(ctx)) throw new ApiError('sign in first: `npx three-ws login` (or pass --key / set THREE_WS_API_KEY)');
	await signIn(ctx, {});
	bearer = await bearerFor(ctx.env, { origin: ctx.origin });
	if (!bearer) throw new ApiError('sign-in did not complete; run `npx three-ws login`');
	return bearer;
}

async function ask(ctx, { flag, message, placeholder, max, required = true, validate }) {
	const given = typeof flag === 'string' ? flag.trim() : '';
	if (given) {
		const err = validate?.(given);
		if (err) throw new Error(err);
		return given.slice(0, max);
	}
	if (!canPrompt(ctx)) {
		if (required) throw new Error(`${message.toLowerCase()} is required (pass it as a flag)`);
		return '';
	}
	const value = answer(await p.text({
		message,
		placeholder,
		validate: (v) => {
			const s = String(v || '').trim();
			if (required && !s) return 'Required.';
			if (s.length > max) return `At most ${max} characters.`;
			return validate?.(s);
		},
	}));
	return String(value || '').trim();
}

async function listAgents(ctx, bearer) {
	const data = await requestJson(`${ctx.origin}/api/agents`, { headers: { authorization: `Bearer ${bearer}` } });
	return Array.isArray(data?.agents) ? data.agents : [];
}

export async function create(ctx) {
	const { flags, positionals } = ctx;
	const bearer = await requireBearer(ctx);
	if (canPrompt(ctx)) p.intro(`${c.bold('three.ws')} create an agent`);

	const name = await ask(ctx, {
		flag: flags.name || positionals[0],
		message: 'Agent name',
		placeholder: 'Nova',
		max: NAME_MAX,
	});
	const description = await ask(ctx, {
		flag: flags.description,
		message: 'What does it do? (shown on its page and in search)',
		placeholder: 'A deep-space guide who explains orbital mechanics in plain language.',
		max: DESCRIPTION_MAX,
		required: false,
	});

	const body = { name, ...(description ? { description } : {}), ...(flags.avatar ? { avatar_id: flags.avatar } : {}) };
	let agent;
	try {
		const res = await requestJson(`${ctx.origin}/api/agents`, {
			method: 'POST',
			headers: { authorization: `Bearer ${bearer}` },
			json: body,
			timeoutMs: 60_000,
		});
		agent = res.agent;
	} catch (err) {
		// A name that impersonates an existing public agent is refused on purpose.
		if (err instanceof ApiError && err.status === 409) {
			const reason = err.body?.integrity?.reasons?.[0] || err.message;
			throw new ApiError(`three.ws refused that name: ${reason}. Pick a distinct name and run create again.`, { status: 409, code: 'identity_conflict' });
		}
		throw err;
	}

	const page = `${ctx.origin}/agents/${agent.id}`;
	if (flags.json) {
		printJson({ agent: { id: agent.id, name: agent.name, solana_address: agent.solana_address, wallet_ready: agent.walletReady ?? null }, page });
		return 0;
	}
	if (canPrompt(ctx)) p.outro(`${c.green(sym.ok)} ${c.bold(agent.name)} is live`);
	else line(`${c.green(sym.ok)} ${c.bold(agent.name)} is live`);
	rows([
		['Page', c.cyan(page)],
		['Agent id', agent.id],
		['Solana wallet', agent.solana_address ? `${agent.solana_address} ${c.dim(`(${shortAddress(agent.solana_address)})`)}` : c.dim('preparing; it appears on the agent page')],
	], '  ');
	line('');
	if (!agent.avatar_id) line(c.dim(`  Give it a 3D body on its page. A body is also what a coin launch shows.`));
	line(c.dim(`  Launch its coin: npx three-ws launch --agent ${agent.id}`));
	return 0;
}

export async function launch(ctx) {
	const { flags } = ctx;
	const bearer = await requireBearer(ctx);
	const interactive = canPrompt(ctx);
	if (interactive) p.intro(`${c.bold('three.ws')} launch a coin`);

	// /launch picks the launching agent by its 3D body, so only agents with one
	// can be preselected there.
	const agents = await listAgents(ctx, bearer);
	let agent = null;
	if (flags.agent) {
		agent = agents.find((a) => a.id === flags.agent || a.avatar_id === flags.agent);
		if (!agent) throw new Error(`no agent ${flags.agent} on this account. \`npx three-ws create\` makes one.`);
	} else if (!agents.length) {
		throw new Error('this account has no agents yet. Run `npx three-ws create` first.');
	} else if (agents.length === 1 || !interactive) {
		[agent] = agents.filter((a) => a.avatar_id).concat(agents);
	} else {
		agent = answer(await p.select({
			message: 'Which agent launches it?',
			options: agents.map((a) => ({
				value: a,
				label: a.name,
				hint: a.avatar_id ? (a.token?.mint ? 'already has a coin' : undefined) : 'no 3D body yet',
			})),
		}));
	}
	if (!agent.avatar_id) {
		throw new Error(`${agent.name} has no 3D body yet, and /launch picks the launching agent by its body. Give it one at ${ctx.origin}/agents/${agent.id}, then run launch again.`);
	}
	if (agent.token?.mint && !flags.json) {
		line(c.yellow(`  ${agent.name} already launched ${agent.token.symbol ? `$${agent.token.symbol}` : 'a coin'} (${agent.token.mint}).`));
	}

	const coinName = await ask(ctx, { flag: flags.name, message: 'Coin name', placeholder: agent.name, max: COIN_NAME_MAX });
	const symbol = (await ask(ctx, {
		flag: flags.symbol,
		message: 'Ticker',
		placeholder: coinName.replace(/[^A-Za-z0-9]/g, '').slice(0, 5).toUpperCase(),
		max: SYMBOL_MAX,
		validate: (s) => (/^[A-Za-z0-9]+$/.test(s) ? undefined : 'Letters and digits only.'),
	})).toUpperCase();
	const description = await ask(ctx, {
		flag: flags.description,
		message: 'Coin description (optional)',
		max: COIN_DESCRIPTION_MAX,
		required: false,
	});
	const image = await ask(ctx, {
		flag: flags.image,
		message: 'Image URL (optional; the agent\'s portrait is used when blank)',
		max: 2000,
		required: false,
		validate: (s) => (/^https:\/\//.test(s) ? undefined : 'Use an https:// URL.'),
	});
	const initialBuy = flags['initial-buy'] ? Number(flags['initial-buy']) : 0;
	if (!Number.isFinite(initialBuy) || initialBuy < 0) throw new Error('--initial-buy must be a SOL amount of 0 or more');

	const url = new URL('/launch', ctx.origin);
	url.searchParams.set('avatar', agent.avatar_id);
	url.searchParams.set('name', coinName);
	url.searchParams.set('symbol', symbol);
	if (description) url.searchParams.set('description', description);
	if (image) url.searchParams.set('image', image);
	if (initialBuy > 0) url.searchParams.set('initialBuy', String(initialBuy));

	if (flags.json) {
		printJson({ agent: { id: agent.id, name: agent.name }, coin: { name: coinName, symbol, description: description || null, image: image || null, initial_buy_sol: initialBuy }, review_url: url.toString() });
		return 0;
	}

	rows([
		['Agent', agent.name],
		['Coin', `${coinName} ($${symbol})`],
		['Initial buy', initialBuy > 0 ? `${initialBuy} SOL` : 'none'],
	], '  ');
	line('');
	const opened = await openBrowser(url.toString(), { env: ctx.env.vars });
	line(`  ${opened ? 'Opened' : 'Open'} ${c.cyan(url.toString())}`);
	line(c.dim('  Nothing is paid from the terminal. Review the cost on that page and sign the launch there.'));
	if (interactive) p.outro('Finish the launch in your browser.');
	return 0;
}
