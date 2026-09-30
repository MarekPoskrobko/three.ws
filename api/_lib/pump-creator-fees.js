// @ts-check
// Creator-fee reads for pump.fun coins: the one client behind the coin page's
// "Creator earned" figure (api/pump/launch-detail.js), the per-agent earnings
// snapshot cron (api/cron/creator-earnings-snapshot.js) and anything else that
// needs to know what a coin's creator has earned.
//
// Where the numbers come from:
//
//   creator      the coin's on-chain fee recipient, read from the bonding curve
//                (or the AMM pool once the coin graduated). pump.fun's coin
//                metadata `creator` field is NOT used: for a gasless launch it
//                names the sponsor that paid the transaction, not the wallet
//                that collects the fees.
//   earned       pump.fun's creator-fee index, GET swap-api.pump.fun
//                /v1/creators/<wallet>/fees/total (lifetime, lamports) and
//                /v1/creators/<wallet>/fees?interval=1d|30m (bucketed). It is
//                keyed by creator WALLET, so one wallet that created several
//                coins reports one combined figure. The fee-sharing totals
//                endpoint the coin page used before answers 0 for every coin
//                that never set up a sharing config, which is every coin
//                three.ws has launched, so the page never showed a real figure.
//   unclaimed    the creator vault balances read straight from the cluster
//                (pump bonding-curve vault plus the PumpSwap coin-creator vault),
//                the exact lamports a claim would sweep right now.
//   claimed      earned minus unclaimed: every lamport the index says was
//                earned and the vault no longer holds was swept by a claim.
//
// Every pump.fun call runs behind the shared 'pumpfun:creator-fees' circuit
// breaker, so a sick upstream costs one timeout per instance, not one per read.
// An unhealthy answer (network error, timeout, non-2xx, unparseable body) throws
// inside the breaker and resolves to a `{ ok: false }` result; a healthy answer
// with no earnings is `{ ok: true }` with zero lamports. Callers keep their last
// good value on `ok: false` and never invent a figure.

import { PublicKey } from '@solana/web3.js';
import { withBreaker } from './resilience.js';
import { pumpFetchJson, PUMP_SWAP_BASE } from './pump-feed-fetch.js';

export const CREATOR_FEES_BREAKER = 'pumpfun:creator-fees';
const BREAKER_OPTS = { threshold: 3, halfOpenAfterMs: 30_000 };
const TIMEOUT_MS = 6000;

/** @param {unknown} v */
function toLamports(v) {
	if (v == null || v === '') return null;
	try {
		const n = BigInt(String(v).split('.')[0]);
		return n < 0n ? 0n : n;
	} catch {
		return null;
	}
}

/**
 * Run one pump.fun read behind the shared breaker. `fn` throws on an unhealthy
 * upstream; the breaker turns that (or an open circuit) into `{ ok: false }`.
 * @template T
 * @param {() => Promise<T>} fn
 * @returns {Promise<{ ok: true, value: T } | { ok: false, error: string }>}
 */
async function guarded(fn) {
	return withBreaker(
		CREATOR_FEES_BREAKER,
		async () => ({ ok: /** @type {const} */ (true), value: await fn() }),
		{
			...BREAKER_OPTS,
			fallback: (err) => ({
				ok: /** @type {const} */ (false),
				error: String(/** @type {any} */ (err)?.message || err || 'pump.fun unavailable').slice(0, 200),
			}),
		},
	);
}

/**
 * Lifetime creator fees earned by one wallet, in lamports, across every coin
 * that wallet created.
 * @param {string} wallet
 */
export async function fetchCreatorFeeTotal(wallet) {
	return guarded(async () => {
		const r = await pumpFetchJson(
			`${PUMP_SWAP_BASE}/v1/creators/${encodeURIComponent(wallet)}/fees/total`,
			{ timeoutMs: TIMEOUT_MS },
		);
		if (!r.ok) throw new Error(`pump.fun creator fees ${r.status}`);
		const lamports = toLamports(r.body?.totalFees);
		if (lamports == null) throw new Error('pump.fun creator fees: no totalFees in response');
		return lamports;
	});
}

/**
 * Bucketed creator fees for one wallet. pump.fun answers the most recent ~100
 * buckets: `1d` spans about 100 days, `30m` about the last 50 hours. Zero
 * buckets are dropped; they add nothing to a windowed sum.
 * @param {string} wallet
 * @param {'1d'|'30m'} interval
 */
