// X (Twitter) recent search, read-only, for evidence that has to be citable.
//
// The Sentiment Scout uses this to find posts that quote a coin's exact
// contract address. Searching the mint (not the ticker) is deliberate: a
// ticker like $CAT matches thousands of unrelated coins, while a 44-character
// base58 address only matches posts about that one coin. Every post returned
// here carries its own permalink, author and timestamp, so a claim built from
// it can always be opened and checked by a reader.
//
// Auth: an app-only bearer token. X_BEARER_TOKEN is used as-is when set;
// otherwise one is minted from the app's consumer key pair (X_API_KEY /
// X_API_SECRET, the same app the platform posts from) with the OAuth2
// client-credentials grant and cached in-process until X rejects it.
//
// Budget: X meters recent search per app per 15 minutes. Every response
// reports what is left (x-rate-limit-remaining); once it drops under
// RESERVE_REQUESTS this module stops searching until the window resets, so a
// busy scout board can never exhaust the quota other X features share.

import { fetchUpstream } from './upstream-fetch.js';

const TOKEN_URL = 'https://api.twitter.com/oauth2/token';
const SEARCH_URL = 'https://api.twitter.com/2/tweets/search/recent';
const BREAKER = 'x:search';
const TIMEOUT_MS = 6_000;
const RESERVE_REQUESTS = 60;

let _token = null;
let _budget = { remaining: null, resetAtMs: 0 };

export class XSearchUnavailable extends Error {
	constructor(reason, message) {
		super(message || reason);
		this.name = 'XSearchUnavailable';
		this.reason = reason;
	}
}

/** True when this deployment holds credentials that can search. */
export function xSearchConfigured(env = process.env) {
	return !!(env.X_BEARER_TOKEN || (env.X_API_KEY && env.X_API_SECRET));
}

/**
 * Build the search query for posts quoting one contract address. Retweets are
 * excluded: a retweet is the same post again, and counting it would let one
 * account's shill be amplified into many "mentions".
 */
export function mintQuery(mint) {
	return `"${String(mint).trim()}" -is:retweet`;
}

