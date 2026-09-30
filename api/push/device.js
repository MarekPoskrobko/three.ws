// Native device registry for push: the iOS app's APNs token.
//
//   POST   /api/push/device   { token, platform: 'ios', app_version? }
//          → upsert this device for the signed-in user.
//   DELETE /api/push/device   { token }
//          → remove it (the user turned push off in the app).
//
// The browser equivalent is /api/push/subscribe, which stores a Web Push
// endpoint. The iOS app's WebView has no service worker and so no endpoint;
// it registers with APNs natively and sends the device token here instead.
// src/push-notifications.js picks the right one, so every "turn on push"
// control on the site works unchanged inside the app.
//
// Unlike a Web Push endpoint, a device token is not a URL the server fetches,
// so there is nothing to SSRF-guard: it is validated as hex and only ever
// appears in a path on Apple's host.

import { z } from 'zod';
import { sql } from '../_lib/db.js';
import { getRequestUser } from '../_lib/auth.js';
import { cors, json, method, wrap, error, readJson, rateLimited } from '../_lib/http.js';
import { requireCsrf } from '../_lib/csrf.js';
import { limits } from '../_lib/rate-limit.js';
import { parse } from '../_lib/validate.js';
import { DEVICE_TOKEN_RE } from '../_lib/apns.js';

// Capacitor reports the token as upper-case hex; APNs accepts either case.
// Lower-casing on the way in is what keeps one device from becoming two rows.
const token = z
	.string()
	.trim()
	.transform((s) => s.toLowerCase())
	.refine((s) => DEVICE_TOKEN_RE.test(s), 'token must be an APNs device token (hex)');

const postBody = z.object({
	token,
	platform: z.literal('ios'),
	app_version: z.string().trim().max(32).optional(),
});
const deleteBody = z.object({ token });

export default wrap(async (req, res) => {
	if (cors(req, res, { methods: 'POST,DELETE,OPTIONS', credentials: true })) return;
	if (!method(req, res, ['POST', 'DELETE'])) return;

	const user = await getRequestUser(req);
	if (!user) return error(res, 401, 'unauthorized', 'sign in required');
	if (!(await requireCsrf(req, res, user.id))) return;

	const rl = await limits.pushSubscribe(user.id);
	if (!rl.success) return rateLimited(res, rl);

	if (req.method === 'DELETE') {
		const body = parse(deleteBody, await readJson(req));
		await sql`
			delete from apns_devices
			where user_id = ${user.id} and token = ${body.token}
		`;
		return json(res, 200, { ok: true });
	}

	const body = parse(postBody, await readJson(req));
	await sql`
		insert into apns_devices (user_id, token, app_version)
		values (${user.id}, ${body.token}, ${body.app_version ?? null})
		on conflict (token) do update set
			user_id      = excluded.user_id,
			app_version  = excluded.app_version,
			last_seen_at = now()
	`;

	return json(res, 201, { ok: true });
});
