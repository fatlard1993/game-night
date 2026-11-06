import { requestMatch } from '@vanilla-bean/components/app';

import { checkPassword, clearedCookie, isAdmin, sessionCookie } from '../auth';

import { jsonObject } from './jsonObject';

// argon2 already makes each guess expensive; this adds a growing delay on top so a script on the LAN can't grind
// through a word list while everyone else keeps browsing. The count lets go after a quiet quarter hour: without
// that, a forgotten password cost ten seconds a try for the rest of the process, long after the fumbling stopped.
const failures = new Map();
const MAX_PENALTY_MS = 10_000;
const FORGET_AFTER_MS = 15 * 60 * 1000;

const failureCount = address => {
	const entry = failures.get(address);

	return entry && Date.now() - entry.at < FORGET_AFTER_MS ? entry.count : 0;
};

const penalty = address => Math.min(250 * 2 ** failureCount(address) - 250, MAX_PENALTY_MS);

const sessionRouter = async (request, server) => {
	let match;

	match = requestMatch('GET', '/api/session', request);
	if (match) return Response.json({ admin: isAdmin(request) });

	match = requestMatch('POST', '/api/session', request);
	if (match) {
		const address = server?.requestIP(request)?.address || 'unknown';

		await Bun.sleep(penalty(address));

		const { password } = await jsonObject(request);

		if (!(await checkPassword(password))) {
			failures.set(address, { count: failureCount(address) + 1, at: Date.now() });

			return Response.json({ error: 'Wrong password' }, { status: 401 });
		}

		failures.delete(address);

		return new Response(null, { status: 204, headers: { 'Set-Cookie': sessionCookie() } });
	}

	match = requestMatch('DELETE', '/api/session', request);
	if (match) return new Response(null, { status: 204, headers: { 'Set-Cookie': clearedCookie() } });
};

export default sessionRouter;