// X returns post text with &amp; &lt; &gt; escaped. Decode those three (and
// &quot; / &#39; for safety) so a quote reads as the author wrote it; the page
// escapes again on render.
const ENTITIES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" };
export function decodeXText(text) {
	return String(text ?? '').replace(/&(?:amp|lt|gt|quot|#39);/g, (m) => ENTITIES[m]);
}

/**
 * Normalize a v2 search payload into post receipts. PURE.
 *
 * @param {object} payload  the JSON body of /2/tweets/search/recent
 * @returns {Array<{ id, url, text, created_at, author: { id, username, name, followers, verified }, likes, reposts, replies, quotes, impressions }>}
 */
export function parseSearchPayload(payload) {
	const users = new Map();
	for (const u of payload?.includes?.users || []) {
		if (u?.id) users.set(String(u.id), u);
	}
	const out = [];
	for (const t of Array.isArray(payload?.data) ? payload.data : []) {
		if (!t?.id || typeof t.text !== 'string') continue;
		const u = users.get(String(t.author_id)) || null;
		const username = u?.username ? String(u.username) : null;
		const m = t.public_metrics || {};
		out.push({
			id: String(t.id),
			// Without a username X still resolves /i/status/<id> to the post.
			url: username ? `https://x.com/${username}/status/${t.id}` : `https://x.com/i/status/${t.id}`,
			text: decodeXText(t.text),
			created_at: t.created_at || null,
			author: {
				id: t.author_id ? String(t.author_id) : null,
				username,
				name: u?.name || null,
				followers: Number.isFinite(Number(u?.public_metrics?.followers_count)) ? Number(u.public_metrics.followers_count) : null,
				verified: u?.verified === true,
			},
			likes: Number(m.like_count) || 0,
			reposts: Number(m.retweet_count) || 0,
			replies: Number(m.reply_count) || 0,
			quotes: Number(m.quote_count) || 0,
			impressions: Number.isFinite(Number(m.impression_count)) ? Number(m.impression_count) : null,
		});
	}
	return out;
}

/**
 * Summarize a set of posts about one coin: how many, from how many distinct
 * accounts, the most-followed account, and how concentrated the chatter is.
 * PURE. `posts` come from parseSearchPayload.
 */
export function summarizePosts(posts) {
	const list = Array.isArray(posts) ? posts : [];
	const byAuthor = new Map();
	for (const p of list) {
		const key = p.author?.id || p.author?.username || p.id;
		const cur = byAuthor.get(key) || { author: p.author, posts: 0 };
		cur.posts += 1;
		byAuthor.set(key, cur);
	}
	const authors = [...byAuthor.values()];
	const top = authors.slice().sort((a, b) => (b.posts - a.posts))[0] || null;
	const mostFollowed = authors
		.filter((a) => a.author?.followers != null)
		.sort((a, b) => b.author.followers - a.author.followers)[0] || null;
	const reach = authors.reduce((s, a) => s + (a.author?.followers || 0), 0);
	const engagement = list.reduce((s, p) => s + p.likes + p.reposts + p.replies + p.quotes, 0);
	const times = list.map((p) => Date.parse(p.created_at)).filter(Number.isFinite).sort((a, b) => a - b);
	return {
		posts: list.length,
		authors: authors.length,
		top_poster: top ? { username: top.author?.username || null, posts: top.posts } : null,
		top_poster_share: list.length && top ? top.posts / list.length : 0,
		most_followed: mostFollowed ? { username: mostFollowed.author.username, followers: mostFollowed.author.followers } : null,
		reach_followers: reach,
		engagement,
		first_at: times.length ? new Date(times[0]).toISOString() : null,
		last_at: times.length ? new Date(times[times.length - 1]).toISOString() : null,
	};
}

function noteBudget(res) {
	const remaining = Number(res.headers.get('x-rate-limit-remaining'));
	const reset = Number(res.headers.get('x-rate-limit-reset'));
	if (Number.isFinite(remaining)) _budget.remaining = remaining;
	if (Number.isFinite(reset)) _budget.resetAtMs = reset * 1000;
}

function budgetExhausted(now = Date.now()) {
	if (_budget.remaining == null) return false;
	if (now >= _budget.resetAtMs) return false;
	return _budget.remaining < RESERVE_REQUESTS;
}

async function bearer(env, fetchImpl) {
	if (env.X_BEARER_TOKEN) return env.X_BEARER_TOKEN;
	if (_token) return _token;
	if (!env.X_API_KEY || !env.X_API_SECRET) throw new XSearchUnavailable('not_configured', 'X search credentials are not configured');
	const basic = Buffer.from(`${encodeURIComponent(env.X_API_KEY)}:${encodeURIComponent(env.X_API_SECRET)}`).toString('base64');
	const res = await fetchImpl(TOKEN_URL, {
		method: 'POST',
		headers: { authorization: `Basic ${basic}`, 'content-type': 'application/x-www-form-urlencoded;charset=UTF-8' },
		body: 'grant_type=client_credentials',
	}, { name: BREAKER, timeoutMs: TIMEOUT_MS, attempts: 1, okWhen: () => true });
	if (!res.ok) throw new XSearchUnavailable('auth_failed', `X token exchange failed with HTTP ${res.status}`);
	const body = await res.json();
	if (!body?.access_token) throw new XSearchUnavailable('auth_failed', 'X token exchange returned no access token');
	_token = body.access_token;
	return _token;
}

/**
 * Search recent posts (X keeps the last 7 days searchable) quoting a mint.
 * Throws XSearchUnavailable when search cannot run (no credentials, auth
 * failure, the budget reserve reached, or X down); callers list the source as
 * unavailable rather than guessing.
 *
 * @param {string} mint
 * @param {{ sinceIso?: string|null, maxResults?: number, env?: object, fetchImpl?: Function }} [opts]
 */
export async function searchMintPosts(mint, { sinceIso = null, maxResults = 25, env = process.env, fetchImpl = fetchUpstream } = {}) {
	if (!xSearchConfigured(env)) throw new XSearchUnavailable('not_configured', 'X search credentials are not configured');
	if (budgetExhausted()) throw new XSearchUnavailable('budget_reserve', 'X search budget reserve reached for this window');

	const params = new URLSearchParams({
		query: mintQuery(mint),
		max_results: String(Math.max(10, Math.min(100, Math.round(maxResults)))),
		'tweet.fields': 'created_at,public_metrics,author_id',
		expansions: 'author_id',
		'user.fields': 'username,name,public_metrics,verified',
	});
	// X rejects a start_time older than 7 days or in the future; clamp to a
	// valid window rather than sending one it will refuse.
	if (sinceIso) {
		const t = Date.parse(sinceIso);
		const floor = Date.now() - 7 * 24 * 3600 * 1000 + 60_000;
		const ceil = Date.now() - 15_000;
		if (Number.isFinite(t) && t < ceil) params.set('start_time', new Date(Math.max(t, floor)).toISOString());
	}

	for (let pass = 0; pass < 2; pass++) {
		const token = await bearer(env, fetchImpl);
		const res = await fetchImpl(`${SEARCH_URL}?${params}`, {
			headers: { authorization: `Bearer ${token}`, accept: 'application/json' },
		}, { name: BREAKER, timeoutMs: TIMEOUT_MS, attempts: 1, okWhen: () => true });
		noteBudget(res);
		if (res.status === 401 && !env.X_BEARER_TOKEN && pass === 0) {
			// A revoked or rotated app token: mint a fresh one once.
			_token = null;
			continue;
		}
		if (res.status === 429) throw new XSearchUnavailable('rate_limited', 'X search rate limit reached');
		if (!res.ok) throw new XSearchUnavailable('upstream_error', `X search returned HTTP ${res.status}`);
		return parseSearchPayload(await res.json());
	}
	throw new XSearchUnavailable('auth_failed', 'X rejected the app token');
}

/** Test seam: forget the cached token and budget. */
export function _resetXSearch() {
	_token = null;
	_budget = { remaining: null, resetAtMs: 0 };
}