export async function fetchCreatorFeeBuckets(wallet, interval) {
	return guarded(async () => {
		const r = await pumpFetchJson(
			`${PUMP_SWAP_BASE}/v1/creators/${encodeURIComponent(wallet)}/fees?interval=${interval}`,
			{ timeoutMs: TIMEOUT_MS },
		);
		if (!r.ok) throw new Error(`pump.fun creator fee buckets ${r.status}`);
		if (!Array.isArray(r.body)) throw new Error('pump.fun creator fee buckets: not an array');
		const out = [];
		for (const b of r.body) {
			const fee = toLamports(b?.creatorFee);
			const at = Date.parse(b?.bucket);
			if (fee == null || !Number.isFinite(at) || fee === 0n) continue;
			out.push({
				bucket_start: new Date(at).toISOString(),
				fee_lamports: fee,
				num_trades: Number.isFinite(Number(b?.numTrades)) ? Number(b.numTrades) : 0,
			});
		}
		return out;
	});
}

/**
 * The on-chain fee recipient of each mint. Bonding curves are read in one
 * batched RPC call per 100 mints; a graduated coin's recipient comes from its
 * canonical PumpSwap pool. A mint whose curve cannot be read maps to null.
 *
 * @param {import('@solana/web3.js').Connection} connection
 * @param {string[]} mints
 * @returns {Promise<Map<string, { creator: string, graduated: boolean } | null>>}
 */
export async function resolveCoinCreators(connection, mints) {
	const [{ PumpSdk, bondingCurvePda, canonicalPumpPoolPda }, { OnlinePumpAmmSdk }] = await Promise.all([
		import('@pump-fun/pump-sdk'),
		import('@pump-fun/pump-swap-sdk'),
	]);
	const offline = new PumpSdk();
	/** @type {Map<string, { creator: string, graduated: boolean } | null>} */
	const out = new Map();
	for (let i = 0; i < mints.length; i += 100) {
		const chunk = mints.slice(i, i + 100);
		const infos = await connection.getMultipleAccountsInfo(chunk.map((m) => bondingCurvePda(new PublicKey(m))));
		chunk.forEach((mint, j) => {
			const info = infos[j];
			const curve = info ? offline.decodeBondingCurveNullable(info) : null;
			out.set(mint, curve ? { creator: curve.creator.toBase58(), graduated: curve.complete === true } : null);
		});
	}
	const amm = new OnlinePumpAmmSdk(connection);
	for (const [mint, row] of out) {
		if (!row?.graduated) continue;
		const pool = await amm.fetchPool(canonicalPumpPoolPda(new PublicKey(mint))).catch(() => null);
		if (pool?.coinCreator) row.creator = pool.coinCreator.toBase58();
	}
	return out;
}

/**
 * Lamports sitting unclaimed in a creator's vaults right now (pump bonding-curve
 * vault plus the PumpSwap coin-creator vault), above rent. Null when the cluster
 * could not be read.
 * @param {import('@solana/web3.js').Connection} connection
 * @param {string} wallet
 * @returns {Promise<bigint | null>}
 */
export async function readUnclaimedLamports(connection, wallet) {
	try {
		const { OnlinePumpSdk } = await import('@pump-fun/pump-sdk');
		const bn = await new OnlinePumpSdk(connection).getCreatorVaultBalanceBothPrograms(new PublicKey(wallet));
		return BigInt(bn.toString());
	} catch {
		return null;
	}
}

/**
 * One wallet's full creator-fee report: lifetime total, unclaimed, derived
 * claimed. `ok: false` when pump.fun could not answer (the caller keeps its last
 * good figure). `unclaimed_lamports` is null when the cluster read failed; the
 * report is still good, claimed is then unknown.
 *
 * @param {import('@solana/web3.js').Connection} connection
 * @param {string} wallet
 */
export async function readCreatorFeeReport(connection, wallet) {
	const [total, unclaimed] = await Promise.all([
		fetchCreatorFeeTotal(wallet),
		readUnclaimedLamports(connection, wallet),
	]);
	if (!total.ok) return { ok: false, error: total.error };
	const earned = total.value;
	// The index can lag a fresh trade by a few seconds while the vault is live, so
	// the vault can briefly exceed the indexed total. Earned is never reported
	// below what is provably sitting in the vault.
	const earnedLamports = unclaimed != null && unclaimed > earned ? unclaimed : earned;
	return {
		ok: true,
		earned_lamports: earnedLamports,
		unclaimed_lamports: unclaimed,
		claimed_lamports: unclaimed == null ? null : earnedLamports - unclaimed,
	};
}
