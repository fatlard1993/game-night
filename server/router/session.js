import { checkPassword, clearedCookie, isAdmin, sessionCookie } from '../auth';

import requestMatch from '../utils/requestMatch';

// argon2 already makes each guess expensive; this adds a growing delay on top so a script
// on the LAN can't grind through a wordlist while everyone else keeps browsing
const failures = new Map();
const MAX_PENALTY_MS = 10_000;

const penalty = address => Math.min(250 * 2 ** (failures.get(address) || 0) - 250, MAX_PENALTY_MS);

const sessionRouter = async (request, server) => {
	let match;

	match = requestMatch('GET', '/api/session', request);
	if (match) return Response.json({ admin: isAdmin(request) });

	match = requestMatch('POST', '/api/session', request);
	if (match) {
		const address = server?.requestIP(request)?.address || 'unknown';

		await Bun.sleep(penalty(address));

		const { password } = await request.json();

		if (!(await checkPassword(password))) {
			failures.set(address, (failures.get(address) || 0) + 1);

			return Response.json({ error: 'Wrong password' }, { status: 401 });
		}

		failures.delete(address);

		return new Response(null, { status: 204, headers: { 'Set-Cookie': sessionCookie() } });
	}

	match = requestMatch('DELETE', '/api/session', request);
	if (match) return new Response(null, { status: 204, headers: { 'Set-Cookie': clearedCookie() } });
};

export default sessionRouter;
